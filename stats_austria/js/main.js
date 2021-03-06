// basic d3 map template from mapstarter.com

var municipalityGeofeatures, districtGeofeatures, stateGeofeatures;
var bubblesDomainPopulation = [0, 300000];
var bubblesDomainCases = [0, 1000];
var oldYear = 2002;

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

var deathsColorRange = ["#fff5f0", "#aa1017"];
var deathsColorScale = d3.scale.linear()
    .domain([0, 900])
    .range(deathsColorRange);

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


// Map dimensions (in pixels)
var width = window.innerWidth - 16,
    height = window.innerHeight - 16;

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
    .attr("transform", "translate(10,120)");

var legendLinear = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .shapeWidth(30)
    .cells(10)
    .title(effectController.causesOfDeath + ", Inzidenz pro 100.000 Einwohner")
    .orient('horizontal')
    .scale(deathsColorScale);

svg.select(".legendLinear")
    .call(legendLinear);

var updateLegend = function () {
    legendLinear = d3.legend.color()
        .labelFormat(d3.format(".0f"))
        .shapeWidth(30)
        .cells(10)
        .title(effectController.causesOfDeath + ", Inzidenz pro 100.000 Einwohner")
        .orient('horizontal')
        .scale(deathsColorScale);

    svg.select(".legendLinear")
        .call(legendLinear);
};

var updateBubblesLegend = function () {
    bubblesLegend.selectAll("*").remove();

    if (!effectController.showPopulation && !effectController.showCases) {
        return;
    }

    let domain = effectController.showCases ? bubblesDomainCases : bubblesDomainPopulation;

    // values are scaled to range 0, 24
    let radius = d3.scale.sqrt().domain(domain).range([0, 24]);

    bubblesLegend.selectAll("legend")
        .data(domain)
        .enter()
        .append("circle")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("cy", d => -radius(d))
        .attr("r", radius);

    bubblesLegend.selectAll("legend")
        .data(domain)
        .enter()
        .append("text")
        .data(domain)
        .attr("y", d => -2 * radius(d))
        .attr("dy", "1.3em")
        .text(d3.format(".1s"));

    // user may have zoomed
    zoomed();
};

//Create zoom/pan listener
//Change [1,Infinity] to adjust the min/max zoom scale
var zoom = d3.behavior.zoom()
    .scaleExtent([1, Infinity])
    .on("zoom", zoomed);

svg.call(zoom);


// display map legend at bottom right
var bubblesLegend = svg.append("g")
    .attr("fill", "#777")
    .attr("transform", `translate(${width - 50},${height - 2})`)
    .attr("text-anchor", "middle")
    .attr("class", "bubblesLegend")
    .style("font", "10px sans-serif");


// construct GUI and assign callback functions
var gui = new dat.GUI();

var f1 = gui.addFolder('Farbe');
var onColorUrbanityController = f1.add(effectController, 'colorUrbanity');
var onColorPopulationController = f1.add(effectController, 'colorPopulation');
f1.open();

var f2 = gui.addFolder('Details');

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

var headline = document.getElementById("headline");

var animate = function () {

    if (effectController.loop && effectController.year >= 2017) {
        effectController.year = 2002;
    }

    if (effectController.animate && effectController.year < 2017) {
        requestAnimationFrame(animate);
    } else {
        onAnimateController.setValue(false);
    }

    // add only 0.1 to slow down animation but show data for Math.floor(year)
    effectController.year += 0.1;

    // update only when year has changed
    if (Math.floor(effectController.year) !== oldYear) {
        oldYear = effectController.year;

        updateColor();

        if (effectController.showPopulation) {
            updateBubbles(population);
        } else if (effectController.showCases) {
            updateBubbles(effectController.causes[effectController.causesOfDeath]);
        }
    }
};


let getData = function (d) {
    let year = Math.floor(effectController.year);

    return effectController.causes[effectController.causesOfDeath][d.properties.iso][year];
};
let getIncidence = function (d) {
    let year = Math.floor(effectController.year);

    let pop = population[d.properties.iso][year];
    let cases = effectController.causes[effectController.causesOfDeath][d.properties.iso][year];
    return Math.round(100000 * cases / pop);
};


let updateDistricts = function (features) {

    // position tooltip, which is 240x150
    let getX = function () {
        let pageX = d3.event.pageX;
        return width - pageX < 240 ? pageX - 255 : pageX + 15;
    };
    let getY = function () {
        let pageY = d3.event.pageY;
        return height - pageY < 175 ? pageY - 180 : pageY + 15;
    };

    if (districts.selectAll("path")[0].length === 0) {
        // we have to create the paths first
        districts.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => deathsColorScale(getIncidence(d)))
            .on("click", clicked)
            .on("mouseover", function (d) {
                createChart(d);
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () {
                return tooltip.style("top", getY() + "px").style("left", getX() + "px");
            })
            .on("mouseout", function () {
                return tooltip.style("visibility", "hidden")
            });

    } else {
        // update for each map feature in the data
        districts.selectAll("path")
            .data(features)
            .attr("fill", d => deathsColorScale(getIncidence(d)))
            .on("click", clicked)
            .on("mouseover", function (d) {
                createChart(d);
                return tooltip.style("visibility", "visible");
            })
            .on("mousemove", function () {
                return tooltip.style("top", getY() + "px").style("left", getX() + "px");
            })
            .on("mouseout", function () {
                return tooltip.style("visibility", "hidden")
            });
    }
};

