// Avoid `console` errors in browsers that lack a console.
(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

// Place any jQuery/helper plugins in here.


// Custom plugins here
function Game(selector, options) {
    
    this.canvas                     = jQuery(selector)[0];
    this.ctx                        = this.canvas.getContext('2d');
    this.isRunning                  = true;
    this.isMouseDown                = false;
    this.isDragging                 = false;
    this.click                      = {};
    this.dragpos                    = {};
    this.dragPositions              = [];   // List of previously saved dragpos objects
    this.lastUpdateTimeStamp        = 0;
    // Default settings
    this.backgroundWidth            = 1000;
    this.backgroundHeight           = 1000;
    // Animation settings
    this.backgroundOffset           = { x: 0, y: 0 };
    this.currentBgPosition          = { x: 0, y: 0 };   // Used to track position of current background
    this.shiftBackgroundDirection   = { x: 0, y: 0 };
    // Flags
    this.needRedraw                 = false;
    // Game assets
    this.hero                       = null;
    // Stats object for debugging
    this.stats                      = null;


    // Default action is to resize canvas to fill window
    var $body = jQuery('body');
    this.canvas.width = ($body.width() > this.backgroundWidth ? this.backgroundWidth: $body.width());
    this.canvas.height = ($body.height() > this.backgroundHeight ? this.backgroundHeight: $body.height());

    // Additional options
    if (options) {
        // If not defined, canvas will automatically fill the window
        if (options.width) { this.canvas.width = options.width; }
        if (options.height) { this.canvas.height = options.height; }
    }

    // Adjust canvas for screens like retina display
    if (window.devicePixelRatio > 1) {

        var wd = this.canvas.width;
        var ht = this.canvas.height;
        var pixelRatio = window.devicePixelRatio;

        this.canvas.width = wd * pixelRatio;
        this.canvas.height = ht * pixelRatio;
        this.ctx.scale(pixelRatio, pixelRatio);

        var $canvas = jQuery(this.canvas);
        $canvas.css({ width: wd + 'px', height: ht + 'px' });
    }
}

Game.prototype.canvasSize = function () {

    var wd = this.canvas.width / window.devicePixelRatio;
    var ht = this.canvas.height / window.devicePixelRatio;

    return {
        width: wd,
        height: ht
    };
};

Game.prototype.clickAt = function(x, y) {   
    this.click = { x: x, y: y };
};

Game.prototype.dragStart = function() {
    this.isDragging = true;
    this.dragPositions = [];
};

Game.prototype.drag = function(x, y) {
    this.dragpos = { x: x, y: y };
    this.dragPositions.push(this.dragpos);
};

Game.prototype.dragStop = function() {
    this.isDragging = false;
    this.dragpos = null;
};

/**
 * Call this method to start the game
 */
Game.prototype.start = function(onStarted) {

    var self = this;
    
    // Create Hero object
    this.hero = new Hero(this.ctx);
    this.hero.init(function (hero) {

        // Assign click handlers to canvas
        jQuery(self.canvas).bind('mouseup', { game: self }, self.onCanvasMouseUp)
        .bind('mousemove', { game: self }, self.onCanvasMouseMove)
        .bind('mousedown', { game: self }, self.onCanvasMouseDown);

        // Start the game loop
        self.initGameLoop();
        
        var canvasSize = self.canvasSize();
        var wd = (self.backgroundWidth > canvasSize.width ? canvasSize.width: self.backgroundWidth);
        var ht = (self.backgroundHeight > canvasSize.height ? canvasSize.height: self.backgroundHeight);

        self.hero.setPosition(wd / 2, ht / 2);
        self.hero.draw();

        // Notify listeners
        onStarted(self);
    });
};

/**
 * Call this method to initialize game loop
 */
Game.prototype.initGameLoop = function () {

    var self = this;

    (function gameLoop() {
        
        var now = Date.now();
        self.deltaTime = now - self.lastUpdateTimeStamp;
        self.lastUpdateTimeStamp = now;

        if (self.isRunning == true) {

            if (self.stats) { self.stats.begin(); }

            self.update();
            self.draw();
            self.click = null;

            if (self.stats) { self.stats.end(); }
        }

        requestAnimFrame(gameLoop, self.canvas);
    })();
};

Game.prototype.update = function() {

};

Game.prototype.draw = function() {
    
    // draw here to canvas
    
    if (this.isDragging) {
        console.log(this.dragpos.x, this.dragpos.y);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.dragpos.x, this.dragpos.y, 5, 5);
    }
    
    if (this.needRedraw) {

        this.clearCanvas();

        // Redraw assets
        this.hero.draw();

        this.needRedraw = false;
    }
};

Game.prototype.clearCanvas = function () {

    var wd = this.backgroundWidth;
    var ht = this.backgroundHeight;
    
    this.ctx.clearRect(0, 0, wd, ht);
};

Game.prototype.onCanvasMouseDown = function (evt) {
    evt.data.game.isMouseDown = true;
};

Game.prototype.onCanvasMouseMove = function (evt) {
    
    if (evt.data.game.isMouseDown) {

        if (!evt.data.game.isDragging) {
            evt.data.game.dragStart();
        }

        evt.data.game.drag(evt.pageX, evt.pageY);
    }
};

