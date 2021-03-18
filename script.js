var fast = 400; // ms
var slow = 2500; // ms
var data;
var colorSubset = [];
var tree = new kdTree(colorSubset, colorDistance, ["red", "green"]);
var bTree;
var rebalancing = false;
var green_puffin = "https://cdn.glitch.com/fd278a09-24fb-43f5-9f83-20f3c05c5a41%2Fpuffin-green.png?v=1616021331793";
var red_puffin = "https://cdn.glitch.com/fd278a09-24fb-43f5-9f83-20f3c05c5a41%2Fpuffin-red.png?v=1616021347946";
var clicked_puffin = false;

// Pretty good color distance from
// http://www.compuphase.com/cmetric.htm
function colorDistance(a, b) {
  var dr = a.red - b.red;
  var dg = a.green - b.green;
  var db = a.blue - b.blue;
  var redMean = (a.red + b.red)/2;
  return (2+redMean/256)*dr*dr + 4*dg*dg + (2 + (255 - redMean)/256)*db*db;
}

$(function(){ // on document load
  function update(color) {

    // remove old search results
    // nearest.forEach(function(d, i) {
    //   d[0].node.isSearchResult = false;
    // });

    $("#picked").css('background', color.toHex());
    var rgb = color.toRgb();
    var search = {red: rgb.r, green: rgb.g, blue: rgb.b};
    var nearest = tree.nearest(search, 4);
    nearest.sort(function(a,b){return a[1] - b[1]});
    var $list = $("#results ul");
    $list.html("");
    for(var i=0; i<nearest.length; i++) {
      var c = nearest[i][0];
      var $box = $("<div>")
        .css('background', c.hex)
        .css('display', 'inline-block')
        .css('margin-right', '10px')
        .height('30px')
        .width('30px');
      var $line = $("<li>").append($box).append(c.title);
      $list.append($line);
    }

  //updateSearchResults(nearest);
  }

  function setRGBfromHex (hex_color) {
    var color = new tinycolor(hex_color.hex).toRgb();
    hex_color.red = color.r;
    hex_color.green = color.g;
    hex_color.blue = color.b;
  }

  // D3 kdtree

  var margin = {top: 0, right: 10, bottom: 25, left: 25},
    width  = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    pointRadius = 5;

  var x = d3.scale.linear()
    .range([0, width])
    .domain([0, 255]);

  var y = d3.scale.linear()
    .range([height, 0])
    .domain([0, 255]);
  
  var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

  var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

  var hintText = d3.select("#kdtree").append("p")
    .text("Click to add a new puffin.")
    .attr("id", "hint-text");

  var svg = d3.select("#kdtree").append("svg")
    .attr("class", "kdtree")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  
  svg.append("g")         // Add the X Axis
        .attr("class", "x axis")
        .attr("transform", "translate("+margin.left+"," + height + ")")
        .call(xAxis);
  
  svg.append("g")         // Add the Y Axis
        .attr("class", "y axis")
        .attr("transform", "translate("+margin.left+","+(margin.top)+")")
        .call(yAxis);
  
  svg.append("text")
    .attr("transform", "translate(" + ((width+margin.left) / 2) + " ," + (height + margin.bottom - 10) + ")")
    .style("font-weight", "bold")
    .text("Speed");
  
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left-20)
    .attr("x", 0-(height/2)-15)
    .attr("dy", "1em")
    .style("font-weight", "bold")
    .text("Strength");
  
  var btn = d3.select("#go");

  var reorder = d3.select("#binarytree").append("button")
    .text("Rebalance tree")
    .attr("id", "control-button")
    .on("click", function() {
      tree = new kdTree(colorSubset, colorDistance, ["red", "green"]);
      data = tree.pointsBFS();
      rebalancing = true;
      drawDataSubset(data);
    });

  var graph = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width)
    .attr("height", height);

  var linesG = graph.append("g")
    .attr("class", "lines");

  var pointsG = graph.append("g")
    .attr("class", "points");

  // D3 binarytree

  bTree = d3.layout.tree()
    .size([height, width]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

  var bSvg = d3.select("#binarytree").append("svg")
    .attr("class", "binarytree")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  var bLinesG = bSvg.append("g")
    .attr("class", "lines");

  var bPointsG = bSvg.append("g")
    .attr("class", "points");

  svg.on('click', function() {
    if(clicked_puffin) {
      clicked_puffin = false;
      return
    };
    var coordinates = d3.mouse(this);
    var speed = coordinates[0]/width*255;
    var strength = (width-coordinates[1])/width*255+5;
    new_node(coordinates, generate_name(), speed, strength, green_puffin);
  });
  
  btn.on('click', function() {
    d3.event.preventDefault();
    var size = document.getElementById("size").value;
    var weight = document.getElementById("weight").value;
    var name = document.getElementById("name").value;
    var puffin = document.getElementById("fly").checked ? green_puffin : red_puffin;
    new_node([size/255*480-5,width-weight*width/255+5], name, size, weight, puffin);
  });

  function new_node(coordinates, name, size, weight, puffin){
    var red   = x.invert( coordinates[0] );
    var green = y.invert( coordinates[1] );
    var color = d3.rgb(red, green, 128);
    var object = { title: "user defined", hex: color.toString(), name: name, size: size, weight: weight, puffin: puffin };
    setRGBfromHex(object);
 
    // check for very similar colors; don't insert to keep layouter sane
    var potentialDuplicates = tree.nearest(object, 1);
    if (potentialDuplicates.length > 0) {
      var distance = potentialDuplicates[0][1];
      if (distance < 10) return;
    }

    colorSubset.push(object);
    tree.insert(object);
    data = tree.pointsBFS();
    drawDataSubset(data);
  }

  data = tree.pointsBFS();
  drawDataSubset(data);

  var i = 1;
  function drawIteratively(){
    drawDataSubset(data.slice(0, i));
    if (i < data.length) {
      i++;
      setTimeout(drawIteratively, 250);
    } else {
      i = 1;
    }
  }

  function transitionEnd() {
    rebalancing = false;
  }
  
  function pick_random(list) {
    return list[Math.floor(Math.random()*list.length)]
  }
  
  function generate_name(gender) {
    var names = ["Fran", "Elisa", "Anita", "Deborah", "Sally", "Adele", "Shafi", 
                 "Margaret", "Grace", "Sara", "Daphne", "Barbara", "Ada", "Mary", 
                 "Karen", "Lixia", "Radia", "Amal", "Jade", "Sharla", "Kathleen", 
                 "Cynthia", "Amy", "Cristina", "Lynn", "Véronique", "Radhia", 
                "Lois", "Jeri", "Judy", "Susan", "Cordelia", "Mor", "Patricia", 
                 "Leslie", "Gabriele", "Janet", "Monica", "Ming", "Yanhong", "Nancy", 
                "Pattie", "Jennifer", "Brandeis", "Maja", "Kathryn", "Kay", "Terri", 
                 "Catuscia", "Brigitte", "Diane", "Jean", "Alexandra", "Ellen", 
                 "Betty", "Ana", "Lynn", "Alley", "Eva", "Xiaoyuan", "Hanna", 
                 "Gloria", "Stephanie", "Marlyn", "Jeanette",
                "Wang", "Kathy", "Shaula", "Greta", "Anna"];
    return pick_random(names);
  }

  function drawDataSubset(dataSubset) {
    if (dataSubset.length > 0) {
      hintText.style("opacity", 0.0);
    } else {
      hintText.style("opacity", 1.0);
    }
    if (dataSubset.length > 1) {
      reorder.style("opacity", 1.0);
    } else {
      reorder.style("opacity", 0.0);
    }

    // points
    {
      var pointsSelection = pointsG.selectAll(".point")
        .data(dataSubset, function(d){return d.hex + "point";});

      var g = pointsSelection.enter()
        .append("g")
        .attr("class", function(d) { d.fresh = true; return "point" })
        .attr("class", "point")
        .style("fill",   function(d) { return d3.rgb(d.hex); })
        .style("stroke", function(d) { return d3.rgb(d.hex); });
      
      var img = g.append("svg:image")
        .attr("xlink:href", function(d) {return d.puffin})
        .attr("x",      function(d) { return x(d.red)-10;  })
        .attr("y",      function(d) { return y(d.green)-10; })
        .attr('width', 20)
        .attr('height', 20)
        .on("mouseover", function(d) {
          if (d.fresh) return;
          var parent = d.node;
          while(parent) {
            parent.onAccessPath = true;
            parent = parent.parent;
          }
          drawDataSubset(data);
        })
        .on("mouseout", function(d) {
          if (d.fresh) {
            d.fresh = false;
            return;
          }
          var parent = d.node;
          while(parent) {
            parent.onAccessPath = false;
            parent = parent.parent;
          }
          drawDataSubset(data);
        })
        .on("click", function(d){
          clicked_puffin = true;
          if (d.puffin == green_puffin) {
            img.attr("xlink:href", red_puffin);
            d.puffin = red_puffin;
          }
          else{
            img.attr("xlink:href", green_puffin);
            d.puffin = green_puffin;
          }
        });
      
        g.append("text")
          .attr("x", function(d) {
            return x(d.red+5);
          })
          .attr("y", function(d) {
            return y(d.green+5);
          })
        .text(function(d){
            return d.name+" ("+Math.round(d.size)+","+Math.round(d.weight)+")";
        });

      g
        .style("stroke-width",  function(d) { return d.node.onAccessPath || d.node.isSearchResult ? 2 : 0; });

      // lines

      var selection = linesG.selectAll(".point-line")
        .data(dataSubset, function(d){return d.hex + "line";});

      selection // update
        .style("stroke-width",  function(d) { return d.node.onAccessPath ? 2*height/400 : height/400; })
        .transition().duration(function(){ return rebalancing ? slow : fast }).each("end", transitionEnd)
        .attr("x1",    function(d) { return x(d.x1); })
        .attr("y1",    function(d) { return y(d.y1); })
        .attr("x2",    function(d) { return x(d.x2); })
        .attr("y2",    function(d) { return y(d.y2); })
        .attr("stroke",function(d) {
          switch(d.dimension) {
            case 0: return d3.rgb(d.red, 0, 0);
            case 1: return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        })

      selection.enter()
        .append("line")
        .attr("class", "point-line")
        // .attr("stroke-width", function(d) { return w(d.depth); })
        .attr("stroke-width", height/400)
        // .style("opacity", 0.8)
        // start all animation from point
        .attr("x1",    function(d) { return x(d.red); })
        .attr("y1",    function(d) { return y(d.green); })
        .attr("x2",    function(d) { return x(d.red); })
        .attr("y2",    function(d) { return y(d.green); })
        .attr("stroke",function(d) {
          switch(d.dimension) {
            case 0: return d3.rgb(d.red, 0, 0);
            case 1: return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        })
        .transition()
        .attr("x1",    function(d) { return x(d.x1); })
        .attr("y1",    function(d) { return y(d.y1); })
        .attr("x2",    function(d) { return x(d.x2); })
        .attr("y2",    function(d) { return y(d.y2); })

      selection // enter + update
        // .transition()

      selection.exit()
        .remove();
    }

    // binary tree
    {

      // nodes
      var depth = d3.max(dataSubset, function(d){return d.depth;})

      var binaryTreePoints = bPointsG.selectAll(".binarytreepoint")
        .data(dataSubset, function(d){return d.hex + "binarytreepoint";});

      binaryTreePoints.enter()
        .append("circle")
        .attr("class", "binarytreepoint")
        .attr("dimension", function(d) { return d.dimension;  })
        .attr("r", pointRadius)
        .style("fill",   function(d) { return d3.rgb(d.hex); })
        .style("stroke", function(d) { return d3.rgb(d.hex); });

      binaryTreePoints // enter + update
        .style("stroke-width",  function(d) { return d.node.onAccessPath ? 2 : 0; })
        .transition().duration(function(){ return rebalancing ? slow : fast })
        .attr("cx",      function(d) {
          if (!d.node.parent) {
            d.node.bx = width / 2;
          } else {
            var inc = (width - 4*pointRadius) / Math.pow(2, d.depth + 1 );
            if (d.node == d.node.parent.left) { // left child
              d.node.bx = d.node.parent.bx - inc;
            } else { // right child
              d.node.bx = d.node.parent.bx + inc;
            }
          }
          return d.node.bx;
        })
        .attr("cy",      function(d) {
          d.node.by = (d.depth * ((height - 4*pointRadius) / depth)) + (2 * pointRadius);
          return d.node.by;
        })
        .style("fill",   function(d) { return d3.rgb(d.hex); })

      binaryTreePoints.exit()
        .remove();

      // edges

      var selection = bLinesG.selectAll(".binarytreepoint-edge")
        .data(dataSubset, function(d){return d.hex + "binarytreepoint-edge";});

      selection // update
        .style("stroke-width",  function(d) { return d.node.onAccessPath ? 2*height/400 : height/400; })
        .transition().duration(function(){ return rebalancing ? slow : fast })
        .attr("x1",    function(d) { return d.node.parent ? d.node.parent.bx : d.node.bx; })
        .attr("y1",    function(d) { return d.node.parent ? d.node.parent.by : d.node.by; })
        .attr("x2",    function(d) { return d.node.bx;                            })
        .attr("y2",    function(d) { return d.node.by;                            })
        .attr("stroke",function(d) {
          // return "gray";
          switch(d.dimension) {
            case 0: return d3.rgb(d.red, 0, 0);
            case 1: return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        })

      selection.enter()
        .append("line")
        .attr("class", "binarytreepoint-edge")
        // .attr("stroke-width", function(d) { return w(d.depth); })
        .attr("stroke-dasharray", "1,3")
        .attr("stroke-width", height/400)
        .style("opacity", 0.8)
        // start all animation from point
        .attr("x1",    function(d) { return d.node.parent ? d.node.parent.bx : d.node.bx; })
        .attr("y1",    function(d) { return d.node.parent ? d.node.parent.by : d.node.by; })
        .attr("x2",    function(d) { return d.node.parent ? d.node.parent.bx : d.node.bx; })
        .attr("y2",    function(d) { return d.node.parent ? d.node.parent.by : d.node.by; })
        .attr("stroke",function(d) {
          // return "gray";
          switch(d.dimension) {
            case 0: return d3.rgb(d.red, 0, 0);
            case 1: return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        })
        .transition()
        .attr("x1",    function(d) { return d.node.parent ? d.node.parent.bx : d.node.bx; })
        .attr("y1",    function(d) { return d.node.parent ? d.node.parent.by : d.node.by; })
        .attr("x2",    function(d) { return d.node.bx;                            })
        .attr("y2",    function(d) { return d.node.by;                            })

      selection // enter + update
        // .transition()

      selection.exit()
        .remove();

    }
  }

});