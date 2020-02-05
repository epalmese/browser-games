(function() {
    var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        width = 500, height = 250,
        level = 1, //starting level
        drawn = false, //the state of the level being drawn
        player = { //properties of the player
            x: width / 2 - 4, //horizontal spawn coordinate
            y: height - 15, //vertical spawn coordinate
            width: 8,
            height: 8,
            speed: 3, //jump speed
            vx: 0, //horizontal velocity
            vy: 0, //vertical velocity
            landed: false, //the state of being on ground
            aerial: false //the state of being off ground
        },
        goal = { //properties of the goal
            x: 0,
            y: 0,
            width: 16,
            height: 16
        },
        gamepad = false, keys = [], //array for keyboard inputs
        borders = [], //array for borders
        platforms = [], //array for platforms
        bad = [], //array for evil
        friction = 0.8, //movement speed modifier
        gravity = 0.3; //jump height modifier

    canvas.width = width;
    canvas.height = height;

    //event listeners for control inputs
    document.body.addEventListener('keydown', function(e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener('keyup', function(e) {
        keys[e.keyCode] = false;
    });
    window.addEventListener("gamepadconnected", function() {
        gamepad = true;
    });
    window.addEventListener("gamepaddisconnected", function() {
        gamepad = false;
    });

    borders.push({ //floor
        x: -2,
        y: height,
        width: width + 4,
        height: 10
    });
    borders.push({ //left border
        x: -2,
        y: 0,
        width: 2,
        height: height
    });
    borders.push({ //right border
        x: width,
        y: 0,
        width: 2,
        height: height
    });

    //level layouts
    function levelOne() {
        platforms.length = 0;
        platforms.push({
            x: 130,
            y: 200,
            width: 80,
            height: 10
        });
        platforms.push({
            x: 210,
            y: 160,
            width: 80,
            height: 10
        });
        platforms.push({
            x: 290,
            y: 200,
            width: 80,
            height: 10
        });
        goal.x = width / 2 - 8;
        goal.y = height / 2;
    }
    function levelTwo() {
        platforms.length = 0;
        bad.length = 0;
        platforms.push({
            x: 130,
            y: 200,
            width: 240,
            height: 10
        });
        platforms.push({
            x: 245,
            y: 160,
            width: 10,
            height: 50
        });
        bad.push({
            x: 500,
            y: 210,
            width: 10,
            height: 40
        });
        player.x = 50;
        player.y = height - 15;
        goal.x = width / 2 + 80;
        goal.y = height / 2 + 50;
    }
    function endScreen() {
        platforms.length = 0;
        bad.length = 0;
        goal.x = -16;
        goal.y = -16;
    }

    //gets gamepad status
    function gamePad(g) {
        if (g[0] != null) {
            keys[37] = g[0].axes[0] < -0.25 ? true : false;
            keys[39] = g[0].axes[0] > 0.25 ? true : false;
            keys[38] = g[0].buttons[0].value;
        }
    }

    //checks key inputs and moves player
    function gameLoop() {
        if (gamepad == true) gamePad(navigator.getGamepads());
        if (keys[37]) { //left arrow key
            if (player.vx > -player.speed) player.vx--;
        }
        if (keys[39]) { //right arrow key
            if (player.vx < player.speed) player.vx++;
        }
        if (keys[38]) { //up arrow key
            if (player.landed && !player.aerial) {
                player.aerial = true;
                player.vy = -player.speed * 2;
            }
        }

        player.vx *= friction;
        player.vy += gravity;
        player.landed = false;

        //loads current level
        if (drawn == false) {
            if (level == 1) levelOne();
            if (level == 2) levelTwo();
            if (level == 3) endScreen();
            drawn = true; //reload prevention
        }

        ctx.clearRect(0, 0, width, height); //clears rectangles (misses borders)
        ctx.fillStyle = '#ffcd37';
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height); //draws goal
        ctx.fillStyle = '#000';
        ctx.fillText('x: ' + player.x.toFixed(1), 5, 10); //shows x coordinate
        ctx.fillText('y: ' + player.y.toFixed(1), 5, 20); //shows y coordinate

        //level events
        if (level == 2) {
            if (bad[0].x > 0) {
                bad[0].x -= 6;
                bad[0].width += 6;
            }
        }
        else if (level == 3) {
            ctx.fillText('DONE', 235, 120); //draws end text
        }

        var dir, i; //loop variables
        //draws borders and handles collisions
        for (i = 0; i < borders.length; i++) {
            ctx.rect(borders[i].x, borders[i].y, borders[i].width, borders[i].height);
            dir = bump(player, borders[i]);
            if (dir == 0 || dir == 1) {
                player.vx = 0;
                player.aerial = false;
            }
            else if (dir == 2) {
                player.landed = true;
                player.aerial = false;
            }
        }

        //draws platforms and handles collisions
        ctx.beginPath();
        for (i = 0; i < platforms.length; i++) {
            ctx.rect(platforms[i].x, platforms[i].y, platforms[i].width, platforms[i].height);
            dir = bump(player, platforms[i]);
            if (dir == 0 || dir == 1) {
                player.vx = 0;
                player.aerial = false;
            }
            else if (dir == 2) {
                player.landed = true;
                player.aerial = false;
            }
            else if (dir == 3) {
                player.vy *= -1;
            }
        }
        ctx.fill();
        ctx.closePath();

        //draws evil and handles loss
        for (i = 0; i < bad.length; i++) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(bad[i].x, bad[i].y, bad[i].width, bad[i].height);
            if (bump(player, bad[i]) != null) {
                player.vy = 0; //cancels jump
                drawn = false;
            }
        }

        //handles victory
        if (bump(player, goal) != null) {
            level += 1; //next level
            player.vy = 0; //cancels jump
            drawn = false;
        }

        if (player.landed == true) player.vy = 0;
        player.x += player.vx;
        player.y += player.vy;

        ctx.fillStyle = '#36627d';
        ctx.fillRect(player.x, player.y, player.width, player.height); //draws player
        requestAnimationFrame(gameLoop);
    }

    //checks object positions and corrects collisions
    function bump(objA, objB) {
        var dX = (objA.x + (objA.width / 2)) - (objB.x + (objB.width / 2)),
            dY = (objA.y + (objA.height / 2)) - (objB.y + (objB.height / 2)),
            hW = (objA.width / 2) + (objB.width / 2),
            hH = (objA.height / 2) + (objB.height / 2),
            cDir = null; //direction of intersection rejection
        if (Math.abs(dX) < hW && Math.abs(dY) < hH) { //detects collision if object A overlaps object B
            var oX = hW - Math.abs(dX), oY = hH - Math.abs(dY); //overlap size
            if (oX >= oY) {
                if (dY > 0) {
                    objA.y += oY;
                    cDir = 3;
                }
                else {
                    objA.y -= oY;
                    cDir = 2;
                }
            }
            else {
                if (dX > 0) {
                    objA.x += oX;
                    cDir = 0;
                }
                else {
                    objA.x -= oX;
                    cDir = 1;
                }
            }
        }
        return cDir;
    }

    gameLoop(); //starts game loop on load
}());
