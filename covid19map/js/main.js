"use strict"

const query = window.location.search.substring(1).split("=")[1];

const git_url = "https://api.github.com/repositories/238316428/contents/csse_covid_19_data/csse_covid_19_daily_reports";
const dl_base_url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/"
const dates = []

// camera position and renderer size
const POS_X = 1200;
const POS_Y = 900;
const POS_Z = 1200;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const FOV = 55;
const NEAR = 100;
const FAR = 8000;

const light = new THREE.DirectionalLight(0xcccccc, 2.6, 1800);

// some global variables and initialization code
// simple basic renderer
const renderer = new THREE.WebGLRenderer({alpha: false, antialias: true});
renderer.setSize(WIDTH, HEIGHT);

// add it to the target element
document.getElementById("globe").appendChild(renderer.domElement);

// setup a camera that points to the center
const camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, NEAR, FAR);
camera.position.set(POS_X, POS_Y, POS_Z);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// create a basic scene and add the camera
const scene = new THREE.Scene();
scene.add(camera);

const controls = new THREE.OrbitControls (camera, renderer.domElement);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;
controls.enableZoom = true;
controls.minZoom = 1;

function zoom(event) {
    event.preventDefault();

    if (event.deltaY > 0) {
        controls.zoomIn();
    } else if (event.deltaY < 0){
        controls.zoomOut();
    }
}
document.onwheel = zoom;

// handle window resize
// https://github.com/mrdoob/three.js/issues/69
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

function addCube(geom, material, value, position, width) {
    if (value < 0) return;

    let cube = new THREE.Mesh(new THREE.CubeGeometry(width, width, 1 + value / 128, 1, 1, 1, material));
    cube.position = position;
    cube.lookAt(new THREE.Vector3(0, 0, 0));

    THREE.GeometryUtils.merge(geom, cube);
}

// simple function that converts data to the markers on screen
function addData(data) {

    // the geometry that will contain all our cubes
    let geom = new THREE.Geometry();
    // material to use for each of our elements. Could use a set of materials to
    // add colors relative to the density. Not done here.
    let cubeMatActive = new THREE.MeshLambertMaterial({color: 0x000000, opacity: 0.7, emissive: 0xffffff});
    let cubeMatDeaths = new THREE.MeshLambertMaterial({color: 0xcc0000, opacity: 0.6, emissive: 0xff0000});
    //let cubeMatConfirmed = new THREE.MeshLambertMaterial({color: 0x0000cc, opacity: 0.6, emissive: 0x0000ff});

    for (let i = 1; i < data.length - 1; i++) {

        let x = data[i][0];
        let y = data[i][1];

        let deaths = parseFloat(data[i][2]);
        let active = parseFloat(data[i][3]);

        // calculate the position where we need to start the cube
        let position = latLongToVector3(y, x, 600, 2);

        addCube(geom, cubeMatDeaths, deaths, position, 2);
        addCube(geom, cubeMatActive, active, position, 1);
    }

    // create a new mesh, containing all the other meshes.
    let total = new THREE.Mesh(geom, new THREE.MeshFaceMaterial());

    // and add the total mesh to the scene
    scene.add(total);
}

// add a simple light
function addLights() {
    scene.add(light);
    light.position.set(POS_X, POS_Y, POS_Z);
}

// add the earth
function addEarth() {
    let spGeo = new THREE.SphereGeometry(600, 50, 50);
    let planetTexture = THREE.ImageUtils.loadTexture("img/world.200406.3x5400x2700.jpg");
    let mat2 = new THREE.MeshPhongMaterial({
        map: planetTexture,
        perPixel: false,
        shininess: 0.2,
        bumpMap: THREE.ImageUtils.loadTexture("img/srtm_ramp2.worldx294x196.jpg"),
        //displacementMap: THREE.ImageUtils.loadTexture("img/srtm_ramp2.worldx294x196.jpg"),
        //displacementScale: 2
    });
    let sp = new THREE.Mesh(spGeo, mat2);
    scene.add(sp);
}

// add clouds
function addClouds() {
    let spGeo = new THREE.SphereGeometry(600, 50, 50);
    let cloudsTexture = THREE.ImageUtils.loadTexture("img/earth_clouds_1024.png");
    let materialClouds = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: cloudsTexture,
        transparent: true,
        opacity: 0.6
    });

    let meshClouds = new THREE.Mesh(spGeo, materialClouds);
    meshClouds.scale.set(1.015, 1.015, 1.015);
    scene.add(meshClouds);
}

// convert the positions from a lat, lon to a position on a sphere.
function latLongToVector3(lat, lon, radius, height) {
    let phi = (lat) * Math.PI / 180;
    let theta = (lon - 180) * Math.PI / 180;

    let x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
    let y = (radius + height) * Math.sin(phi);
    let z = (radius + height) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

// render the scene
function render() {
    controls.update();
    light.position = camera.position;
    light.lookAt(scene.position);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}


function CSVToArray(strData, strDelimiter) {

    let arrData = [];

    strDelimiter = (strDelimiter || ",");

    const rows = strData.slice(strData.indexOf('\n') + 1).split('\n');

    rows.forEach(function (row) {
        let s = row.split(strDelimiter);
        arrData.push([s[6], s[5], s[8], s[10]]);
    });

    return arrData;
}

fetch(git_url)
    .then(response => response.json())
    .then((data) => {
        let select = document.getElementById("show_date");

        select.children[0].remove();

        for (const e of data) {
            let n = e["name"];

            if (n.substr(n.length - 4, n.length) !== ".csv") continue;

            //let date = n.substr(0, n.length - 4);
            let day = parseInt(n.substr(3, 4));
            let month = parseInt(n.substr(0, 2));
            let year = parseInt(n.substr(6, 10));

            if (month >= 4 || year > 2020) {
                dates.push(new Date(year, month-1, day)); // the month is 0-indexed
            }
        }

        dates.sort((a,b)=> b-a);

        for (const date of dates) {
            let dateString = date.toISOString().substring(0, 10);
            let el = document.createElement("option");
            el.textContent = dateString;
            el.value = dateString;
            if (dateString === query) el.selected = true;
            select.appendChild(el);
        }

        if (typeof (query) !== "undefined" && query.match(/\d\d\d\d-\d\d-\d\d/) != null) {
            let month = parseInt(query.substr(5, 2));
    	    let year = parseInt(query.substr(0, 4));

            if (month >= 4 || year > 2020) {           
		        init(query);
            } else {
                init(dates[0].toISOString().substring(0, 10));
            }
        } else {
            init(dates[0].toISOString().substring(0, 10));
        }
    });

function init(date) {
    let year = date.substr(0, 4);
    let month = date.substr(5, 2);
    let day = date.substr(8, 2);

    fetch(dl_base_url + month + "-" + day + "-" + year + ".csv")
        .then(response => response.text())
        .then((data) => {
            addData(CSVToArray(data));
            addLights();
            addEarth();
            //addClouds();
            render();
    	    
	        document.getElementById("hl").innerText = "COVID-19 Active Cases, Cumulative Deaths " + date;
        });
}


function showDate(selectObject) {
    let date = selectObject.options[selectObject.selectedIndex].text;
    let baseUrl = window.location.origin + window.location.pathname;
    window.location = baseUrl + "?date=" + date;
}

const toggleDescription = document.getElementById('toggleDescription');

const toggleText = function () {
    let x = document.getElementById("description");
    if (x.style.display === "none") {
      x.style.display = "block";
      toggleDescription.innerText = "Hide description"
    } else {
      x.style.display = "none";
      toggleDescription.innerText = "Show description"
    }
} 

toggleDescription.onclick = toggleText;