// show causes of death data here
var updateColor = function () {
    headline.innerText = "Todesursachen Österreich " + Math.floor(effectController.year);

    municipalities.selectAll("path")
        .data(municipalityGeofeatures)
        .attr("fill", d => deathsColorScale(getIncidence(d)))
        .select("title").text(d => d.properties.name + ": " + population[d.properties.iso][Math.floor(effectController.year)] + " Einwohner\n" + getData(d) + " Fälle, Inzidenz " + getIncidence(d));

    if (effectController.showPopulation) {
        updateBubbles(population);
    } else if (effectController.showCases) {
        updateBubbles(effectController.causes[effectController.causesOfDeath]);
    }

    if (effectController.granularity === "Bundesland") {
        updateDistricts(stateGeofeatures);
    } else if (effectController.granularity === "Bezirk") {
        updateDistricts(districtGeofeatures);
    }

};

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
        if (effectController.colorUrbanity) {
            onColorUrbanityController.setValue(false);
        } else if (effectController.colorPopulation) {
            onColorPopulationController.setValue(false);
        }

        animate();
    } else {
        effectController.animate = false;
    }
});

onYearChangeController.onChange(function (value) {
    if (value) {
        effectController.year = value;

        if (effectController.colorUrbanity) {
            onColorUrbanityController.setValue(false);
        } else if (effectController.colorPopulation) {
            onColorPopulationController.setValue(false);
        }

        updateColor();
    }
});

