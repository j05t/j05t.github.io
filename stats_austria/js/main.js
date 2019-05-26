// basic d3 map template from mapstarter.com

var districtGeofeatures, stateGeofeatures;
;

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
var urbanityColorRange = ["#8e0152", "#c51b7d", "#de77ae",
    "#f1b62c", "#fddf17",
    "#f7ef58", "#e4f541", "#b8e186",
    "#7fbc41", "#4d9221", "#276419"];
var urbanityColorScale = d3.scale.ordinal()
    .domain([101, 102, 103, 210, 220, 310, 320, 330, 410, 420, 430])
    .range(urbanityColorRange);
//  .domain([0, 20,200,1000])

var deathsColorRange = ["#fff5f0", "#aa1017", "#a91016", "#a71016", "#a60f16", "#a40f16", "#a30e15", "#a10e15", "#67000d"];
var deathsColorScale = d3.scale.linear()
    .domain([0, 900])
    .range(deathsColorRange);

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


// Group for the map municipalities
var municipalities = svg.append("g")
    .attr("class", "municipalities");

// Group for the districts and states
var districts = svg.append("g")
    .attr("class", "districts");

// Group for the map bubbles
var bubbles = svg.append("g")
    .attr("class", "bubbles");


// legend for incidence
svg.append("g")
    .attr("class", "legendLinear")
    .attr("transform", "translate(10,140)");

var legendLinear = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .shapeWidth(30)
    .cells(10)
    .title("Inzidenz pro 100.000 Einwohner")
    .orient('horizontal')
    .scale(deathsColorScale);

svg.select(".legendLinear")
    .call(legendLinear);

var updateLegend = function () {
    legendLinear = d3.legend.color()
        .labelFormat(d3.format(".0f"))
        .shapeWidth(30)
        .cells(10)
        .title("Inzidenz pro 100.000 Einwohner")
        .orient('horizontal')
        .scale(deathsColorScale);

    svg.select(".legendLinear")
        .call(legendLinear);
}


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
    showCases: false,
    colorScale: urbanityColorScale,
    data: urbanity,
    granularity: "Gemeinde",
    causesOfDeath: "Bösartige Neubildungen",
    year: 2002,
    domainMin: 0,
    domainMax: 1000,
    animate: false,
    loop: true,
    causes: new Map()
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
var onYearChangeController = f3.add(effectController, 'year', 2002, 2017).step(1).listen();
var onAnimateController = f3.add(effectController, 'animate');
f3.add(effectController, 'loop');
var onShowPopulationController = f2.add(effectController, 'showPopulation');
var onShowCasesController = f2.add(effectController, 'showCases');
var onGranularityChangeController = f1.add(effectController, 'granularity', ['Gemeinde', /* 'Bezirk' , */ 'Bundesland']).listen();
var onShowCausesOfDeathController = f1.add(effectController, 'causesOfDeath', causesOfDeathGroups);
var onDomainMinChangeController = f1.add(effectController, 'domainMin', 0, 500).step(1).listen();
var onDomainMaxChangeController = f1.add(effectController, 'domainMax', 0, 1000).step(1).listen();


var animate = function () {

    if (effectController.loop && effectController.year >= 2017) {
        effectController.year = 2002;
    }

    if (effectController.animate && effectController.year < 2017) {
        requestAnimationFrame(animate, 500);
    } else {
        onAnimateController.setValue(false);
    }

    effectController.year += 0.1;

    updateColor();

    if (effectController.showPopulation || effectController.showCases) {
        updateBubbles();
    }
}


let getData = function (d) {
    let year = Math.round(effectController.year);

    //return Math.floor(d.causesOfDeath.get(year)[causesOfDeathGroups.indexOf(effectController.causesOfDeath)]);
    return effectController.causes[effectController.causesOfDeath][d.properties.iso][Math.floor(year)];
}
let getIncidence = function (d) {
    let year = Math.round(effectController.year);

    let pop = population[d.properties.iso][year];
    let cases = effectController.causes[effectController.causesOfDeath][d.properties.iso][Math.floor(year)];
    let incidence = Math.round(100000 * cases / pop);

    return incidence;
}


let updateDistricts = function (features) {
    if (districts.selectAll("path")[0].length === 0) {
        // we have to create the paths first
        districts.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => deathsColorScale(getIncidence(d)))
            .on("click", clicked)
            .append("title").text(d => d.properties.name + ": " + getIncidence(d));
    } else {
        // update for each map feature in the data
        districts.selectAll("path")
            .data(features)
            .attr("d", path)
            .attr("fill", d => deathsColorScale(getIncidence(d)))
            .on("click", clicked)
            .select("title").text(d => d.properties.name + ": " + getIncidence(d));
    }
}

