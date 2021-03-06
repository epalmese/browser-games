(function() {
    var canvas = document.getElementById('canvas');
    canvas.width = 720;
    canvas.height = 480;
    var gamepad = false;
    window.addEventListener("gamepadconnected", function() {
        gamepad = true;
    });
    window.addEventListener("gamepaddisconnected", function() {
        gamepad = false;
    });

    function Player(x, y, direction) { //attributes and functions of the player
        this.x = x; this.y = y; //position on map
        this.direction = direction; //facing direction of the player
        this.maxstamina = 10;
        this.stamina = this.maxstamina;
        this.maxhealth = 10;
        this.health = this.maxhealth;
        this.wand = new Image(100, 260);
        this.wand.src = 'assets/maze_wand.png';
        this.wandbob = 0; //position in jostle cycle of held item
        this.keys = [] //player controls
        document.addEventListener('keydown', this.keypress.bind(this, true), false);
        document.addEventListener('keyup', this.keypress.bind(this, false), false);
    }
    Player.prototype.keypress = function(p, e) {
        this.keys[e.keyCode] = p;
    };
    Player.prototype.gamePad = function(g) {
        if (g[0] != null) {
            this.keys[87] = g[0].axes[1] < -0.25 ? Math.abs(g[0].axes[1]) : 0;
            this.keys[83] = g[0].axes[1] > 0.25 ? g[0].axes[1] : 0;
            this.keys[81] = g[0].axes[0] < -0.25 ? Math.abs(g[0].axes[0]) : 0;
            this.keys[69] = g[0].axes[0] > 0.25 ? g[0].axes[0] : 0;
            this.keys[65] = g[0].axes[2] < -0.25 ? Math.abs(g[0].axes[2]) : 0;
            this.keys[68] = g[0].axes[2] > 0.25 ? g[0].axes[2] : 0;
            this.keys[16] = g[0].buttons[10].value;
        }
    };
    Player.prototype.input = function(map, seconds) {
        if (gamepad == true) this.gamePad(navigator.getGamepads());
        this.speed = this.keys[16] && this.stamina > 0 ? 4 : 2; //speed
        if (this.keys[87]) this.move(this.speed * seconds * this.keys[87], this.direction, map); //w, forward
        if (this.keys[83]) this.move(-this.speed * seconds * this.keys[83], this.direction, map); //s, backward
        if (this.keys[65]) this.direction = (this.direction + (Math.PI * 2) - (Math.PI * seconds) * this.keys[65]) % (Math.PI * 2); //a, turnleft (rotation speed)
        if (this.keys[68]) this.direction = (this.direction + (Math.PI * 2) + (Math.PI * seconds) * this.keys[68]) % (Math.PI * 2); //d, turnright
        if (this.keys[81]) this.move(this.speed * seconds * this.keys[81], this.direction - Math.PI / 2, map); //q, leftward
        if (this.keys[69]) this.move(-this.speed * seconds * this.keys[69], this.direction - Math.PI / 2, map); //e, rightward
        if (this.keys[16] && this.stamina > -0.1) { //shift, running
            this.stamina -= 10 * seconds; //running stamina consume
        }
        else if (this.stamina < 10) {
            this.stamina += 4 * seconds; //passive stamina recharge
        }
    };
    Player.prototype.move = function(magnitude, direction, map) { //moves along grid
        var vx = Math.cos(direction) * magnitude;
        var vy = Math.sin(direction) * magnitude;
        if (map.check(this.x + vx, this.y) == 0) this.x += vx; //moves player if space is empty
        if (map.check(this.x, this.y + vy) == 0) this.y += vy;
        this.wandbob += Math.abs(magnitude);
    };

    function Map(size, time) { //attributes and functions of the map
        this.size = size; //map size
        this.skybox = new Image(); //sky graphic
        this.skybox.src = (9 <= time && time <= 20) ? 'assets/maze_daysky.png' : 'assets/maze_nightsky.png'; //day or night skybox based on hour of day
        this.wallTexture = new Image(); //wall graphic
        this.wallTexture.src = 'assets/maze_wall.png';
        this.audio = new Audio('assets/maze_music.mp3'); //room music
        this.light = 0; //map lighting
        this.field = []; //array for map
        for (var i = 0; i < this.size * this.size; i++) { //randomizes wall locations in grid
            this.field[i] = Math.random() < 0.3 ? 1 : 0; //wall frequency
        }
    }
    Map.prototype.check = function(x, y) { //check value at map grid location
        x = Math.floor(x); y = Math.floor(y); //integer coordinates
        return (x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1) ? 0 : this.field[y * this.size + x]; //return map value at location, 0 outside boundary
    };
    Map.prototype.cast = function(origin, angle, range) {
        var own = this;
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);
        return ray({
            x: origin.x,
            y: origin.y,
            height: 0,
            path: 0
        });
        function ray(origin) {
            var snapX = snap(sin, cos, origin.x, origin.y);
            var snapY = snap(cos, sin, origin.y, origin.x, true);
            var next = snapX.compare < snapY.compare ? scan(snapX, 1, 0, origin.path, snapX.y) : scan(snapY, 0, 1, origin.path, snapY.x);
            return next.path > range ? [origin] : [origin].concat(ray(next));
        }
        function snap(rise, run, x, y, invert) {
            var ix = run < 0 ? Math.ceil(x - 1) - x : Math.floor(x + 1) - x;
            var iy = ix * (rise / run);
            return {
                x: invert ? y + iy : x + ix,
                y: invert ? x + ix : y + iy,
                compare: ix * ix + iy * iy
            };
        }
        function scan(step, stepX, stepY, path, slide) {
            step.height = own.check(step.x - (cos < 0 ? stepX : 0), step.y - (sin < 0 ? stepY : 0)) * 1.2; //height based on map location value
            step.path = path + Math.sqrt(step.compare);
            step.slide = slide - Math.floor(slide); //aligns image with wall
            return step;
        }
    };

    function View(canvas, resolution, fov, distance, time) { //viewport settings and funtions
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width; //viewport width is canvas width
        this.height = canvas.height; //viewport height is canvas height
        this.resolution = resolution; //strips rendered
        this.spacing = this.width / resolution; //strip width
        this.fov = fov; //field of view
        this.distance = distance; //render distance
        this.lightCast = (9 <= time && time <= 20) ? 9 : 3; //range of light cast based on time
        this.scale = (this.width + this.height) / 1000; //scale of overlay
    }
    View.prototype.drawAll = function(player, map) { //draws graphics in order
        this.drawSky(player.direction, map.skybox);
        this.drawField(player, map);
        this.drawWand(player.wand, player.wandbob);
        this.drawBar1(player.maxhealth, player.health);
        this.drawBar2(player.maxstamina, player.stamina);
        this.drawCrosshair();
    };
    View.prototype.drawSky = function(direction, sky) { //skybox
        var width = sky.width * (this.height / sky.height) * 1.8;
        var x = (direction / (Math.PI * 2)) * -width;
        this.ctx.drawImage(sky, x, 0, width, this.height);
        if (x < width - this.width) this.ctx.drawImage(sky, x + width, 0, width, this.height);
    };
    View.prototype.drawField = function(player, map) {
        for (var strip = 0; strip < this.resolution; strip++) {
            var angle = Math.atan2(strip / this.resolution - 0.5, this.fov); //angle of ray cast
            var ray = map.cast(player, player.direction + angle, this.distance); //casts ray
            var x = Math.floor(strip * this.spacing); //current strip x position
            var hit = 0;
            while (++hit < ray.length && ray[hit].height <= 0);
            for (var s = ray.length - 1; s >= 0; s--) {
                if (s == hit) { //if ray meets a wall, stop and draw the texture on it. >= draws everything in render distance uninterupted.
                    var vAngle = ray[s].path * Math.cos(angle); //relative wall height modifier
                    var wallZ = this.height * ray[s].height / vAngle; //modifies wall height by visual angle
                    var top = this.height / 2 * (1 + 1 / vAngle) - wallZ; //top of walls
                    this.ctx.globalAlpha = 1; //opacity of wall texture
                    this.ctx.drawImage(map.wallTexture, Math.floor(map.wallTexture.width * ray[s].slide), 0, 1, map.wallTexture.height, x, top, this.spacing, wallZ); //draws wall texture
                    if (9 > time || time > 20) { //sets darkness opacity at night
                        this.ctx.globalAlpha = Math.max((ray[s].path) / this.lightCast - map.light, 0.5);
                        this.ctx.fillStyle = '#000';
                        this.ctx.fillRect(x, top, this.spacing, wallZ); //draws ambient darkness
                    }
                }
            }
            this.ctx.globalAlpha = 1; //resets alpha for other draws
        }
    };
    View.prototype.drawWand = function(wand, wandbob) { //draws and jostles wand
        this.ctx.drawImage(wand, this.width * 0.7 + (Math.cos(wandbob * 2) * this.scale * 6), this.height * 0.6 + (Math.sin(wandbob * 4) * this.scale * 6), wand.width * this.scale, wand.height * this.scale);
    };
    View.prototype.drawBar1 = function(maxhealth, health) {
        this.ctx.fillStyle = '#e70808';
        this.ctx.fillRect(this.height * 0.016, this.width * 0.628, (health / maxhealth) * 100, 20);
    };
    View.prototype.drawBar2 = function(maxstamina, stamina) {
        this.ctx.fillStyle = '#66def0';
        this.ctx.fillRect(this.height * 0.242, this.width * 0.628, (stamina / maxstamina) * 100, 20);
    };
    View.prototype.drawCrosshair = function() {
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillRect(this.width / 2, (this.height / 2) - 10, 1, 20);
        this.ctx.fillRect((this.width / 2) - 10, this.height / 2, 20, 1);
    };

    function gameLoop() { //updates visuals
        this.frame = this.frame.bind(this);
        this.since = 0;
    }
    gameLoop.prototype.init = function(callback) {
        this.callback = callback; //take frame function
        requestAnimationFrame(this.frame); //initial frame
    };
    gameLoop.prototype.frame = function(elapsed) {
        this.now = (elapsed - this.since) / 1000; //relative second
        this.since = elapsed;
        if (this.now < 0.1) this.callback(this.now); //update rate based on time
        requestAnimationFrame(this.frame); //requests new frame
    };

    var player = new Player(12, -1, Math.PI * 0.2); //new player with starting position
    var time = new Date().getHours(); //gets hour of the day
    var map = new Map(42, time); //new map with size and time
    var view = new View(canvas, 240, 1.1, 16, time); //new viewport with display settings
    var loop = new gameLoop(); //initializes loop for animation and gameplay functions
    loop.init(function frame(now) {
        player.input(map, now);
        map.light = Math.max(map.light * now, 1); //light cast
        view.drawAll(player, map);
    });
    map.audio.addEventListener('ended', function() { //listens for audio end
        this.currentTime = 0; //sets audio playhead to 0
        this.play(); //plays this audio again
    }, false);
    map.audio.play(); //plays audio initially on load
}());
