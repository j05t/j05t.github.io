"use strict"

// camera position and renderer size
const POS_X = 1800;
const POS_Y = 900;
const POS_Z = 1800;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const FOV = 50;
const NEAR = 1;
const FAR = 2800;

const light = new THREE.DirectionalLight(0x3333ee, 3.5, 500);

// some global variables and initialization code
// simple basic renderer
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColorHex(0x111111, 1);

// add it to the target element
document.getElementById("globe").appendChild(renderer.domElement);

// setup a camera that points to the center
const camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, NEAR, FAR);
camera.position.set(POS_X, POS_Y, POS_Z);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// create a basic scene and add the camera
const scene = new THREE.Scene();
scene.add(camera);

// handle window resize
// https://github.com/mrdoob/three.js/issues/69
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

function addCube(geom, material, value, position, width) {
    if (value < 0) return;

    let cube = new THREE.Mesh(new THREE.CubeGeometry(width, width, 1 + value / 8, 1, 1, 1, material));
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

        let x = parseInt(data[i][6]);
        let y = parseInt((data[i][5]))

        //let confirmed = parseFloat(data[i][7]);
        let deaths = parseFloat(data[i][8]) / 3;
        let active = parseFloat(data[i][9]) / 3;

        // calculate the position where we need to start the cube
        let position = latLongToVector3(y, x, 600, 2);

        addCube(geom, cubeMatDeaths, deaths, position, 5);
        addCube(geom, cubeMatActive, active, position, 2);
        //addCube(geom, cubeMatConfirmed, confirmed, position, 2);

        // scene.add(cube);
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
    let planetTexture = THREE.ImageUtils.loadTexture("img/world-big-2-grey.jpg");
    let mat2 = new THREE.MeshPhongMaterial({
        map: planetTexture,
        perPixel: false,
        shininess: 0.2
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
        opacity: 0.3
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
    let timer = Date.now() * 0.0001;
    camera.position.x = (Math.cos(timer) * 1800);
    camera.position.z = (Math.sin(timer) * 1800);
    camera.lookAt(scene.position);
    light.position = camera.position;
    light.lookAt(scene.position);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

// from http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    const objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    let arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    let arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        let strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            (strMatchedDelimiter !== strDelimiter)
        ) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);
        }

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        let strMatchedValue;
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {
            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];
        }

        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}

const git_url = "https://api.github.com/repositories/238316428/contents/csse_covid_19_data/csse_covid_19_daily_reports";
const dl_base_url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/"
const dates = []

fetch(git_url)
    .then(response => response.json())
    .then((data) => {
        //let select = document.getElementById("show_date");

        for (const e of data) {
            let n = e["name"];

            if (n.substr(n.length - 4, n.length) !== ".csv") continue;

            let d = n.substr(0, n.length - 4);

            dates.push(d)

            /*
            let el = document.createElement("option");
            el.textContent = d;
            el.value = d;
            select.appendChild(el);
             */
        }

        dates.sort();
        let day = dates[dates.length - 1];

        init(day);
    });

function init(day) {
    fetch(dl_base_url + day + ".csv")
        .then(response => response.text())
        .then((data) => {
            addData(CSVToArray(data));
            addLights();
            addEarth();
            addClouds();
            render();

            document.getElementById("hl").innerText = "Global COVID-19 Active Cases and Cumulative Deaths " + day.replace(/-/g, "/");
        });
}

/*
function showDate(selectObject) {
    let date = selectObject.options[selectObject.selectedIndex].text;

    init(date);
}
*/
