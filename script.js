var fast = 400; // ms
var slow = 2500; // ms
var data;
var colour_subset = [];
var tree = new kd_tree(colour_subset, colour_distance, ["red", "green"]);
var btree;
var rebalancing = false;
var green_puffin =
  "https://cdn.glitch.com/fd278a09-24fb-43f5-9f83-20f3c05c5a41%2Fpuffin-green.png?v=1616021331793";
var red_puffin =
  "https://cdn.glitch.com/fd278a09-24fb-43f5-9f83-20f3c05c5a41%2Fpuffin-red.png?v=1616021347946";
var clicked_puffin = false;

// Pretty good colour distance from
// http://www.compuphase.com/cmetric.htm
function colour_distance(a, b) {
  var dr = a.red - b.red;
  var dg = a.green - b.green;
  var db = a.blue - b.blue;
  var redmean = (a.red + b.red) / 2;
  return (
    (2 + redmean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - redmean) / 256) * db * db
  );
}

$(function() {
  // on document load
  function update(colour) {
    $("#picked").css("background", colour.toHex());
    var rgb = colour.toRgb();
    var search = { red: rgb.r, green: rgb.g, blue: rgb.b };
    var nearest = tree.nearest(search, 4);
    nearest.sort((a, b) => a[1] - b[1]);
    var $list = $("#results ul");
    $list.html("");
    for (var i = 0; i < nearest.length; i++) {
      var c = nearest[i][0];
      var $box = $("<div>")
        .css("background", c.hex)
        .css("display", "inline-block")
        .css("margin-right", "10px")
        .height("30px")
        .width("30px");
      var $line = $("<li>")
        .append($box)
        .append(c.title);
      $list.append($line);
    }
  }

  function set_RGB_from_hex(hex_colour) {
    var colour = new tinycolor(hex_colour.hex).toRgb();
    hex_colour.red = colour.r;
    hex_colour.green = colour.g;
    hex_colour.blue = colour.b;
  }

  // D3 kdtree

  var margin = { top: 0, right: 10, bottom: 25, left: 25 },
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    point_radius = 5;

  var x = d3.scale
    .linear()
    .range([0, width])
    .domain([0, 255]);

  var y = d3.scale
    .linear()
    .range([height, 0])
    .domain([0, 255]);

  var x_axis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom")
    .ticks(5);

  var y_axis = d3.svg
    .axis()
    .scale(y)
    .orient("left")
    .ticks(5);

  var hint_text = d3
    .select("#kdtree")
    .append("p")
    .text("Click to add a new puffin.")
    .attr("id", "hint-text");

  var svg = d3
    .select("#kdtree")
    .append("svg")
    .attr("class", "kdtree")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  svg
    .append("g") // Add the X Axis
    .attr("class", "x axis")
    .attr("transform", "translate(" + margin.left + "," + height + ")")
    .call(x_axis);

  svg
    .append("g") // Add the Y Axis
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(y_axis);

  svg
    .append("text")
    .attr(
      "transform",
      "translate(" +
        (width + margin.left) / 2 +
        " ," +
        (height + margin.bottom - 10) +
        ")"
    )
    .style("font-weight", "bold")
    .text("Speed");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left - 20)
    .attr("x", 0 - height / 2 - 15)
    .attr("dy", "1em")
    .style("font-weight", "bold")
    .text("Strength");

  var btn = d3.select("#go");

  var reorder = d3
    .select("#binarytree")
    .append("button")
    .text("Rebalance tree")
    .attr("id", "control-button")
    .on("click", () => {
      tree = new kd_tree(colour_subset, colour_distance, ["red", "green"]);
      data = tree.pointsBFS();
      rebalancing = true;
      draw_data_subset(data);
    });

  var graph = svg
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .attr("width", width)
    .attr("height", height);

  var lines_g = graph.append("g").attr("class", "lines");

  var points_g = graph.append("g").attr("class", "points");

  // D3 binarytree

  btree = d3.layout.tree().size([height, width]);

  var diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

  var bsvg = d3
    .select("#binarytree")
    .append("svg")
    .attr("class", "binarytree")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  var blines_g = bsvg.append("g").attr("class", "lines");

  var bpoints_g = bsvg.append("g").attr("class", "points");

  svg.on("click", function() {
    if (clicked_puffin) {
      clicked_puffin = false;
      return;
    }
    var coordinates = d3.mouse(this);
    var speed = (coordinates[0] / width) * 255;
    var strength = ((width - coordinates[1]) / width) * 255 + 5;
    new_node(coordinates, generate_name(), speed, strength, green_puffin);
  });

  btn.on("click", function() {
    d3.event.preventDefault();
    var size = document.getElementById("size").value;
    var weight = document.getElementById("weight").value;
    var name = document.getElementById("name").value;
    var puffin = document.getElementById("fly").checked
      ? green_puffin
      : red_puffin;
    new_node(
      [(size / 255) * 480 - 5, width - (weight * width) / 255 + 5],
      name,
      size,
      weight,
      puffin
    );
  });

  function new_node(coordinates, name, size, weight, puffin) {
    var red = x.invert(coordinates[0]);
    var green = y.invert(coordinates[1]);
    var colour = d3.rgb(red, green, 128);
    var object = {
      title: "user defined",
      hex: colour.toString(),
      name: name,
      size: size,
      weight: weight,
      puffin: puffin
    };
    set_RGB_from_hex(object);

    // check for very similar colours; don't insert to keep layouter sane
    var potential_duplicates = tree.nearest(object, 1);
    if (potential_duplicates.length > 0) {
      var distance = potential_duplicates[0][1];
      if (distance < 10) return;
    }

    colour_subset.push(object);
    tree.insert(object);
    data = tree.pointsBFS();
    draw_data_subset(data);
  }

  data = tree.pointsBFS();
  draw_data_subset(data);

  var i = 1;
  function draw_iteratively() {
    draw_data_subset(data.slice(0, i));
    if (i < data.length) {
      i++;
      setTimeout(draw_iteratively, 250);
    } else {
      i = 1;
    }
  }

  function transition_end() {
    rebalancing = false;
  }

  function pick_random(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function generate_name(gender) {
    var names = [
      "Fran",
      "Elisa",
      "Anita",
      "Deborah",
      "Sally",
      "Adele",
      "Shafi",
      "Margaret",
      "Grace",
      "Sara",
      "Daphne",
      "Barbara",
      "Ada",
      "Mary",
      "Karen",
      "Lixia",
      "Radia",
      "Amal",
      "Jade",
      "Sharla",
      "Kathleen",
      "Cynthia",
      "Amy",
      "Cristina",
      "Lynn",
      "Véronique",
      "Radhia",
      "Lois",
      "Jeri",
      "Judy",
      "Susan",
      "Cordelia",
      "Mor",
      "Patricia",
      "Leslie",
      "Gabriele",
      "Janet",
      "Monica",
      "Ming",
      "Yanhong",
      "Nancy",
      "Pattie",
      "Jennifer",
      "Brandeis",
      "Maja",
      "Kathryn",
      "Kay",
      "Terri",
      "Catuscia",
      "Brigitte",
      "Diane",
      "Jean",
      "Alexandra",
      "Ellen",
      "Betty",
      "Ana",
      "Lynn",
      "Alley",
      "Eva",
      "Xiaoyuan",
      "Hanna",
      "Gloria",
      "Stephanie",
      "Marlyn",
      "Jeanette",
      "Wang",
      "Kathy",
      "Shaula",
      "Greta",
      "Anna"
    ];
    return pick_random(names);
  }

  function draw_data_subset(data_subset) {
    if (data_subset.length > 0) {
      hint_text.style("opacity", 0.0);
    } else {
      hint_text.style("opacity", 1.0);
    }
    if (data_subset.length > 1) {
      reorder.style("opacity", 1.0);
    } else {
      reorder.style("opacity", 0.0);
    }

    // points
    {
      var pointsSelection = points_g
        .selectAll(".point")
        .data(data_subset, d => d.hex + "point");

      var g = pointsSelection
        .enter()
        .append("g")
        .attr("class", d => {
          d.fresh = true;
          return "point";
        })
        .attr("class", "point")
        .style("fill", d => d3.rgb(d.hex))
        .style("stroke", d => d3.rgb(d.hex));

      var img = g
        .append("svg:image")
        .attr("xlink:href", d => d.puffin)
        .attr("x", d => x(d.red) - 10)
        .attr("y", d => y(d.green) - 10)
        .attr("width", 20)
        .attr("height", 20)
        .on("mouseover", function(d) {
          if (d.fresh) return;
          var parent = d.node;
          while (parent) {
            parent.onAccessPath = true;
            parent = parent.parent;
          }
          draw_data_subset(data);
        })
        .on("mouseout", function(d) {
          if (d.fresh) {
            d.fresh = false;
            return;
          }
          var parent = d.node;
          while (parent) {
            parent.onAccessPath = false;
            parent = parent.parent;
          }
          draw_data_subset(data);
        })
        .on("click", function(d) {
          clicked_puffin = true;
          if (d.puffin == green_puffin) {
            img.attr("xlink:href", red_puffin);
            d.puffin = red_puffin;
          } else {
            img.attr("xlink:href", green_puffin);
            d.puffin = green_puffin;
          }
        });

      g.append("text")
        .attr("x", d => x(d.red + 5))
        .attr("y", d => y(d.green + 5))
        .text(d => d.name + " (" + Math.round(d.size) + "," + Math.round(d.weight) + ")");

      g.style("stroke-width", d =>  d.node.onAccessPath || d.node.isSearchResult ? 2 : 0);

      // lines

      var selection = lines_g
        .selectAll(".point-line")
        .data(data_subset, d => d.hex + "line");

      selection // update
        .style("stroke-width", d => d.node.onAccessPath ? (2 * height) / 400 : height / 400)
        .transition()
        .duration(() => rebalancing ? slow : fast)
        .each("end", transition_end)
        .attr("x1", d => x(d.x1))
        .attr("y1", d => y(d.y1))
        .attr("x2", d => x(d.x2))
        .attr("y2", d => y(d.y2))
        .attr("stroke", d => {
          switch (d.dimension) {
            case 0:
              return d3.rgb(d.red, 0, 0);
            case 1:
              return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        });

      selection
        .enter()
        .append("line")
        .attr("class", "point-line")
        // .attr("stroke-width", function(d) { return w(d.depth); })
        .attr("stroke-width", height / 400)
        // .style("opacity", 0.8)
        // start all animation from point
        .attr("x1", d => x(d.red))
        .attr("y1", d => y(d.green))
        .attr("x2", d => x(d.red))
        .attr("y2", d =>  y(d.green))
        .attr("stroke", d => {
          switch (d.dimension) {
            case 0:
              return d3.rgb(d.red, 0, 0);
            case 1:
              return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        })
        .transition()
        .attr("x1", d => x(d.x1))
        .attr("y1", d => y(d.y1))
        .attr("x2", d =>  x(d.x2))
        .attr("y2", d => y(d.y2));

      selection; // enter + update
      // .transition()

      selection.exit().remove();
    }

    // binary tree
    {
      // nodes
      var depth = d3.max(data_subset, d => d.depth);

      var binary_tree_points = bpoints_g
        .selectAll(".binarytreepoint")
        .data(data_subset, d =>  d.hex + "binarytreepoint");
      
      var texts = bpoints_g
        .selectAll("text")
        .data(data_subset);   
      
      binary_tree_points
        .enter()
        .append("text").text(d => d.name)
        .attr("class", "binarytreepoint")
        .style("stroke", d => d3.rgb(d.hex));
      
      /*var text = g.append("text")
        .text(d => d.name);*/
      
      binary_tree_points // enter + update
        .style("stroke-width", d =>  d.node.onAccessPath ? 2 : 0)
        .transition()
        .duration(() => rebalancing ? slow : fast)
        .attr("x", d => {
          if (!d.node.parent) {
            d.node.bx = width / 2;
          } else {
            var inc = (width - 4 * point_radius) / Math.pow(2, d.depth + 1);
            if (d.node == d.node.parent.left) {
              // left child
              d.node.bx = d.node.parent.bx - inc;
            } else {
              // right child
              d.node.bx = d.node.parent.bx + inc;
            }
          }
          return d.node.bx;
        })
        .attr("y", d => {
          d.node.by =
            d.depth * ((height - 4 * point_radius) / depth) + 2 * point_radius;
          return d.node.by;
        })
        .style("fill", d => d3.rgb(d.hex));
      

      binary_tree_points.exit().remove();

      // edges

      var selection = blines_g
        .selectAll(".binarytreepoint-edge")
        .data(data_subset, d => d.hex + "binarytreepoint-edge");

      selection // update
        .style("stroke-width", d => d.node.onAccessPath ? (2 * height) / 400 : height / 400)
        .transition()
        .duration(() => rebalancing ? slow : fast)
        .attr("x1", d =>  d.node.parent ? d.node.parent.bx : d.node.bx)
        .attr("y1", d =>  d.node.parent ? d.node.parent.by : d.node.by)
        .attr("x2", d => d.node.bx)
        .attr("y2", d => d.node.by)
        .attr("stroke", d => {
          // return "gray";
          switch (d.dimension) {
            case 0:
              return d3.rgb(d.red, 0, 0);
            case 1:
              return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        });

      selection
        .enter()
        .append("line")
        .attr("class", "binarytreepoint-edge")
        // .attr("stroke-width", function(d) { return w(d.depth); })
        .attr("stroke-dasharray", "1,3")
        .attr("stroke-width", height / 400)
        .style("opacity", 0.8)
        // start all animation from point
        .attr("x1", d => d.node.parent ? d.node.parent.bx : d.node.bx)
        .attr("y1", d => d.node.parent ? d.node.parent.by : d.node.by)
        .attr("x2", d => d.node.parent ? d.node.parent.bx : d.node.bx)
        .attr("y2", d => d.node.parent ? d.node.parent.by : d.node.by)
        .attr("stroke", d => {
          // return "gray";
          switch (d.dimension) {
            case 0:
              return d3.rgb(d.red, 0, 0);
            case 1:
              return d3.rgb(0, d.green, 0);
            // case 2: return "green";
          }
        })
        .transition()
        .attr("x1", d => d.node.parent ? d.node.parent.bx : d.node.bx)
        .attr("y1", d => d.node.parent ? d.node.parent.by : d.node.by)
        .attr("x2", d => d.node.bx)
        .attr("y2", d => d.node.by);
      
      selection.append("text").text("test");

      selection; // enter + update
      // .transition()

      selection.exit().remove();
    }
  }
});
