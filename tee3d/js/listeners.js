// setup sidebar menu onclick handlers
document.getElementById('head').addEventListener('click', function () {
    resetControls();
    moveAndLookAt(headView, lookAt, 500);
});

document.getElementById('side').addEventListener('click', function () {
    resetControls();
    moveAndLookAt(sideView, lookAt, 500);
});

document.getElementById('tilted').addEventListener('click', function () {
    resetControls();
    moveAndLookAt(tiltedView, lookAt, 500);

    new TWEEN.Tween(controls.object.up)
        .to({x: -0.125, y: 0.96, z: 0.4}, 500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
});

document.getElementById('engraving').addEventListener('click', function () {
    const img = document.getElementById("icon_visibility");

    if (showEngraving) {
        showEngraving = false;
        img.className = "icon_invisible";
        changeText("");
    } else {
        showEngraving = true;
        img.className = "icon_visible";
        changeText(engravingText);
    }
});

document.getElementById('engravingText').addEventListener('keyup', function () {
    engravingText = this.value;
    changeText(engravingText);
});

document.getElementById('engravingText').addEventListener('focus', function () {
    showEngraving = true;
    document.getElementById("icon_visibility").className = "icon_visible";
    changeText(engravingText);

    rotate = false;
    oldPos = camera.position.clone();
    resetControls();
    moveAndLookAt(textView, lookAt, 500);

    new TWEEN.Tween(controls.object.up)
        .to({x: -0.5, y: 0.4, z: 1.2}, 500)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();
});

document.getElementById('engravingText').addEventListener('focusout', function () {
    rotate = true;
    moveAndLookAt(oldPos, lookAt, 500);
});


// colors
document.getElementById('z000').addEventListener('click', function () {
    head.material.color = new THREE.Color(0x000000);
});
document.getElementById('zF541B7').addEventListener('click', function () {
    head.material.color = new THREE.Color(0xF541B7);
});
document.getElementById('z3BD23D').addEventListener('click', function () {
    head.material.color = new THREE.Color(0x3BD23D);
});
document.getElementById('z1295D8').addEventListener('click', function () {
    head.material.color = new THREE.Color(0x1295D8);
});
document.getElementById('zFF8767').addEventListener('click', function () {
    head.material.color = new THREE.Color(0xFF8767);
});
document.getElementById('ze4e83b').addEventListener('click', function () {
    head.material.color = new THREE.Color(0xe4e83b);
});
document.getElementById('zfff').addEventListener('click', function () {
    head.material.color = new THREE.Color(0xffffff);
});

// firefox
document.body.onload = function () {
    changeText(engravingText);
};