Game.prototype.onCanvasMouseUp = function (evt) {

    if (!evt.data.game.isDragging) {
        evt.data.game.rotateHeroByPoint(evt.pageX, evt.pageY);
        evt.data.game.moveHeroTo(evt.pageX, evt.pageY);
    }
    else {
        evt.data.game.moveHeroByDragPositions();
        evt.data.game.dragStop();
    }

    evt.data.game.isMouseDown = false;
};

Game.prototype.rotateHeroByPoint = function (px, py) {

    var x = this.hero.x - px;
    var y = this.hero.y - py;
    
    // Determine angle hero is facing using trigonometry calculations
    var angle = Math.atan2(y, x);
    //console.log(angle);

    this.clearCanvas();

    // Save the context's coordinate system first
    this.ctx.save();
    // Now change context's origin to Hero's position
    this.ctx.translate(this.hero.x, this.hero.y);
    // Rotate around new origin
    this.ctx.rotate(angle);
    // Redraw
    //this.drawBackground();
    //this.hero.draw();
    this.ctx.drawImage(this.hero.image, this.hero.heroWidth / -2, this.hero.heroHeight / -2, this.hero.heroWidth, this.hero.heroHeight);
    // Restore context's coordinate system
    this.ctx.restore();
};

/**
 * Move Hero to x,y
 */
Game.prototype.moveHeroTo = function (px, py, steps, callback) {
    
    var x = this.hero.x - px;
    var y = this.hero.y - py;

    if (x < 0) { this.shiftBackgroundDirection.x = -1; }
    else if (x > 0) { this.shiftBackgroundDirection.x = 1; }
    else { this.shiftBackgroundDirection.x = 0; }

    if (y < 0) { this.shiftBackgroundDirection.y = -1; }
    else if (y > 0) { this.shiftBackgroundDirection.y = 1; }
    else { this.shiftBackgroundDirection.y = 0; }

    this.backgroundOffset.x = Math.floor(x);
    this.backgroundOffset.y = Math.floor(y);

    this.shiftBackground(steps, callback);
};

Game.prototype.moveHeroByDragPositions = function () {

    var self = this;
    var count = 0;
    var maxDragPos = this.dragPositions.length;
    var dragPos;

    var func = function () {
        
        if (count < maxDragPos) {
            dragPos = self.dragPositions.shift();

            // Rotate hero
            self.rotateHeroByPoint(dragPos.x, dragPos.y);

            self.moveHeroTo(dragPos.x, dragPos.y, 5, function () {
                // Function is called when movement is completed
                func();
            });

            count++;
        }
    };

    func();
};

Game.prototype.shiftBackground = function (s, cb) {
    
    var self = this;
    var $canvas = jQuery(this.canvas);
    var xInc, yInc;
    var steps = s;

    // Determine diagonal distance required to travel per step for each axis
    if (!steps) {
        steps = this.hero.speed;
    }

    xInc = Math.floor(Math.abs(this.backgroundOffset.x) / steps);
    yInc = Math.floor(Math.abs(this.backgroundOffset.y) / steps);

    var count = 0;
    /*
    console.log(xInc, yInc);
    console.log(this.backgroundOffset);
    console.log(this.shiftBackgroundDirection);
    */
    var shiftFunc = function () {
        
        if (count < steps) {
            
            // Offset X-axis
            self.currentBgPosition.x += xInc * self.shiftBackgroundDirection.x;
            
            // Offset Y-axis
            self.currentBgPosition.y += yInc * self.shiftBackgroundDirection.y;

            //console.log(self.currentBgPosition);

            $canvas.css({
                backgroundPositionX: self.currentBgPosition.x + 'px',
                backgroundPositionY: self.currentBgPosition.y + 'px'
            });

            count++;

            setTimeout(shiftFunc, 1000 / 60);
        }
        else {
            if (typeof cb === 'function') { cb(); }
        }
    };

    setTimeout(shiftFunc, 1000 / 60);
};

/**
 * Calling this method will enable Mr Doob's stats plugin
 */
Game.prototype.enableStats = function () {

    this.stats = new Stats();
    this.stats.setMode(0); // 0: fps, 1: ms
    // Align top-left
    this.stats.domElement.style.position    = 'absolute';
    this.stats.domElement.style.left        = '0px';
    this.stats.domElement.style.top         = '0px';

    document.body.appendChild(this.stats.domElement);
};

/* ============ [Hero] ============ */
function Hero(context) {
    this.speed          = 20;  // this will set how fast hero will move in terms of steps required to reach destination
    this.x              = 0;
    this.y              = 0;
    this.ctx            = context;
    this.image          = null;
    this.heroWidth      = 58;
    this.heroHeight     = 50;
}

Hero.prototype.init = function (onInited) {

    var self = this;

    this.image = new Image();
    this.image.addEventListener('load', function (evt) {

        // Draw onto canvas
        //self.draw();

        onInited(self);
    });
    this.image.src = 'img/ladybug.png';
};

Hero.prototype.draw = function () {
    // Draw onto canvas
    this.ctx.drawImage(this.image,
        this.x - this.heroWidth / 2, this.y - this.heroHeight / 2,
        this.heroWidth, this.heroHeight);
};

Hero.prototype.setPosition = function (x, y) {
    this.x = x;
    this.y = y;
};
