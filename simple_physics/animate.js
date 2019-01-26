// Set up global variables
GRAVITY = 0.081;
FRICTION = 0.6;
ROLLING_FRICTION = 0.92;
BALL_DIAMETER = 18;
balls = [];

mouseDownX = 0;
mouseDownY = 0;

worldX = 600 - BALL_DIAMETER / 2;
worldY = 600 - BALL_DIAMETER / 2;

// Set up function bindings and canvas
document.getElementById('start').onclick = start;
c = document.getElementById("myCanvas");
c.onmousedown = mouseDown;
c.onmouseup = mouseUp;
ctx = c.getContext("2d");
ctx.fillStyle = "white";

// start the animation loop
requestAnimationFrame(frame);

// this is the main loop of the simulation:
// apply forces to all elements, do collision handling,
// draw updated positions and request new animation frame
function frame() {
    for (var i = 0; i < balls.length; i++)
        balls[i].applyForces();

    collisionHandling();

    ctx.clearRect(0, 0, 600, 600);

    for (i = 0; i < balls.length; i++)
        balls[i].draw();

    requestAnimationFrame(frame);
}

function start() {
    generateRandomElements(document.getElementById("myRange").value);
}

function generateRandomElements(count) {
    var X = 6;
    var Y = 100;
    for (var i = 0; i < count; i++) {
        if (X > 550) {
            X = 6;
            Y += 30;
        }
        balls.push(new Ball(X += 30, Y, Math.random() * 8, Math.random() * 6));
    }
}

// get mouse coordinates
function mouseDown() {
    mouseDownX = event.clientX - 10;     // Get the horizontal coordinate
    mouseDownY = event.clientY - 200;    // Get the vertical coordinate
}

// get mouse coordinates and spawn new element
function mouseUp() {
    var mouseUpX = event.clientX - 10;     // Get the horizontal coordinate
    var mouseUpY = event.clientY - 200;    // Get the vertical coordinate

    var posX = mouseUpX;
    var posY = mouseUpY;

    var velX = (mouseUpX - mouseDownX) * 0.1;
    var velY = (mouseUpY - mouseDownY) * 0.1;

    balls.push(new Ball(posX, posY, velX, velY));
}

// detect and resolve collisions
function collisionHandling() {
    // reverse velocities at borders
    for (var i = 0; i < balls.length; i++)
        balls[i].handleBorderCollision();

    // insertion sort on elements array
    insertionSort(balls);

    // detect and resolve collisions only on possibly colliding
    // elements using sweep and prune on sorted array
    for (i = 0; i < balls.length - 1; i++)
        for (var j = i + 1; j < balls.length
        && balls[i].posX + BALL_DIAMETER >= balls[j].posX; j++)
            if (balls[i].detectCollision(balls[j]))
                balls[i].resolveCollision(balls[j]);

}

function insertionSort(items) {
    var len = items.length, // number of items in the array
        value, // the value currently being compared
        i, // index into unsorted section
        j; // index into sorted section

    for (i = 0; i < len; i++) {
        // store the current value because it may shift later
        value = items[i];

        /*
         * Whenever the value in the sorted section is greater than the value in
         * the unsorted section, shift all items in the sorted section over by
         * one. This creates space in which to insert the value.
         */
        for (j = i - 1; j > -1 && items[j].posX > value.posX; j--)
            items[j + 1] = items[j];

        items[j + 1] = value;
    }
}

Ball = function (posX, posY, velX, velY) {
    this.posX = posX;
    this.posY = posY;
    this.velX = velX;
    this.velY = velY;
}

Ball.prototype.applyForces = function () {
    // apply gravity
    if (this.posY < worldY)
        this.velY += GRAVITY;

    // update positions
    this.posX += this.velX;
    this.posY += this.velY;
}

// detect border collisions, add friction on contact
Ball.prototype.handleBorderCollision = function () {
    if (this.posX > worldX) {
        this.posX = worldX;
        this.velX = -this.velX * FRICTION;
    } else if (this.posX < BALL_DIAMETER / 2) {
        this.posX = BALL_DIAMETER / 2;
        this.velX = -this.velX * FRICTION;
    }
    if (this.posY > worldY) {
        this.posY = worldY;
        this.velY = -this.velY * FRICTION;
        this.velX = this.velX * ROLLING_FRICTION;
    } else if (this.posY < BALL_DIAMETER / 2) {
        this.posY = BALL_DIAMETER / 2;
        this.velY = -this.velY * FRICTION;
    }
}

Ball.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(Math.round(this.posX), Math.round(this.posY), BALL_DIAMETER / 2, 0, 2 * Math.PI);
    ctx.stroke();
}

Ball.prototype.detectCollision = function (ball) {
    if (this == ball)
        return false;

    var distX = ball.posX - this.posX;
    var distY = ball.posY - this.posY;
    var distance = distX * distX + distY * distY;

    if (distance <= BALL_DIAMETER * BALL_DIAMETER)
        return true;

    return false;
}

Ball.prototype.resolveCollision = function (ball) {
    var distX, distY, distance;
    var count = 0;

    // move objects apart to point before collision
    do {
        this.posX -= this.velX * 0.2;
        this.posY -= this.velY * 0.2;
        ball.posX -= ball.velX * 0.2;
        ball.posY -= ball.velY * 0.2;

        distX = ball.posX - this.posX;
        distY = ball.posY - this.posY;
        distance = distX * distX + distY * distY;
        count++;
    } while (distance < BALL_DIAMETER * BALL_DIAMETER);

    // calculate resulting vectors
    // calculate normal vector
    var nX = this.posX - ball.posX;
    var nY = this.posY - ball.posY;

    // calculate norm of normal vector
    var norm = Math.sqrt(nX * nX + nY * nY);

    // normalize vector n
    nX = nX / norm;
    nY = nY / norm;

    // calculate vector length
    var a1 = this.velX * nX + this.velY * nY;
    var a2 = ball.velX * nX + ball.velY * nY;

    // calculate magnitude of deltaP
    var P = a1 - a2;

    // calculate new movement vectors
    this.velX = this.velX - P * nX;
    this.velY = this.velY - P * nY;
    ball.velX = ball.velX + P * nX;
    ball.velY = ball.velY + P * nY;

    // move them apart after collision
    while (count-- > 0) {
        this.posX += this.velX * 0.2;
        this.posY += this.velY * 0.2;
        ball.posX += ball.velX * 0.2;
        ball.posY += ball.velY * 0.2;
    }

    // apply friction after collision
    this.velX *= ROLLING_FRICTION;
    this.velY *= ROLLING_FRICTION;
    ball.velX *= ROLLING_FRICTION;
    ball.velY *= ROLLING_FRICTION;
}