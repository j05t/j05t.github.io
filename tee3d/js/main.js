var backgroundImage = "img/background.jpg";

var language = navigator.language || navigator.userLanguage;


var tee, head, wood, controls, baseHead;
var rotate = true;

var basePosition = new THREE.Vector3(50, 0, 0);

var engravingText = "EDELRASTER";
var showEngraving = true;

var oldPos;

var lookAt = new THREE.Vector3(0, 0, 0);
var headView = new THREE.Vector3(0.01, 20, 0.1);
var sideView = new THREE.Vector3(20, 20, 2);
var tiltedView = new THREE.Vector3(10, 14, 2);
var textView = new THREE.Vector3(14, 7, 11);

var dynamicTexture = new THREEx.DynamicTexture(512, 1024);


var updateLanguage = function () {

    let l = language.substring(0, 2);
    console.log("detected language " + l);

    if (l !== "de") {
        return;
    }

    let descGerman = 'Hinweis: Dies ist nur eine Illustration!<br/><br/>Sie können das Tee mit gedrückter linker Maustaste im Raum bewegen. Durch Scrollen mit dem Mausrad ist der Zoom verfügbar. Jedes Mal, wenn Sie auf eine Menüansicht klicken, wird sich das T-Stück neu zentrieren. Die Gravur kann einfach durch Hinzufügen von Text (max. 18 Zeichen) in das Beschriftungsfeld aktiviert werden. Sie kehren zum TWiNTEE-Customizer zurück, indem Sie die Registerkarte in Ihrem Browser schließen.<br/><br/>- entwickelt von TWiNTEE.golf -';
    let headGerman = "Kopfansicht", sideGerman = "Seitenansicht";
    let colors = new Map([["z000", "Schwarz"], ["z3BD23D", "Grün"], ["z1295D8", "Blau"], ["ze4e83b", "Gelb"], ["zfff", "Weiß"]]);

    document.getElementById("head").innerText = headGerman;
    document.getElementById("side").innerText = sideGerman;
    document.getElementById("engraving").innerText = "Beschriftung";
    document.getElementById("teeDescription").innerHTML = descGerman;

    colors.forEach(function (value, color) {
        document.getElementById(color).title = value;
    });

};

