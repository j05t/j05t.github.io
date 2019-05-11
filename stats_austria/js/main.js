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


//Create zoom/pan listener
//Change [1,Infinity] to adjust the min/max zoom scale
var zoom = d3.behavior.zoom()
    .scaleExtent([1, Infinity])
    .on("zoom", zoomed);

svg.call(zoom);


effectController = {
    colorUrbanity: true,
    colorPopulation: false,
    showPopulation: false,
    colorScale: urbanityColorScale,
    data: urbanity
};


// display map legend at bottom right
effectController.legend = svg.append("g")
    .attr("fill", "#777")
    .attr("transform", `translate(${width - 50},${height - 2})`)
    .attr("text-anchor", "middle")
    .attr("class", "legend")
    .style("font", "10px sans-serif");

var gui = new dat.GUI();

var f1 = gui.addFolder('Coloring');
var onColorUrbanityController = f1.add(effectController, 'colorUrbanity');
var onColorPopulationController = f1.add(effectController, 'colorPopulation');
var f2 = gui.addFolder('Detailed Information');
var onShowPopulationController = f2.add(effectController, 'showPopulation');
f2.open();


var updateMapAndGui = function () {
    features.selectAll("path")
        .data(effectController.geofeatures)
        .attr("fill", d => effectController.colorScale(effectController.data.get(d.properties.iso)));

    features.selectAll("path")
        .selectAll("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));
};

onColorUrbanityController.onChange(function (value) {
    if (value) {
        effectController.data = urbanity;
        onColorPopulationController.setValue(false);
        effectController.colorScale = urbanityColorScale;
        updateMapAndGui();

        // show description for urbanity codes
        features.selectAll("path")
            .selectAll("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(effectController.data.get(d.properties.iso)));
    }
});

onColorPopulationController.onChange(function (value) {
    if (value) {
        effectController.data = population;
        onColorUrbanityController.setValue(false);
        effectController.colorScale = populationColorScale;
        updateMapAndGui();
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
        .attr("fill", d => effectController.colorScale(effectController.data.get(d.properties.iso)))
        .on("click", clicked)    // show description for urbanity codes
        .append("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(effectController.data.get(d.properties.iso)));

    // show default title
    //.append("title").text(d => d.properties.name + ": " + effectController.data.get(d.properties.iso));
});


// Add optional onClick events for features here
// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
function clicked(d, i) {
    console.log(d.properties.name, d.properties.iso, effectController.data.get(d.properties.iso));
    console.log(effectController.colorScale(d.properties.iso));
    console.log("index: " + i);
}


//Update map on zoom/pan
function zoomed() {
    features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    bubbles.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
}
