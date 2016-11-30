var width = 1000,
    height = 800;

var formatNumber = d3.format(",d");

//Detailed Tooltip Selections
var tipDetail = {population:"population", crime:"crimePerK"},select;

//define color scale showing crime
var color = d3.scale.threshold()
    .domain([0, 10, 20, 30, 40, 50, 60])
    .range(colorbrewer.Blues[8]);

//position encoding for the key only.
var x = d3.scale.linear()
    //.domain([0, 5100]) //-0.6, 5
    .domain([-0.6, 65])
    .range([0, 480]);

//Define x-axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(function(d){ return (d)})
    //.tickFormat(function(d) { return d >= 100 ? formatNumber(d) : null; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//space for tooltip
var tooltip = d3.select("body").append("div")
    .attr("class","tooltip")
    .style("position", "absolute")
    //.style("opacity",0)
    .style("display", "none");


//Draw Legend
var legend = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(600,20)");

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

legend.call(xAxis).append("text")
    .attr("class", "caption")
    .attr("y", -6)
    .text("Crime per 1000 Residents");

//globals
var popRange, crimeRange;
var Cdata;

//Load JSON file
d3.json("ChicagoData.json", function(error, json) {
  if (error) return console.error(error);

   popRange=minMax("population",json);
   crimeRange=minMax("crimePerK",json);

   //get data from file
   var features = topojson.feature(json, json.objects.features);

   //make features global
   Cdata = features;

   //correctly centers map
   var projection = d3.geo.albers()
      .center([8.25, 41.88205])
      .parallels([40, 45])
      .scale(100000)
      .rotate([92.35, .5, -4])
      .translate([((width / 2)-150), ((height / 2)-50)]);

   //calls the projection
   var path = d3.geo.path().projection(projection);

    //draw neighborhood boundaries and use toolTip
    svg.selectAll(".features")
       .data(topojson.feature(json, json.objects.features).features)
       .enter().append("path")
       .attr("class", "neighborhood")
       .attr("d", path)
       //color map according to crime per capita
       .style("fill",
       function(d) {
        return color(d.properties["crimePerK"]);
      })
       //tooltip and dim on mouseover
       .on("mouseover", function(d){
          //dimMap(Cdata, svg, true)
          tooltip.transition()
                 .duration(200)
                 .style("opacity", .9)
                 TooltipText(d,"comName","population","crimePerK", "percentbelowpoverty")
                    return tooltip.style("display","inline");
        })
    //place toolTip in one location
    .on("mousemove", function(d){
        return tooltip.style("top", (height-420)+"px").style("left",(width-960)+"px");
    })
    //toolTip fade out
    .on("mouseout", function(d){
        //dimMap(Cdata, svg, false)
        tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    //on click, show more info about community selected
    .on("click", function(d){
      //clearLabel(d)
      console.log(d.properties["comName"])
      communityLabel(d)
      //show bar chart
    })

});

function clearLabel(d, name){
  svg.remove("text")
      .text(d.properties["comName"])
      .attr("x", 700)
      .attr("y", 100)
      .text(d.properties["comName"])
}

function communityLabel(d, name){
  svg.append("text")
     .attr("x", 800)
     .attr("y", 100)
     .attr("id", "neighborhood-label" )
     .text(d.properties["comName"])
     .style("opacity", 1)

}

function dimMap(data, map, dim){
      map.selectAll("path")
         .data(data.features)
         //.transition().duration(1000)
         .style("opacity", function(d){
            if(dim){
              return "0.5";
            }else return "1";
         })
    }

//Define the conent of the ToolTip
function TooltipText(d,name,pop,crime, poverty){
    tooltip.html("<center><b>"+d.properties[name]+"</b></center><br/>"
                        +"Population : " + d.properties[pop]+" people</em>"+"<br/>"
                        +"Households below poverty level: " + d.properties[poverty] + "%</em>" + "<br/>"
                        +"Crime: "+d.properties[crime]+"</em><br/>"
                        +'<div id="help">*Crime Rate Per 1000 Residents<div>'
                        );
}

//returns a [min,max] array of argument. Target is in json Properties.
function minMax(toGet,d){
    var data = d.objects.features.geometries;
    return [d3.min(data, function(i){return i.properties[toGet];}),d3.max(data, function(i){return i.properties[toGet];})];
}

d3.select(self.frameElement).style("height", height + "px");
