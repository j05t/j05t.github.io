// send to 3d preview button
// https://stackoverflow.com/questions/6755314/canvas-imagedata-remove-white-pixels
function white2transparent(img)
{
    var c = document.createElement('canvas');

    var w = img.width, h = img.height;

    c.width = w;
    c.height = h;

    var ctx = c.getContext('2d');

    ctx.drawImage(img, 0, 0, w, h);
    var imageData = ctx.getImageData(0,0, w, h);
    var pixel = imageData.data;

    var r=0, g=1, b=2,a=3;
    for (var p = 0; p<pixel.length; p+=4)
    {
      if (
          pixel[p+r] == 255 &&
          pixel[p+g] == 255 &&
          pixel[p+b] == 255) // if white then change alpha to 0
      {pixel[p+a] = 0;}
    }

    ctx.putImageData(imageData,0,0);

    return c.toDataURL('image/png');
}

// send to tee3d
var form = document.createElement("form");
form.setAttribute("method", "post");
form.setAttribute("action", "/tee3d/index.php");

form.setAttribute("target", "view");

var hiddenField = document.createElement("input"); 

var imgData;

// hide background images
fancyProductDesigner.viewInstances[0].getElementByTitle("tee").opacity = 0;
fancyProductDesigner.viewInstances[0].getElementByTitle("box up").opacity = 0;
fancyProductDesigner.viewInstances[0].getElementByTitle("bg").opacity = 0;

// send logo image
fancyProductDesigner.createImage(false,false, "#ffffff")
fancyProductDesigner.getViewsDataURL(function(dataURLs) {
	var dataURL = dataURLs[fancyProductDesigner.currentViewIndex];

	var img = new Image();
	img.src = dataURL;

	img.onload = function() {
		imgData = white2transparent(img);

		hiddenField.setAttribute("type", "hidden");
		hiddenField.setAttribute("name", "message");
		hiddenField.setAttribute("value", imgData );
		form.appendChild(hiddenField);
		document.body.appendChild(form);

		window.open('', 'view');

		form.submit();

		fancyProductDesigner.viewInstances[0].getElementByTitle("tee").opacity = 1;
		fancyProductDesigner.viewInstances[0].getElementByTitle("box up").opacity = 0.5;
		fancyProductDesigner.viewInstances[0].getElementByTitle("bg").opacity = 1;	
		
		// reset view
		fancyProductDesigner.resetZoom()
	}

});








////////////////////////////////////////////////////////////////
// download button

// hide background images
fancyProductDesigner.viewInstances[0].getElementByTitle("tee").opacity = 0;
fancyProductDesigner.viewInstances[0].getElementByTitle("box up").opacity = 0;
fancyProductDesigner.viewInstances[0].getElementByTitle("bg").opacity = 0;

// download logo
fancyProductDesigner.createImage(true,true, "transparent")
fancyProductDesigner.getViewsDataURL(function(dataURLs) {
	var dataURL = dataURLs[fancyProductDesigner.currentViewIndex];
});

fancyProductDesigner.viewInstances[0].getElementByTitle("tee").opacity = 1;
fancyProductDesigner.viewInstances[0].getElementByTitle("box up").opacity = 0.5;
fancyProductDesigner.viewInstances[0].getElementByTitle("bg").opacity = 1;





// todo on tee3d:
head.material.map.image = logo
//head.material.transparent = true
head.material.map.needsUpdate = true

// white to alpha

