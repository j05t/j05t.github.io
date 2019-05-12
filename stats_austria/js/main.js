// basic d3 map template from mapstarter.com

// d3.schemeBlues[9]
//         .range(["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"]);
var populationColorScale = d3.scale.log()
    .domain([200, 200000])
    .range(["#deebf7", "#08306b", "#08306b"]);

// use for urbanity
// 101 Urbane Grosszentren
// 102 Urbane Mittelzentren
// 103 Urbane Kleinzentren
// 210 Regionale Zentren, zentral
// 220 Regionale Zentren, intermediar
// 310 Laendlicher Raum im Umland von Zentren, zentral
// 320 Laendlicher Raum im Umland von Zentren, intermediaer
// 330 Laendlicher Raum im Umland von Zentren, periphaer
// 410 Laendlicher Raum, zentral
// 420 Laendlicher Raum, intermediaer
// 430 Laendlicher Raum, periphaer
var urbanityColorScale = d3.scale.ordinal()
    .domain([101, 102, 103, 210, 220, 310, 320, 330, 410, 420, 430])
    .range(["#8e0152", "#c51b7d", "#de77ae",
        "#f1b62c", "#fddf17",
        "#f7ef58", "#e4f541", "#b8e186",
        "#7fbc41", "#4d9221", "#276419"]);

var deathsColorScale = d3.scale.linear()
    .domain([0, 100000])
    .range(["#fffdfb", "#d22b00"]);

// Map dimensions (in pixels)
var width = window.innerWidth - 20,
    height = window.innerHeight - 20;

// Map projection
var projection = d3.geo.mercator()
    .scale(5706.315012582816)
    .center([13.346443836054394, 47.72342963833456]) //projection center
    .translate([width / 2, height / 2]); //translate to center the map in view

// Generate paths based on projection
var path = d3.geo.path()
    .projection(projection);

// Create SVG
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


// Group for the map features
var features = svg.append("g")
    .attr("class", "features");

// Group for the map bubbles
var bubbles = svg.append("g")
    .attr("class", "bubbles");

// Group for the districts and provinces
var districts = svg.append("g")
    .attr("class", "districts");


//Create zoom/pan listener
//Change [1,Infinity] to adjust the min/max zoom scale
var zoom = d3.behavior.zoom()
    .scaleExtent([1, Infinity])
    .on("zoom", zoomed);

svg.call(zoom);


effectController = {
    colorUrbanity: false,
    colorPopulation: false,
    showPopulation: false,
    colorScale: urbanityColorScale,
    data: urbanity,
    granularity: "Gemeinde",
    causesOfDeath: "Malignant neoplasms",
    year: 1970,
    animate: false,
    loop: true
};

// display map legend at bottom right
effectController.legend = svg.append("g")
    .attr("fill", "#777")
    .attr("transform", `translate(${width - 50},${height - 2})`)
    .attr("text-anchor", "middle")
    .attr("class", "legend")
    .style("font", "10px sans-serif");


// construct GUI and assign callback functions
var gui = new dat.GUI();

var f1 = gui.addFolder('Coloring');
var onColorUrbanityController = f1.add(effectController, 'colorUrbanity');
var onColorPopulationController = f1.add(effectController, 'colorPopulation');
f1.open();

var f2 = gui.addFolder('Detailed Information');

var f3 = gui.addFolder("Animation");
f3.open();

// listen() for variable changes at runtime
var onYearChangeController = f3.add(effectController, 'year', 1970, 2017).step(1).listen();
var onAnimateController = f3.add(effectController, 'animate');
f3.add(effectController, 'loop');
var onShowPopulationController = f2.add(effectController, 'showPopulation');
var onShowDistrictController = f1.add(effectController, 'granularity', ['Gemeinde', 'Bezirk', 'Bundesland']).listen();
var onShowCausesOfDeathController = f1.add(effectController, 'causesOfDeath', causesOfDeathGroups);


var animate = function () {

    if (effectController.loop && effectController.year >= 2017) {
        effectController.year = 1970;
    }

    if (effectController.animate && effectController.year < 2017) {
        requestAnimationFrame(animate, 1000);
    } else {
        onAnimateController.setValue(false);
    }

    effectController.year += 0.1;

    updateDistrictColor();
}


// show causes of death data here
var updateDistrictColor = function () {
    let year = Math.round(effectController.year);

    let getRoundedData = function (d) {
        return Math.floor(d.causesOfDeath.get(year)[causesOfDeathGroups.indexOf(effectController.causesOfDeath)]);
    }

    districts.selectAll("path")
        .data(districtGeofeatures)
        .attr("fill", d => deathsColorScale(getRoundedData(d)));

    districts.selectAll("path")
        .data(districtGeofeatures)
        .selectAll("title").text(d => d.properties.name + ": " + getRoundedData(d));
}


onAnimateController.onChange(function (value) {
    // we have only data on district level
    if (value && effectController.granularity === "Bezirk") {
        animate();
    } else {
        effectController.animate = false;
    }
});

onYearChangeController.onChange(function (value) {
    if (value) {
        effectController.year = value;
        updateDistrictColor();
    }
});

onShowDistrictController.onChange(function (value) {
    if (value) {
        if (value === "Bezirk") {
            showDistricts();
        } else if (value === "Bundesland") {
            showProvinces();
        } else {
            districts.selectAll("*").remove();
        }
    }
});