// show causes of death data here
var updateColor = function () {
    municipalities.selectAll("path")
        .data(effectController.geofeatures)
        .attr("fill", d => deathsColorScale(getIncidence(d)));

    municipalities.selectAll("path")
        .data(effectController.geofeatures)
        .selectAll("title").text(d => d.properties.name + ": " + getIncidence(d));


    if (effectController.showCases || effectController.showPopulation) {
        updateBubbles();
    }

    if (effectController.granularity === "Bundesland") {
        updateDistricts(stateGeofeatures);
    } else if (effectController.granularity === "Bezirk") {
        updateDistricts(districtGeofeatures);
    }


}

onDomainMinChangeController.onChange(function (value) {
    deathsColorScale = d3.scale.linear()
        .domain([value, effectController.domainMax])
        .range(deathsColorRange);

    updateLegend();
    updateColor();
});
onDomainMaxChangeController.onChange(function (value) {
    deathsColorScale = d3.scale.linear()
        .domain([effectController.domainMin, value])
        .range(deathsColorRange);

    updateLegend();
    updateColor();
});

onAnimateController.onChange(function (value) {

    if (value) {
        animate();
    } else {
        effectController.animate = false;
    }
});

onYearChangeController.onChange(function (value) {
    if (value) {
        effectController.year = value;
        updateColor();
    }
});

onGranularityChangeController.onChange(function (value) {
    if (value) {
        districts.selectAll("*").remove();

        if (value === "Bezirk") {
            showDistricts();
        } else if (value === "Bundesland") {
            showStates();
        }
    }
});

var updateDomain = function (value) {
    console.log("update domain")

    value = value || effectController.causesOfDeath;

    if (effectController.granularity === "Gemeinde") {
        onDomainMinChangeController.setValue(0);
        onDomainMaxChangeController.setValue(1000);
        return;
    }

    let min, max;
    switch (value) {
        case causesOfDeathGroups[0]:
            min = 180;
            max = 300;
            break;
        case causesOfDeathGroups[1]:
            min = 300;
            max = 600;
            break;
        case causesOfDeathGroups[2]:
            min = 30;
            max = 70;
            break;
        case causesOfDeathGroups[3]:
            min = 20;
            max = 60;
            break;
        case causesOfDeathGroups[4]:
            min = 80;
            max = 240;
            break;
        case causesOfDeathGroups[5]:
            min = 40;
            max = 70;
            break;
    }
    onDomainMinChangeController.setValue(min);
    onDomainMaxChangeController.setValue(max);
}

function showCauses(value) {

    if (value in effectController.causes) {
        console.log(value + " already loaded")
        updateColor();
        updateDomain(value);

        return;
    }

    console.log("loading data for " + value);
    d3.json("data/" + value + ".json", function (error, data) {
        if (error) return console.log(error); //unknown error, check the console

        //generate municipalities from TopoJSON
        effectController.causes[value] = data;

        updateColor();
        updateDomain(value);
    });

}

onShowCausesOfDeathController.onChange(function (value) {
    if (value) {
        showCauses(value);
    }
});


var clearColor = function () {
    municipalities.selectAll("path")
        .data(effectController.geofeatures)
        .attr("fill", "#cfcfcf");
}