onGranularityChangeController.onChange(function (value) {
    if (value) {
        districts.selectAll("*").remove();

        if (effectController.colorUrbanity) {
            onColorUrbanityController.setValue(false);
        } else if (effectController.colorPopulation) {
            onColorPopulationController.setValue(false);
        }

        if (value === "Bezirk") {
            showDistricts();
        } else if (value === "Bundesland") {
            showStates();
        } else {
            updateDomain();
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
            max = 290;
            break;
        case causesOfDeathGroups[1]:
            min = 270;
            max = 550;
            break;
        case causesOfDeathGroups[2]:
            min = 30;
            max = 75;
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
            min = 35;
            max = 70;
            break;
    }
    onDomainMinChangeController.setValue(min);
    onDomainMaxChangeController.setValue(max);
};


onShowCausesOfDeathController.onChange(function (value) {
    if (value) {
        if (value in effectController.causes) {
            console.log(value + " already loaded");

            onYearChangeController.setValue(2002);
            updateColor();
            updateDomain(value);

            return;
        }

        console.log("loading data for " + value);
        d3.json("data/" + value + ".json", function (error, data) {
            if (error) return console.log(error); //unknown error, check the console

            //generate municipalities from TopoJSON
            effectController.causes[value] = data;

            onYearChangeController.setValue(2002);
            updateColor();
            updateDomain(value);
        });
    }
});


var clearColor = function () {
    municipalities.selectAll("path")
        .data(municipalityGeofeatures)
        .attr("fill", "#cfcfcf");
};

onColorUrbanityController.onChange(function (value) {
    if (value) {
        onColorPopulationController.setValue(false);

        municipalities.selectAll("path")
            .data(municipalityGeofeatures)
            .attr("fill", d => urbanityColorScale(urbanity.get(d.properties.iso)))
            .select("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(urbanity.get(d.properties.iso)));
    } else {
        if (effectController.colorPopulation === false) {
            clearColor();
            updateColor();
        }
    }
});


onColorPopulationController.onChange(function (value) {
    if (value) {
        onColorUrbanityController.setValue(false);

        municipalities.selectAll("path")
            .data(municipalityGeofeatures)
            .attr("fill", d => populationColorScale(population[d.properties.iso][Math.floor(effectController.year)]))
            .select("title").text(d => d.properties.name + ": " + population[d.properties.iso][Math.floor(effectController.year)] + " Einwohner");
    } else {
        if (effectController.colorPopulation === false) {
            clearColor();
            updateColor();
        }
    }
});

var updateBubbles = function (data) {
    let domain = effectController.showCases ? bubblesDomainCases : bubblesDomainPopulation;

    let year = Math.floor(effectController.year);

    // values are scaled to range 0, 24
    let radius = d3.scale.sqrt().domain(domain).range([0, 24]);

    let desc = effectController.showPopulation ? " Einwohner" : " Fälle";

    // update circle for each map feature in the data
    bubbles.selectAll("circle")
        .data(municipalityGeofeatures)
        .attr("r", d => radius(data[d.properties.iso][year]))
        .select("title").text(d => d.properties.name + ": " + data[d.properties.iso][year] + desc);
};

onShowPopulationController.onChange(function (value) {
    if (value) {
        onShowCasesController.setValue(false);

        // we want to display values between 0 and 300k
        updateBubbles(population);

    } else if (!effectController.showCases) {
        bubbles.selectAll("circle").attr("r", 0);
    }
    updateBubblesLegend();
});

onShowCasesController.onChange(function (value) {
    if (value) {
        onShowPopulationController.setValue(false);

        updateBubbles(effectController.causes[effectController.causesOfDeath]);

    } else if (!effectController.showPopulation) {
        bubbles.selectAll("circle").attr("r", 0);
    }
    updateBubblesLegend();
});


// initial view
// https://github.com/ginseng666/GeoJSON-TopoJSON-Austria
d3.json("data/gemeinden_wien_bezirke_topo.json", function (error, geodata) {
    if (error) return console.log(error); //unknown error, check the console

    //generate municipalities from TopoJSON
    municipalityGeofeatures = topojson.feature(geodata, geodata.objects.gemeinden_wien_bezirke).features;

    //Create a path for each map feature in the data
    municipalities.selectAll("path")
        .data(municipalityGeofeatures)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "#cfcfcf")
        .on("click", clicked)    // onclick handler
        .append("title").text(d => d.properties.name + ": " + urbanityCodeNames.get(effectController.data.get(d.properties.iso)));

    // create legend for bubbles
    updateBubblesLegend();

    //Create a circle for each map feature in the data for later use
    bubbles.selectAll("bubbles")
        .data(municipalityGeofeatures)
        .enter()
        .append("circle")
        .attr("fill", "brown")
        .attr("fill-opacity", 0.8)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("transform", d => `translate(${path.centroid(d)})`)
        .attr("r", 0).append("title").text("");

    onShowCausesOfDeathController.setValue(effectController.causesOfDeath);
    onGranularityChangeController.setValue("Bundesland");
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
};

var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "#fff");


var createChart = function (d) {

    let year = Math.floor(effectController.year);

    tooltip.selectAll("*").remove();

    let cases = effectController.causes[effectController.causesOfDeath][d.properties.iso];
    let arrData = [];

    for (let y = 2002; y <= 2017; y++) {
        arrData.push([y, cases[y]]);
    }

    // Set the dimensions of the canvas / graph
    let margin = {top: 5, right: 10, bottom: 20, left: 35},
        width = 240 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;

    let x = d3.time.scale()
        .range([0, width])

    let y = d3.scale.linear()
        .range([height, 0]);

    let xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d => ("0" + (d % 1000)).slice(-2)); // prepend zero to single digit years

    let yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    let line = d3.svg.line()
        .x(function (d) {
            return x(d.year);
        })
        .y(function (d) {
            return y(d.incidence);
        });

    let calcIncidence = function (year, cases) {
        let pop = population[d.properties.iso][year];
        return Math.round(100000 * cases / pop);
    };

    let data = arrData.map(function (d) {

        return {
            year: d[0],
            cases: d[1],
            incidence: calcIncidence(d[0], d[1])
        };

    });

    let incidence = calcIncidence(year, cases[year]);

    tooltip.append("p")
        .text(`${d.properties.name} ${year}: Inzidenz ${incidence}`);

    let svg = tooltip.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    x.domain(d3.extent(data, function (d) {
        return d.year;
    }));

    y.domain(d3.extent(data, function (d) {
        return d.incidence;
    }));

    /* use zero origin
       y.domain([0, d3.max(data, function (d) {
           return d.incidence;
       })]);
    */

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 2)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Inzidenz / 100.000");

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

    // mark currently shown data point
    svg.append("circle")
        .attr("fill", "red")
        .attr("r", 3)
        .attr("cx", x(year))
        .attr("cy", y(incidence));
};


var showStates = function () {

    if (typeof stateGeofeatures === "undefined") {
        d3.json("data/laender_999_topo.json", function (error, geodata) {
            if (error) return console.log(error); //unknown error, check the console

            //generate municipalities from TopoJSON
            stateGeofeatures = topojson.feature(geodata, geodata.objects.laender).features;

            updateDomain();
            updateDistricts(stateGeofeatures);

        });
    } else {
        updateDomain();
        updateDistricts(stateGeofeatures);
    }
};


// Add optional onClick events for municipalities here
// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
var clicked = function (d, i) {
    console.log(d.properties.name, d.properties.iso);
    console.log("index: " + i);
};


// Update map on zoom/pan
function zoomed() {
    municipalities.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    districts.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");
    bubbles.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
        .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px");

    if (effectController.showPopulation || effectController.showCases) {
        let domain = effectController.showCases ? bubblesDomainCases : bubblesDomainPopulation;

        // values are scaled to range 0, 24
        let radius = d3.scale.sqrt().domain(domain).range([0, 24]);

        bubblesLegend.selectAll("circle")
            .attr("r", d => radius(d) * zoom.scale())
            .attr("cy", d => (-radius(d) * zoom.scale()) + "px");
        //.attr("transform", d => "translate(" + (-radius(d) * zoom.scale() + ",0)"));
        //bubblesLegend.selectAll("*").attr(`translate(${-width * zoom.scale()},0)`);
    }
};