onShowCausesOfDeathController.onChange(function (value) {
    if (value) {
        effectController.granularity = "Bezirk";
        showDistricts();
    }
});


var updateMapAndGui = function () {
    features.selectAll("path")
        .data(effectController.geofeatures)
        .attr("fill", d => effectController.colorScale(effectController.data.get(d.properties.iso)));

    features.selectAll("path")
        .selectAll("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));
};

var clearColor = function () {
    features.selectAll("path")
        .data(effectController.geofeatures)
        .attr("fill", "#cfcfcf");
}

onColorUrbanityController.onChange(function (value) {
    if (value) {
        effectController.data = urbanity;
        onColorPopulationController.setValue(false);
        effectController.colorScale = urbanityColorScale;
        updateMapAndGui();

        // show description for urbanity codes
        features.selectAll("path")
            .selectAll("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(effectController.data.get(d.properties.iso)));
    } else {
        if (effectController.showPopulation === false) {
            clearColor();
        }
    }
});


onColorPopulationController.onChange(function (value) {
    if (value) {
        effectController.data = population;
        onColorUrbanityController.setValue(false);
        effectController.colorScale = populationColorScale;
        updateMapAndGui();
    } else {
        if (effectController.showPopulation === false) {
            clearColor();
        }
    }
});

onShowPopulationController.onChange(function (value) {
    if (value) {
        // we want to display values between 0 and 2 million
        var domain = [0, 2e6];

        // values are scaled to range 0,32
        var radius = d3.scale.sqrt().domain(domain).range([0, 32]);

        effectController.data = population;

        effectController.legend.selectAll("legend")
            .data(domain)
            .enter()
            .append("circle")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("cy", d => -radius(d))
            .attr("r", radius);

        effectController.legend.selectAll("legend")
            .data(domain)
            .enter()
            .append("text")
            .data(domain)
            .attr("y", d => -2 * radius(d))
            .attr("dy", "1.3em")
            .text(d3.format(".1s"));


        //Create a circle for each map feature in the data
        bubbles.selectAll("bubbles")
            .data(effectController.geofeatures)
            .enter()
            .append("circle")
            .attr("fill", "brown")
            .attr("fill-opacity", 0.8)
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("transform", d => `translate(${path.centroid(d)})`)
            .attr("r", d => radius(effectController.data.get(d.properties.iso)))
            .append("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));
    } else {
        bubbles.selectAll("circle").remove();
        effectController.legend.selectAll("*").remove();
    }
});

// initial view
// https://github.com/ginseng666/GeoJSON-TopoJSON-Austria
d3.json("data/gemeinden_999_topo.topojson", function (error, geodata) {
    if (error) return console.log(error); //unknown error, check the console

    //generate features from TopoJSON
    effectController.geofeatures = topojson.feature(geodata, geodata.objects.gemeinden).features;

    //Create a path for each map feature in the data
    features.selectAll("path")
        .data(effectController.geofeatures)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#cfcfcf")
        .on("click", clicked)    // onclick handler
        .append("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(effectController.data.get(d.properties.iso)));

    // start showing district data
    showDistricts();

    // show default title
    //.append("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));
});


var districtGeofeatures;
var showDistricts = function () {
    d3.json("data/bezirke_999_topo.json", function (error, geodata) {
        if (error) return console.log(error); //unknown error, check the console

        districts.selectAll("*").remove();

        //generate features from TopoJSON
        districtGeofeatures = topojson.feature(geodata, geodata.objects.bezirke).features;

        // create and insert random prevalence data here for causes of death
        createRandomData(districtGeofeatures);

        //Create a path for each map feature in the data
        districts.selectAll("path")
            .data(districtGeofeatures)
            .enter()
            .append("path")
            .attr("d", path)
            .on("click", clicked)
            .append("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));

        updateDistrictColor();

    });
}

// attach random  prevalence data to each district geofeature
var insertData = function (value, key, map) {

    value.causesOfDeath = new Map();

    // create data for each district and year
    for (let year = 1970; year <= 2017; year++) {
        let mapData = [];

        // create random prevalence data
        for (let i = 0; i < causesOfDeathGroups.length; i++) {
            let randInt = Math.random() * 100000;
            mapData.push(randInt);
        }

        value.causesOfDeath.set(year, mapData);
    }
}

var createRandomData = function (districtGeofeatures) {
    districtGeofeatures.forEach(insertData);
};


// TODO: show aggregate data
var showProvinces = function () {
    d3.json("data/laender_999_topo.json", function (error, geodata) {
        if (error) return console.log(error); //unknown error, check the console

        districts.selectAll("*").remove();

        //generate features from TopoJSON
        geofeatures = topojson.feature(geodata, geodata.objects.laender).features;

        //Create a path for each map feature in the data
        districts.selectAll("path")
            .data(geofeatures)
            .enter()
            .append("path")
            .attr("d", path)
            .on("click", clicked)
            .append("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));
    });
}


// Add optional onClick events for features here
// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
function clicked(d, i) {
    console.log(d.properties.name, d.properties.iso, effectController.data.get(d.properties.iso));
    console.log(effectController.colorScale(d.properties.iso));
    console.log("index: " + i);
}


// Update map on zoom/pan
function zoomed() {
    features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    districts.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    bubbles.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
}
