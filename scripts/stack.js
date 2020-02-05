(function() {
    var canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d'),
        width = 300, height = 540,
        rows = 18, cols = 10, //game grid
        cellW = width / cols, cellH = height / rows,
        lose, score = 0, best = 0,
        active = [], //array for active falling shape
        activeX, activeY, //position of active falling shape
        grid = [], //array for game grid
        shapes = [ //shape templates
            [1, 1, 1, 1], //I
            [1, 1, 1, 0, //L
                1],
            [1, 1, 1, 0, //J
                0, 0, 1],
            [0, 1, 1, 0, //O
                0, 1, 1],
            [1, 1, 0, 0, //Z
                0, 1, 1],
            [0, 1, 1, 0, //S
                1, 1],
            [1, 1, 1, 0, //T
                0, 1, 0]
        ],
        clrs = ['#43e0a9', '#41ba90', '#41a381', '#3fa681', '#318163', '#235c46', '#15372a'],
        interval, paused = false, //game timing
        x, y, z, i; //global loop variables

    canvas.width = width;
    canvas.height = height;

    //event listener for keyboard inputs
    document.body.addEventListener('keydown', function(e) {
        if (e.keyCode == 37 && paused == false) { //left arrow key
            if (valid(-1))--activeX;
        }
        if (e.keyCode == 39 && paused == false) { //right arrow key
            if (valid(1))++activeX;
        }
        if (e.keyCode == 40 && paused == false) { //down arrow key
            if (valid(0, 1))++activeY;
        }
        if (e.keyCode == 38 && paused == false) { //up arrow key
            if (valid(0, 0, rotate(active))) active = rotate(active);
        }
        if (e.keyCode == 32 && paused == false) { //space bar
            while (valid(0, 1)) update(); //drops shape until invalid
        }
        if (e.keyCode == 80) { //p key
            if (paused == false) {
                clearInterval(interval);
                paused = true;
            }
            else if (paused == true) {
                interval = setInterval(update, 200);
                paused = false;
            }
        }
        refresh(); //draws grid on input
    });

    //creates new active shape from templates
    function getShape() {
        var rnd = Math.floor(Math.random() * shapes.length), shape = shapes[rnd]; //random shape template
        for (y = 0; y < 4; ++y) {
            active[y] = [];
            for (x = 0; x < 4; ++x) {
                i = 4 * y + x;
                if (typeof shape[i] != 'undefined' && shape[i]) {
                    active[y][x] = rnd + 1;
                }
                else {
                    active[y][x] = 0;
                }
            }
        }
        activeX = 4; //default shape position
        activeY = 0;
    }

    //handles shape landing and row clears
    function update() {
        if (valid(0, 1)) {
            ++activeY;
        }
        else { //if shape can not fall
            for (y = 0; y < 4; ++y) { //locks shape at current position
                for (x = 0; x < 4; ++x) {
                    if (active[y][x]) {
                        grid[y + activeY][x + activeX] = active[y][x];
                    }
                }
            }
            //checks for filled rows and clears them
            for (y = rows - 1; y >= 0; --y) {
                var rowFilled = true;
                for (x = 0; x < cols; ++x) {
                    if (grid[y][x] == 0) {
                        rowFilled = false;
                        break;
                    }
                }
                if (rowFilled) {
                    for (z = y; z > 0; --z) {
                        for (x = 0; x < cols; ++x) {
                            grid[z][x] = grid[z - 1][x];
                        }
                    }
                    ++y;
                    score += 1;
                }
            }
            if (lose) newGame(); //reset game
            getShape();
        }
    }

    //rotates current shape clockwise
    function rotate(active) {
        var nextPos = [];
        for (y = 0; y < 4; ++y) {
            nextPos[y] = [];
            for (x = 0; x < 4; ++x) {
                nextPos[y][x] = active[3 - x][y];
            }
        }
        return nextPos;
    }

    //checks for space in path of current shape
    function valid(offsetX, offsetY, nextPos) {
        offsetX = offsetX || 0; offsetY = offsetY || 0;
        offsetX = activeX + offsetX; offsetY = activeY + offsetY;
        nextPos = nextPos || active;
        for (y = 0; y < 4; ++y) {
            for (x = 0; x < 4; ++x) {
                if (nextPos[y][x]) {
                    if (typeof grid[y + offsetY] == 'undefined' || typeof grid[y + offsetY][x + offsetX] == 'undefined' || grid[y + offsetY][x + offsetX] || x + offsetX < 0 || y + offsetY >= rows || x + offsetX >= cols) {
                        if (offsetY == 1) lose = true; //lose if shape is over top
                        return false; //invalid
                    }
                }
            }
        }
        return true;
    }

    //starts game
    function newGame() {
        if (score > best) best = score; //sets high score
        score = 0; //sets score to 0
        clearInterval(interval); //stops game
        for (y = 0; y < rows; ++y) { //clears grid
            grid[y] = [];
            for (x = 0; x < cols; ++x) {
                grid[y][x] = 0;
            }
        }
        lose = false; //sets state of loss to false
        interval = setInterval(update, 200); //game speed
        getShape();
    }

    //shows number of row clears in top left
    function showScore() {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText('Clears: ', 10, 30);
        ctx.fillText(score, 70, 30);
        ctx.fillText('Best: ', 10, 50);
        ctx.fillText(best, 70, 50);
        if (paused == true) ctx.fillText('PAUSED', 10, 75);
    }

    //draws background grid
    function drawGrid() {
        ctx.beginPath();
        for (i = 0; i < cellW; ++i) {
            ctx.moveTo(0 + (i * cellW), 0);
            ctx.lineTo(0 + (i * cellW), height);
        }
        for (i = 0; i < cellH; ++i) {
            ctx.moveTo(0, 0 + (i * cellH));
            ctx.lineTo(width, 0 + (i * cellH));
        }
        ctx.strokeStyle = '#f0f7ee';
        ctx.stroke();
    }

    //draws grid and scoreboard
    function refresh() {
        ctx.clearRect(0, 0, width, height); //clears rectangles on grid
        drawGrid();
        showScore();
        for (x = 0; x < cols; ++x) { //draws landed shapes
            for (y = 0; y < rows; ++y) {
                if (grid[y][x]) {
                    ctx.fillStyle = clrs[grid[y][x] - 1];
                    ctx.fillRect(cellW * x, cellH * y, cellW - 1, cellH - 1);
                }
            }
        }
        for (y = 0; y < 4; ++y) { //draws current shape
            for (x = 0; x < 4; ++x) {
                if (active[y][x]) {
                    ctx.fillStyle = clrs[active[y][x] - 1];
                    ctx.fillRect(cellW * (activeX + x), cellH * (activeY + y), cellW - 1, cellH - 1);
                }
            }
        }
    }
    setInterval(refresh, 50); //refresh rate

    newGame(); //starts game on load
}());
