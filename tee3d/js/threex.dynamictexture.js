var THREEx = THREEx || {}

//////////////////////////////////////////////////////////////////////////////////
//		Constructor							//
//////////////////////////////////////////////////////////////////////////////////

/**
 * create a dynamic texture with a underlying canvas
 *
 * @param {Number} width  width of the canvas
 * @param {Number} height height of the canvas
 */
THREEx.DynamicTexture = function (width, height) {
    var canvas = document.createElement('canvas');
    canvas.id = "dynCanvas";
    canvas.width = width;
    canvas.height = height;
    this.canvas = canvas;

    this.context = canvas.getContext('2d');

    this.context.font = "60px futurab";

    this.texture = new THREE.Texture(canvas);

    var base_image = new Image();
    base_image.src = 'model/kernbuche_holzart.jpg';

    this.base_image = base_image;
}

//////////////////////////////////////////////////////////////////////////////////
//		methods								//
//////////////////////////////////////////////////////////////////////////////////

/**
 * clear the canvas
 *
 * @param  {String*} fillStyle        the fillStyle to clear with, if not provided, fallback on .clearRect
 * @return {THREEx.DynamicTexture}      the object itself, for chained texture
 */
THREEx.DynamicTexture.prototype.clear = function (fillStyle) {
    // depends on fillStyle
    if (fillStyle !== undefined) {
        this.context.fillStyle = fillStyle
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    } else {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    // make the texture as .needsUpdate
    this.texture.needsUpdate = true;
    // for chained API
    return this;
}

/**
 * draw text
 *
 * @param  {String}        text    the text to display
 * @param  {Number|undefined}    x    if provided, it is the x where to draw, if not, the text is centered
 * @param  {Number}        y    the y where to draw the text
 * @param  {String*}        fillStyle the fillStyle to clear with, if not provided, fallback on .clearRect
 * @param  {String*}        contextFont the font to use
 * @return {THREEx.DynamicTexture}    the object itself, for chained texture
 */
THREEx.DynamicTexture.prototype.drawText = function (text, x, y, fillStyle) {
    this.context.fillStyle = fillStyle;

    // draw the text
    this.context.fillText(text, x, y);

    // make the texture as .needsUpdate
    this.texture.needsUpdate = true;
    // for chained API
    return this;
};

/**
 * execute the drawImage on the internal context
 * the arguments are the same the official context2d.drawImage
 */
THREEx.DynamicTexture.prototype.drawImage = function (/* same params as context2d.drawImage */) {
    // call the drawImage
    this.context.drawImage.apply(this.context, arguments)
    // make the texture as .needsUpdate
    this.texture.needsUpdate = true;
    // for chained API
    return this;
}
