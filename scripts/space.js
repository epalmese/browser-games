(function() {
    var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        width = 600, height = 550, //width and height of game window
        gamepad = false, keys = [], //gamepad status and array for keyboard inputs
        shipX = (width / 2) - 25, shipY = height - 75, shipW = 50, shipH = 57,
        lasers = [], cd = false, //array for lasers and cooldown indicator
        enemyTotal = 6, //total number of enemies
        enemies = [], spawned = false, //array for enemies and spawned indicator
        enemyX, enemyY, enemyW = 50, enemyH = 38, speed, //attributes of enemies
        score = 0, lives = 3, timer, secs = 60,
        firstStart = false, lose = false, win = false,
        starX = 0, starY = 0, starY2 = -600,
        sfx = new Audio('assets/space_menu.mp3'), //audio object with default menu theme
        pew = 'assets/space_laser.mp3', //laser shoot sound
        enemy = new Image(),
        ship = new Image(),
        backdrop = new Image();
    enemy.src = 'assets/space_enemy.png';
    ship.src = 'assets/space_player.png';
    backdrop.src = 'assets/space_background.jpg';

    canvas.width = width;
    canvas.height = height;

    //event listeners for control inputs and clicks
    document.body.addEventListener('keydown', function(e) {
        keys[e.keyCode] = 1;
    });
    document.body.addEventListener('keyup', function(e) {
        keys[e.keyCode] = 0;
    });
    window.addEventListener("gamepadconnected", function() {
        gamepad = true;
    });
    window.addEventListener("gamepaddisconnected", function() {
        gamepad = false;
    });

    canvas.addEventListener('click', gameStart);
    function gameStart() {
        canvas.removeEventListener('click', gameStart);
        firstStart = true;
        sfx.pause(); //pauses loaded audio
        sfx.src = pew;
        timer = setInterval(function() {
            secs -= 1;
        }, 1000); //game timer
    }

    //moves and draws player ship when keys are pressed
    function moveShip() {
        if (keys[37] > 0) shipX -= 5 * keys[37]; //left arrow key
        if (keys[39] > 0) shipX += 5 * keys[39]; //right arrow key
        if (keys[38] > 0) shipY -= 5 * keys[38]; //up arrow key
        if (keys[40] > 0) shipY += 5 * keys[40]; //down arrow key
        if (keys[32] && cd == false) { //space bar
            lasers.push([shipX + 25, shipY - 20]); //adds laser with position
            sfx.play(); //plays laser sound
            cd = true;
            setTimeout(function() {
                cd = false;
            }, 250); //shot cooldown timer
        }
        if (shipX <= 0) shipX = 0;
        if ((shipX + shipW) >= width) shipX = width - shipW;
        if (shipY <= 0) shipY = 0;
        if ((shipY + shipH) >= height) shipY = height - shipH;
        ctx.drawImage(ship, shipX, shipY);
    }

    //gets gamepad status
    function gamePad(g) {
        if (g[0] != null) {
            keys[37] = g[0].axes[0] < -0.25 ? Math.abs(g[0].axes[0]) : 0;
            keys[39] = g[0].axes[0] > 0.25 ? g[0].axes[0] : 0;
            keys[38] = g[0].axes[1] < -0.25 ? Math.abs(g[0].axes[1]) : 0;
            keys[40] = g[0].axes[1] > 0.25 ? g[0].axes[1] : 0;
            keys[32] = g[0].buttons[0].value;
            if (g[0].buttons[9].value == 1) {
                if (!firstStart) {
                    gameStart();
                }
                else if (lose || win) {
                    againButton();
                }
            }
        }
    }

    //loads enemies with positions in to array
    function spawnEnemies() {
        enemyX = 50; enemyY = -45; speed = 7; //set positions and speed
        for (var i = 0; i < enemyTotal; i++) {
            enemies.push([enemyX, enemyY, enemyW, enemyH, speed]);
            enemyX += enemyW + 40;
        }
        spawned = true;
    }
    //moves enemies down the canvas and then brings them back to the top
    function moveEnemies() {
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i][1] <= height) {
                enemies[i][1] += enemies[i][4];
            }
            else if (enemies[i][1] > height - 1) {
                enemies[i][1] = -45;
                enemies[i][0] = Math.random() < 0.8 ? enemies[i][0] : shipX + 1; //enemy ships may chase player ship
            }
            ctx.drawImage(enemy, enemies[i][0], enemies[i][1]);
        }
    }

    //moves existing lasers and removes them if out of bounds
    function moveLasers() {
        if (lasers.length > 0) {
            for (var i = 0; i < lasers.length; i++) {
                lasers[i][1] -= 10; //laser speed
                ctx.fillStyle = '#46ddb3';
                ctx.fillRect(lasers[i][0], lasers[i][1], 4, 20); //draw laser
                if (lasers[i][1] < -10) lasers.splice(i, 1); //remove laser if off screen
            }
        }
    }

    //draws 2 backgrounds and cycles them down forever
    function drawBackdrop() {
        ctx.drawImage(backdrop, starX, starY);
        ctx.drawImage(backdrop, starX, starY2);
        if (starY > 600) starY = -599;
        if (starY2 > 600) starY2 = -599;
        starY += 1;
        starY2 += 1;
    }

    //checks for laser collision with enemy ships and removes both if found
    function hitLaser() {
        var remove = false;
        for (var i = 0; i < lasers.length; i++) {
            for (var j = 0; j < enemies.length; j++) {
                if (lasers[i][1] >= (enemies[j][1]) && lasers[i][1] <= (enemies[j][1] + enemies[j][3]) && lasers[i][0] >= enemies[j][0] && lasers[i][0] <= (enemies[j][0] + enemies[j][2])) {
                    remove = true;
                    enemies.splice(j, 1);
                    score += 1;
                    enemies.push([(Math.random() * 500) + 50, -45, enemyW, enemyH, speed]);
                }
            }
            if (remove == true) {
                lasers.splice(i, 1);
                remove = false;
            }
        }
    }

    //checks for player collision with enemy ships
    function hitShip() {
        var shipXW = shipX + shipW, shipYH = shipY + shipH;
        for (var i = 0; i < enemies.length; i++) {
            if (shipX > enemies[i][0] && shipX < enemies[i][0] + enemyW && shipY > enemies[i][1] && shipY < enemies[i][1] + enemyH) loseLife();
            if (shipXW < enemies[i][0] + enemyW && shipXW > enemies[i][0] && shipY > enemies[i][1] && shipY < enemies[i][1] + enemyH) loseLife();
            if (shipYH > enemies[i][1] && shipYH < enemies[i][1] + enemyH && shipX > enemies[i][0] && shipX < enemies[i][0] + enemyW) loseLife();
            if (shipYH > enemies[i][1] && shipYH < enemies[i][1] + enemyH && shipXW < enemies[i][0] + enemyW && shipXW > enemies[i][0]) loseLife();
        }
    }

    //when player collides with an enemy, subtract a life or kill them
    function loseLife() {
        lives -= 1;
        if (lives > 0) {
            reset();
        }
        else if (lives == 0) {
            lose = true;
        }
        else if (lives < 0) {
            lives = 0; //prevents negative lives if final collision is with multiple enemies
        }
    }

    //resets ship positions and clears array for lasers
    function reset() {
        shipX = (width / 2) - 25; shipY = height - 75;
        lasers = [];
        if (spawned) {
            var enemyresetX = 50;
            for (var i = 0; i < enemies.length; i++) {
                enemies[i][0] = enemyresetX;
                enemies[i][1] = -45;
                enemyresetX = enemyresetX + enemyW + 40;
            }
        }
    }

    //shows the try again button and removes it once clicked
    function againButton() {
        canvas.removeEventListener('click', againButton, false);
        lose = false; win = false; lives = 3; score = 0; secs = 60; enemies = []; spawned = false; //resets relevant variables
        timer = setInterval(function() {
            secs -= 1;
        }, 1000); //restart game timer
        reset();
    }

    //draws text for score and lives, and if player is out of lives, draws the game over menu (with event listener for being clicked)
    function scorer() {
        ctx.fillStyle = '#fff';
        if (!firstStart) {
            ctx.font = 'bold 50px VT323';
            ctx.fillText('Space Shooter', width / 2 - 140, height / 2 - 40);
            ctx.font = 'bold 20px VT323';
            ctx.fillText('Click to Start', width / 2 - 65, height / 2 - 10);
            ctx.fillText('- Arrow keys to move', width / 2 - 95, height / 2 + 30);
            ctx.fillText('- Space to shoot', width / 2 - 95, height / 2 + 60);
            ctx.fillText('- Destroy 100 ships', width / 2 - 95, height / 2 + 90);
            ctx.fillText('- You have 60 seconds', width / 2 - 95, height / 2 + 120);
            sfx.play(); //plays menu sound
        }
        if (score < 100) {
            ctx.fillText('Hits: ', 10, 30);
            ctx.fillText(score, 70, 30);
            ctx.fillText('Lives:', 10, 55);
            ctx.fillText(lives, 70, 55);
            ctx.fillText('Time:     s', 10, 80);
            ctx.fillText(secs, 70, 80);
        }
        if (lose && !win) { //if player is not alive
            clearInterval(timer);
            ctx.fillText('Game Over!', 255, height / 2);
            ctx.fillRect((width / 2) - 50, (height / 2) + 12, 95, 30);
            ctx.fillStyle = '#000';
            ctx.fillText('Try Again?', 255, (height / 2) + 35);
            canvas.addEventListener('click', againButton, false);
        }
        if (score >= 50 && score < 80) { //if 50 enemies are hit, difficulty increases
            ctx.fillText('Enemy fleet is thinning!', 100, 30);
            speed = 9;
        }
        if (score >= 80 && score < 100) { //if 80 enemies are hit, difficulty increases
            ctx.fillText('Enemy fleet is ravaged!', 100, 30);
            speed = 11;
        }
        if (score >= 100) { //if 100 enemies are hit, player wins
            win = true;
            score += (lives * 5); //adds points for remaining lives
            lives = 0; //sets lives to 0 to avoid looping score gain
            score += secs;
            secs = 0;
            ctx.fillText('Score: ', 10, 30);
            ctx.fillText(score, 70, 30); //final score display
            ctx.fillText('Victory!!!', 255, height / 2);
            ctx.fillRect((width / 2) - 50, (height / 2) + 12, 95, 30);
            ctx.fillStyle = '#000';
            ctx.fillText('Play Again?', 255, (height / 2) + 35);
            canvas.addEventListener('click', againButton, false);
        }
    }

    //the game loop, which calls gameplay functions
    function gameLoop() {
        ctx.clearRect(0, 0, width, height);
        drawBackdrop();
        if (gamepad == true) gamePad(navigator.getGamepads());
        if (!lose && firstStart && lives > 0) {
            if (!spawned) spawnEnemies();
            hitLaser();
            hitShip();
            moveLasers();
            moveShip();
            moveEnemies();
        }
        if (secs <= 0) {
            clearInterval(timer);
            lose = true;
        }
        scorer();
        setTimeout(gameLoop, 1000 / 40); //game loop refresh rate
    }

    gameLoop(); //starts game loop on load
}());