// reset trackball controls to original position
var resetControls = function () {
    new TWEEN.Tween(controls.object.position)
        .to({x: controls.position0.x, y: controls.position0.y, z: controls.position0.z}, 500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
    new TWEEN.Tween(controls.target)
        .to({x: controls.target0.x, y: controls.target0.y, z: controls.target0.z}, 500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
    new TWEEN.Tween(controls.object.up)
        .to({x: controls.up0.x, y: controls.up0.y, z: controls.up0.z}, 500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();

    new TWEEN.Tween(tee.rotation)
        .to({x: -1.57, y: 0, _z: 3.15}, 500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
}

function changeText(text) {

    dynamicTexture.clear();

    dynamicTexture.context.drawImage(dynamicTexture.base_image, 0, 0);

    dynamicTexture.context.save();

    // move to the center of the canvas
    dynamicTexture.context.translate(256, 512);

    // rotate the canvas to the specified degrees
    dynamicTexture.context.rotate(270 * Math.PI / 180);

    // center text on canvas
    var textSize = dynamicTexture.context.measureText(text);
    var x = (-350 - textSize.width) / 2;


    //                             + ^v -  <>
    //dynamicTexture.drawText(text, -400, 230, '0x0d0d0d');
    dynamicTexture.drawText(text, x, 230, '#582813');


    dynamicTexture.context.restore();

    dynamicTexture.texture.needsUpdate = true;
}


// handle window resize
// https://github.com/mrdoob/three.js/issues/69
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function getSpotlight(color, intensity) {
    var light = new THREE.SpotLight(color, intensity);
    light.castShadow = true;

    light.shadow.mapSize.x = 4096;
    light.shadow.mapSize.y = 4096;

    return light;
}


// construct scene and add background image
var scene = new THREE.Scene();
loader = new THREE.TextureLoader();
bgTexture = loader.load(backgroundImage);

scene.background = bgTexture;
bgTexture.wrapS = THREE.MirroredRepeatWrapping;
bgTexture.wrapT = THREE.MirroredRepeatWrapping;


var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// transform camera to default view
camera.position.set(sideView.x, sideView.y, sideView.z);

camera.lookAt(new THREE.Vector3(0, 0, 0));

// add hemisphere light
var hemLight = new THREE.HemisphereLight(0xffffff, 0x080820, .42);
scene.add(hemLight);


// add spotlights
var spotLight_01 = getSpotlight(0xffffff, .6);
var spotLight_02 = getSpotlight(0xffffff, .6);
var spotLight_03 = getSpotlight(0xffffff, .6);
var spotLight_04 = getSpotlight(0xffffff, .6);

scene.add(spotLight_01);
scene.add(spotLight_02);
scene.add(spotLight_03);
scene.add(spotLight_04);

// transform spotlights
spotLight_01.position.x = 25;
spotLight_01.position.y = 20;
spotLight_01.position.z = 0;

spotLight_02.position.x = -22;
spotLight_02.position.y = 10;
spotLight_02.position.z = 0;

spotLight_03.position.x = 0;
spotLight_03.position.y = 10;
spotLight_03.position.z = 18;

spotLight_04.position.x = 0;
spotLight_04.position.y = 15;
spotLight_04.position.z = -20;


loader = new THREE.ColladaLoader();
loader.load('model/tee.dae', function (collada) {
    collada.scene.scale.set(8, 8, 8);
    tee = collada.scene;

    tee.rotation.z = Math.PI;
    tee.position = basePosition;

    wood = tee.children[0];
    head = tee.children[1];

    head.castShadow = true;
    head.receiveShadow = true;
    wood.castShadow = true;
    wood.receiveShadow = true;

    // do not load default texture
    head.material.map = null;

    wood.material.map = dynamicTexture.texture;

    // load base texture and set default engraving text
    changeText(engravingText);

    scene.add(tee);


    // load logo with transparency on top of head mesh so that changing the diffuse color
    // of the head mesh does not change the color of the logo itself
    loader = new THREE.TextureLoader();
    h2texture = loader.load("model/logo.png", function (texture) {
        var baseHeadgeometry = head.geometry;

        // set transparent : true and depthWrite : false to only show logo
        var baseHeadMaterial = new THREE.MeshPhongMaterial({map: texture, transparent: true, depthWrite: false});
        baseHead = new THREE.Mesh(baseHeadgeometry, baseHeadMaterial);

        // scale texture
        baseHead.material.map.repeat.set(0.8, 0.8);
        baseHead.material.map.offset.set(0.1, 0.1);

        head.add(baseHead);
    });


    // add controls for tee
    controls = new THREE.TrackballControls(camera, renderer.domElement);

    controls.minDistance = 18;
    controls.maxDistance = 40;

    controls.autoRotate = false;
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [65, 83, 68];

    // hide loading animation when model is loaded
    document.getElementById("loader").style.display = "none";
});


// modified from
// https://stackoverflow.com/questions/28091876/tween-camera-position-while-rotation-with-slerp-three-js
// https://codepen.io/abernier/pen/LEjPBX?editors=1010
function moveAndLookAt(dstpos, dstlookat, duration) {
    duration = duration || 1000;

    var origpos = new THREE.Vector3().copy(camera.position); // original position
    var origrot = new THREE.Euler().copy(camera.rotation); // original rotation

    camera.position.set(dstpos.x, dstpos.y, dstpos.z);
    camera.lookAt(dstlookat);
    var dstrot = new THREE.Euler().copy(camera.rotation)

    // reset original position and rotation
    camera.position.set(origpos.x, origpos.y, origpos.z);
    camera.rotation.set(origrot.x, origrot.y, origrot.z);

    //
    // Tweening
    //

    // position
    new TWEEN.Tween(camera.position).to({
        x: dstpos.x,
        y: dstpos.y,
        z: dstpos.z
    }, duration).easing(TWEEN.Easing.Quadratic.Out).start();


    // rotation (using slerp)
    (function () {
        var qa = qa = new THREE.Quaternion().copy(camera.quaternion); // src quaternion
        var qb = new THREE.Quaternion().setFromEuler(dstrot); // dst quaternion
        var qm = new THREE.Quaternion();
        camera.quaternion = qm;

        var o = {t: 0};
        new TWEEN.Tween(o).to({t: 1}, duration).onUpdate(function () {
            THREE.Quaternion.slerp(qa, qb, qm, o.t);
            camera.quaternion.set(qm.x, qm.y, qm.z, qm.w);
        }).easing(TWEEN.Easing.Quadratic.Out).start();
    }).call(this);
}


var render = function (time) {

    requestAnimationFrame(render);

    TWEEN.update(time);

    if (typeof controls !== 'undefined') {
        controls.update();
    }
    if (typeof tee !== 'undefined' && rotate) {
        tee.rotation.z += 0.00142;
    }
    renderer.render(scene, camera);
};


requestAnimationFrame(render);
