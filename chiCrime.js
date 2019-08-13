var width = 700,
    height = 800;

var margin = {top: 500, right: 40, bottom: 0, left: 100}
    graph_width = 500 - margin.left - margin.right,
    graph_height = 900 - margin.top - margin.bottom

var formatNumber = d3.format(",d");

//Detailed Tooltip Selections
var tipDetail = {population:"population", crime:"crimePerK"},select;

//define color scale showing crime
var color = d3.scale.threshold()
    .domain([0, 10, 20, 30, 40, 50, 60])
    .range(colorbrewer.Reds[8]);

var graph_color = d3.scale.ordinal()
    .range(["#0890FF", "#6EBEFF", "#a1d5ff"])

//position encoding for the key only.
var x = d3.scale.linear()
    .domain([-0.6, 65])
    .range([0, 480]);

//Define x-axis
var legend_xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(function(d){ return (d)})

//an svg to append both svg's
var chartDiv = document.getElementById("chart");
var parentSVG = d3.select("body")
    .attr("align","center")
    .append("svg")
    .attr("id","parentSVG")
    .attr("width", width*2)
    .attr("height", height);

//svg for map
var svg = d3.select("#parentSVG")
    .append("svg")
    .attr("x",100)
    .attr("y", 0)
    .attr("width", (width-100))
    .attr("height", height)
    .attr("class", "map")
    .on("click", reset)

var g = svg.append("g")

//svg for bar graph
var svg2 = d3.select("#parentSVG")
    .append("svg")
    .attr("x",width+50)
    .attr("y", 315)
    .attr("width", width-100)
    .attr("height", height)
    .attr("class", "graph")

//space for tooltip
var tooltip = d3.select("body").append("div")
    .attr("class","tooltip")
    .style("position", "absolute")
    .style("display", "none")
    .style("font-size", "16px");


//Draw Legend
var legend = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(20,700)");

