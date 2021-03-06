(function() {
    var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        width = 420, height = 560, //width and height of game window
        paddles = [2], //array for paddles the player controls
        mouse = {}, //object to contain mouse location
        score = 0, //number of bounces
        fx = [], //array for effect particles
        fxPoint = {}, //position of effect
        fxDo = false, //queue effect indicator
        lose = false, playing = false, //if the game is over or not
        anim, //animation state
        torb, direction, //from top or bottom paddle
        sfx = new Audio('assets/space_laser.mp3'), //bounce sound
        ball = { //parameters and draw instructions for ball
            x: 50, //default starting x coordinate
            y: 80, //default starting y coordinate
            r: 8, //ball radius
            vx: 3, //x velocity
            vy: 6, //y velocity
            draw: function() {
                ctx.beginPath();
                ctx.fillStyle = '#56bc8a'; //ball colour
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
                ctx.fill();
            }
        },
        playBtn = { //parameters and draw instructions for play button
            w: 120,
            h: 60,
            x: width / 2 - 60,
            y: height / 2 - 30,
            draw: function() {
                ctx.strokeStyle = '#fff'; //button colour
                ctx.lineWidth = '2';
                ctx.font = '18px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (lose == false) {
                    ctx.strokeRect(this.x, this.y, this.w, this.h);
                    ctx.fillText('Play', width / 2, height / 2);
                }
                else {
                    ctx.strokeRect(this.x, this.y - 25, this.w, this.h);
                    ctx.fillText('Again', width / 2, height / 2 - 25);
                }
            }
        },
        tweetBtn = { //parameters and draw instructions for tweet button
            w: 120,
            h: 30,
            x: width / 2 - 60,
            y: height / 2 + 100,
            draw: function() {
                ctx.lineWidth = '2';
                ctx.strokeRect(this.x, this.y, this.w, this.h);
                ctx.font = '18px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Tweet Score', width / 2, height / 2 + 115);
            }
        };

    canvas.width = width;
    canvas.height = height;

    //event listeners for mouse tracking and clicks
    canvas.addEventListener('mousemove', function(e) {
        mouse.x = e.pageX - canvas.offsetLeft; mouse.y = e.pageY;
    });
    canvas.addEventListener('mousedown', function(e) {
        if (lose == false && playing == false) {
            if (e.pageX >= playBtn.x + canvas.offsetLeft && e.pageX <= playBtn.x + playBtn.w + canvas.offsetLeft) { //on click
                playing = true;
                refresh();
            }
        }
        else if (lose == true && playing == false) { //if game is over and play button clicked
            if (e.pageX >= playBtn.x + canvas.offsetLeft && e.pageX <= playBtn.x + playBtn.w + canvas.offsetLeft && e.pageY <= playBtn.y + playBtn.h - 25 + canvas.offsetTop) {
                ball.x = Math.floor((Math.random() * 360) + 30); //random x coordinate
                score = 0;
                ball.y = 80; //default y coordinate
                ball.vx = Math.random() < 0.5 ? 3 : -3; //random x direction
                ball.vy = 6;
                lose = false;
                playing = true;
                refresh();
            }
            if (e.pageX >= tweetBtn.x + canvas.offsetLeft && e.pageX <= tweetBtn.x + tweetBtn.w + canvas.offsetLeft && e.pageY >= tweetBtn.y + canvas.offsetTop) {
                var txt = 'I got ' + score + ' points in this game - ' + window.location.href + ' @enricopalmese';
                var twt = 'http://twitter.com/home?status=' + encodeURIComponent(txt);
                window.open(twt, '_blank');
            }
        }
    });

    function Paddle(pos) { //paddle properties
        this.w = 120;
        this.h = 10;
        this.x = width / 2 - this.w / 2; //centers paddles in canvas
        this.y = (pos == 'top') ? 0 : height - this.h;
    }
    paddles.push(new Paddle('top')); //adds top paddle
    paddles.push(new Paddle('bot')); //adds bottom paddle

    //randomizes effect particles
    function makeBlast(x, y, d) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.vx = Math.random() * 2 - 1;
        this.vy = Math.random() * 1.5 * d;
    }

    //updates object positions and draws them
    function gameLoop() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height); //clears canvas
        for (var i = 0; i < paddles.length; i++) {
            ctx.fillStyle = '#fff'; //paddle colour
            ctx.fillRect(paddles[i].x, paddles[i].y, paddles[i].w, paddles[i].h);
        }
        ball.draw();
        ctx.font = '14px Arial, sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText('Bounces: ' + score, 20, 25); //draws score counter
        if (mouse.x && mouse.y) { //moves paddles with mouse
            paddles[1].x = mouse.x - paddles[1].w / 2;
            paddles[2].x = mouse.x - paddles[2].w / 2;
        }
        ball.x += ball.vx; //moves the ball based on set velocities
        ball.y += ball.vy;
        if (checkHit(ball, paddles[1])) {
            onHit(ball, paddles[1]);
        }
        else if (checkHit(ball, paddles[2])) {
            onHit(ball, paddles[2]);
        }
        else {
            if (ball.y > height || ball.y < 0) { //if ball hits endzones
                ctx.font = '20px Arial, sans-serif';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText('Whoops :O You bounced ' + score + ' times!', width / 2, height / 2 + 25);
                cancelAnimationFrame(anim); //pause animation
                lose = true; //set loss
                playing = false;
                playBtn.draw(); //draws play button
                tweetBtn.draw(); //draws tweet button
            }
            if (ball.x + ball.r > width || ball.x - ball.r < 0) { //if ball hits walls
                ball.vx = -ball.vx; //invert x velocity of ball
            }
        }
        if (fxDo == true) { //if mark is set, add particles to array
            for (var k = 0; k < 30; k++) {
                fx.push(new makeBlast(fxPoint.x, fxPoint.y, direction));
            }
        }
        if (playing == false) playBtn.draw(); //draws start button on load
        for (var j = 0; j < fx.length; j++) { //draws effect particles
            ctx.beginPath();
            ctx.fillStyle = '#56bc8a';
            if (fx[j].radius > 0) {
                ctx.arc(fx[j].x, fx[j].y, fx[j].radius, 0, Math.PI * 2, false);
            }
            ctx.fill();
            fx[j].x += fx[j].vx;
            fx[j].y += fx[j].vy;
            fx[j].radius = Math.max(fx[j].radius - 0.02, 0); //shrinks
        }
        fxDo = false; //resets effect trigger
    }

    //checks for ball and paddle collisions
    function checkHit(ball, pdl) {
        if (ball.x + ball.r >= pdl.x && ball.x - ball.r <= pdl.x + pdl.w) {
            if (ball.y >= (pdl.y - pdl.h) && pdl.y > 0) {
                torb = 1;
                return true;
            }
            else if (ball.y <= pdl.h && pdl.y == 0) {
                torb = 2;
                return true;
            }
            else {
                return false;
            }
        }
    }
    function onHit(ball, pdl) { //on collision
        ball.vy = -ball.vy; //invert y velocity of ball to bounce
        if (torb == 1) { //set up effect
            ball.y = pdl.y - pdl.h;
            fxPoint.y = ball.y + ball.r;
            direction = -1; //effect direction
        }
        else if (torb == 2) {
            ball.y = pdl.h + ball.r;
            fxPoint.y = ball.y - ball.r;
            direction = 1;
        }
        if (score % 3 == 0 && Math.abs(ball.vx) <= 15) { //speed increase increment with maximum
            ball.vx += (ball.vx < 0) ? -1 : 1;
            ball.vy += (ball.vy < 0) ? -2 : 2;
        }
        score++; //add bounce
        sfx.currentTime = 0; //resets playhead of collision sound
        sfx.play(); //plays collision sound
        fxPoint.x = ball.x;
        fxDo = true;
    }

    function refresh() { //animates canvas
        anim = requestAnimationFrame(refresh);
        gameLoop();
    }

    gameLoop(); //starts game loop on load
}());