onColorUrbanityController.onChange(function (value) {
    if (value) {
        onColorPopulationController.setValue(false);

        municipalities.selectAll("path")
            .data(effectController.geofeatures)
            .attr("fill", d => urbanityColorScale(urbanity.get(d.properties.iso)))
            .select("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(urbanity.get(d.properties.iso)));
    } else {
        if (effectController.colorPopulation === false) {
            clearColor();
        }
    }
});


onColorPopulationController.onChange(function (value) {
    if (value) {
        onColorUrbanityController.setValue(false);

        municipalities.selectAll("path")
            .data(effectController.geofeatures)
            .attr("fill", d => populationColorScale(population[d.properties.iso][Math.floor(effectController.year)]))
            .select("title").text(d => d.properties.name + ": " + population[d.properties.iso][Math.floor(effectController.year)]);
    } else {
        if (effectController.colorPopulation === false) {
            clearColor();
        }
    }
});

onShowPopulationController.onChange(function (value) {
    if (value) {
        onShowCasesController.setValue(false);

        let year = Math.round(effectController.year);

        // we want to display values between 0 and 300k
        var domain = [0, 300000];

        // values are scaled to range 0,32
        var radius = d3.scale.sqrt().domain(domain).range([0, 24]);

        // update circle for each map feature in the data
        bubbles.selectAll("circle")
            .data(effectController.geofeatures)
            .attr("r", d => radius(population[d.properties.iso][Math.floor(year)]))
            .select("title").text(d => d.properties.name + ": " + population[d.properties.iso][Math.floor(year)]);

    } else if (!effectController.showCases) {
        bubbles.selectAll("circle").attr("r", 0);
    }
});
var updateBubbles = function () {
    let year = Math.round(effectController.year);

    // we want to display values between 0 and 500
    var domain = [0, 500];

    // values are scaled to range 0,32
    var radius = d3.scale.sqrt().domain(domain).range([0, 24]);

    let data = effectController.causes[effectController.causesOfDeath];

    // update circle for each map feature in the data
    bubbles.selectAll("circle")
        .data(effectController.geofeatures)
        .attr("r", d => radius(data[d.properties.iso][Math.floor(year)]))
        .select("title").text(d => d.properties.name + ": " + data[d.properties.iso][Math.floor(year)]);
}

onShowCasesController.onChange(function (value) {
    if (value) {
        onShowPopulationController.setValue(false);

        updateBubbles();

    } else if (!effectController.showPopulation) {
        bubbles.selectAll("circle").attr("r", 0);
    }
});


// initial view
// https://github.com/ginseng666/GeoJSON-TopoJSON-Austria
d3.json("data/gemeinden_wien_bezirke_topo.json", function (error, geodata) {
    if (error) return console.log(error); //unknown error, check the console

    //generate municipalities from TopoJSON
    effectController.geofeatures = topojson.feature(geodata, geodata.objects.gemeinden_wien_bezirke).features;

    //Create a path for each map feature in the data
    municipalities.selectAll("path")
        .data(effectController.geofeatures)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#cfcfcf")
        .on("click", clicked)    // onclick handler
        .append("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(effectController.data.get(d.properties.iso)));

    // create legend for bubbles
    // we want to display values between 0 and 300k
    var domain = [0, 300000];

    // values are scaled to range 0,32
    var radius = d3.scale.sqrt().domain(domain).range([0, 24]);

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

    //Create a circle for each map feature in the data for later use
    bubbles.selectAll("bubbles")
        .data(effectController.geofeatures)
        .enter()
        .append("circle")
        .attr("fill", "brown")
        .attr("fill-opacity", 0.8)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("transform", d => `translate(${path.centroid(d)})`)
        .attr("r", 0).append("title").text("");

    showCauses(effectController.causesOfDeath);
});

var showDistricts = function () {

    if (typeof districtGeofeatures === "undefined") {

        d3.json("data/bezirke_999_topo.json", function (error, geodata) {
            if (error) return console.log(error); //unknown error, check the console

            //generate municipalities from TopoJSON
            districtGeofeatures = topojson.feature(geodata, geodata.objects.bezirke).features;

            districts.selectAll("path")
                .data(districtGeofeatures)
                .enter()
                .append("path")
                .attr("d", path)
                .on("click", clicked)
            // .append("title").text(d => d.properties.name + ": " + getData(d));

            // todo: use real data
            // updateDistricts(districtGeofeatures);
        });
    } else {
        // todo: use real data
        // updateDistricts(districtGeofeatures);
    }
}


var showStates = function () {

    if (typeof stateGeofeatures === "undefined") {
        d3.json("data/laender_999_topo.json", function (error, geodata) {
            if (error) return console.log(error); //unknown error, check the console

            //generate municipalities from TopoJSON
            stateGeofeatures = topojson.feature(geodata, geodata.objects.laender).features;

            districts.selectAll("path")
                .data(stateGeofeatures)
                .enter()
                .append("path")
                .attr("d", path)
                .on("click", clicked)
                .append("title").text(d => d.properties.name + ": " + getData(d));

            updateDistricts(stateGeofeatures);
        });
    } else {
        updateDistricts(stateGeofeatures);
    }
}


// Add optional onClick events for municipalities here
// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
function clicked(d, i) {
    console.log(d.properties.name, d.properties.iso);
    console.log("index: " + i);
}


// Update map on zoom/pan
function zoomed() {
    municipalities.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    districts.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    bubbles.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
}