//color values for legend
legend.selectAll("rect")
    .data(color.range().map(function(d, i) {
      return {
        x0: i ? x(color.domain()[i - 1]) : x.range()[0],
        x1: i < color.domain().length ? x(color.domain()[i]) : x.range()[1],
        z: d
      };
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return d.x0; })
    .attr("width", function(d) { return d.x1 - d.x0; })
    .style("fill", function(d) { return d.z; });

legend.call(legend_xAxis).append("text")
    .attr("class", "caption")
    .attr("y", -6)
    .text("Crime per 1000 Residents");

var graph_xScale = d3.scale.ordinal().rangeRoundBands([0,300], 0.1)
var graph_yScale = d3.scale.linear().range([graph_height, 0])

var graph_xAxis = d3.svg.axis()
  .scale(graph_xScale)
  .orient("bottom");

var graph_yAxis = d3.svg.axis()
  .scale(graph_yScale)
  .orient("left")
  .ticks(5)

//globals
var popRange, crimeRange;

var active;
var Cdata;

//Load JSON file
d3.json("ChicagoData.json", function(error, json) {
  if (error) return console.error(error);

   popRange=minMax("population",json);
   crimeRange=minMax("crimePerK",json);

   //get data from file
   var features = topojson.feature(json, json.objects.features);

   Cdata = features;

   //correctly centers map
   var projection = d3.geo.albers()
      .center([8.25, 41.88205])
      .parallels([40, 45])
      .scale(80000)
      .rotate([92.35, .5, -4])
      .translate([((width / 2)-70), ((height / 2)-50)]);

   //calls the projection
   var path = d3.geo.path().projection(projection);
   var clickFlag = false;
    //draw neighborhood boundaries and use toolTip
    svg.selectAll(".features")
       .data(topojson.feature(json, json.objects.features).features)
       .enter().append("path")
       .attr("class", "neighborhood")
       .attr("d", path)
       .style("fill", function(d) {
          return color(d.properties["crimePerK"]);
      })
       .on("mouseover", function(d){
          dimMap(Cdata, svg, d.properties["comName"], true)
          tooltip.transition()
                 .duration(200)
                 .style("opacity", .9)
                 TooltipText(d,"comName","population","crimePerK", "percentbelowpoverty")
                    return tooltip.style("display","inline");
        })
    .on("mousemove", function(d){
        return tooltip.style("top", (height-340)+"px").style("left",(width-690)+"px");
    })
    .on("mouseout", function(d){
        //dimMap(Cdata, svg, d.properties["comName"], false)
        tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on('click', function(d){
          return tooltip.style("top", (height-340)+"px").style("left",(width-690)+"px");
      })
    .on("click", click)

});


function click(d){

  g.selectAll(".Cdata")
    .style("fill", function(d){console.log("init");return color(d.properties["population"])})

  if (active === d) return reset();
    g.selectAll(".active")
     .classed("active", false);
    d3.select(this).classed("active", active = d);

  clearLabel(d);
  communityLabel(d);
  appendLegend(Cdata, svg2);
  makeGraph(Cdata, svg2, d.properties["violentCrimes"], d.properties["homocideAssault"], d.properties["firearmRelated"])

    }

function reset(){

  g.selectAll(".active").classed("active", active = false);

}

function makeGraph(data, graph, violent, homocide, fireArm){

  var value = [{name:'Violent', number: violent}, {name:'Homicide', number: homocide}, {name:'FireArm', number: fireArm}];

  //returns range each axis--> x-axis = community, y-axis = percent below poverty
  graph_xScale.domain(value.map(function(d){return d.name;}));
  graph_yScale.domain([0,  value[0].number])

  //draws x-axis and positions label
  /*
  graph.append("g")
     .attr("class", "axis")
     //.attr("transform", "translate(80, 500)")
     .attr("transform", "translate(80," + (graph_height) + ")")
     .call(graph_xAxis)
     //.selectAll("text")
     //.attr("dx", "-.8em")
     //.attr("dy", ".25em")
     //.style("text-anchor", "end")
     //.attr("font-size", "10px")
    */

  //draws y-axis and positions label
  graph.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(80," + (0) + ")")
        .call(graph_yAxis)
        .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".25em")
        .style("text-anchor", "end")
        .attr("font-size", "10px")


  graph.selectAll('.bar')
     .data(value)
     .enter()
     .append('rect')
     .attr("classed", "bar")
     .attr("class","bars")
     .attr("height", 0)
     .attr("transform", "translate(80, 0)")
     .transition()
     .duration(700)
     .ease("linear")
     .attr({
        "x": function(d) {return graph_xScale(d.name); },
        "y": function(d){return graph_yScale(d.number); },
        "width": "50px",
        "height":  function(d){return graph_height - graph_yScale(d.number); },
        "fill": function(d){ return (graph_color(d.name))}
      })
}

function appendLegend(data, legend){

  var labels = ["Violent Crimes", "Homocide Assualt", "Fire Arm Related"]

  var graph_legend = legend.selectAll(".legend")
      .data(labels)
      .enter().append("g")
      .attr("class", "graph_legend")
      .attr("transform", "translate(200, 600)")
      .attr("transform", function(d, i) { return "translate(0," + i * 40 + ")"; });

  graph_legend.append("rect")
    .attr("x", graph_width - 18)
    .attr("width", 36)
    .attr("height", 36)
    .attr("fill", graph_color)

  graph_legend.append("text")
      .attr("x", graph_width - 30)
      .attr("y", 20)
      .attr("class", "legend")
      .attr("dy", ".7em")
      .attr("font-size", "12px")
      .style("text-anchor", "end")
      .text(function(d) { return d; });
}

function clearLabel(d, name){
  svg2.selectAll("text").remove()
      .attr("x", 200)
      .attr("y", 200)
      .attr("id", "neighborhood-label")
      .text(" ")

  svg2.selectAll('rect').data([]).exit().remove()
      .attr("classed", "bar")
      .attr("class", "bars")

  svg2.selectAll("g").remove("axis")

}

function communityLabel(d, name){
  svg2.append("text")
     .attr("x", 200)
     .attr("y", 200)
     .attr("id", "neighborhood-label" )
     .text(d.properties["comName"])
     .style("opacity", 1)
}

function dimMap(data, map, name, dim){
     var selected = [name]

      map.selectAll("data")
         .data(selected)
         .transition().duration(1000)
         .style("opacity", function(d){
            if(dim){
              return "0.5";
            }else return "1";
         })
    }

//Define the content of the ToolTip
function TooltipText(d,name,pop,crime, poverty){
    tooltip.html("<center><b>"+d.properties[name]+"</b></center><br/>"
                        +"Population <hideText> __di ___</hideText> :" + "<em>"  + d.properties[pop]+ "</em><br/>"
                        +"Below Poverty Level: " + "<em> " + "<hideText>_____</hideText>" + d.properties[poverty] + "</em>" + "<br/>"
                        +"Crime <hideText> ___________</hideText>: " + "<em>" + "<hideText>_____</hideText>" + d.properties[crime] + "</em><br/>"
                        +'<div id="help">*Crime Rate Per 1000 Residents</div>'
                        );
}

//returns a [min,max] array of argument. Target is in json Properties.
function minMax(toGet,d){
    var data = d.objects.features.geometries;
    return [d3.min(data, function(i){return i.properties[toGet];}),d3.max(data, function(i){return i.properties[toGet];})];
}

d3.select(self.frameElement).style("height", height + "px");
