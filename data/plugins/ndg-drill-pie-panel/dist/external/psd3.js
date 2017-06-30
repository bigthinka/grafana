/**
 *
 */
var psd3 = psd3 || {};
psd3.Graph = function(config) {
    var _this = this;
    _this.lastColorId =0;
    _this.rootNode = [];
    this.config = config;
    this.defaults = {
        width: 400,
        height: 400,
        value: "value",
        inner: "inner",
        label: function(d) {
            return d.data.value;
        },
        tooltip: function(d) {
            if (_this.config.value !== undefined) {
                return d[_this.config.value];
            } else {
                return d.value;
            }

        },
        transition: "linear",
        transitionDuration: 1000,
        donutRadius: 0,
        gradient: false,
        colors: function (name) {

            // So best idea is allocate new names colors from list, store the name color map on pie

            var colors = {
                "Free": "#4daa4b",
                "Pay":"#a3acb2",
                "Pay Calcio":"#cb2121",
                "Pay Intrattenimento":"#2383c1",
                "Serie Tv": "orange",
                "Mediaset Tematiche":"#d2ab58",
                "Cinema":"#e65414",
                "Mediaset Storiche":"#44b9b0",
                "Lineare": "#4daa4b",
                "Mediaset": "#a3acb2",
                "Rai": "red",
                "Altro": "#2383c1",
                "VOD": "#d2ab58",
                "Mediaset": "#2383c1",
                "Rai": "orange",
                "Altro": "#e65414"
            };

            if (name in colors) {
                return colors[name];
            } else {
                // console.log("no color assigned for name:"+name);
                var colors = ["#CE2AEB","#ae83d5","#CC9FB1", "#BCA44A","#D1C87F", "#daca61"];
                var maxIndex = colors.length -1;
                var selected = colors[_this.lastColorId];
                _this.lastColorId+=1;
                if (_this.lastColorId > maxIndex) {
                    _this.lastColorId =0;
                }
                return selected;

            }
            //return d3.scale.category10(name);
        },
        labelColor: "black",
        drilldownTransition: "linear",
        drilldownTransitionDuration: 0,
        stroke: "black",
        strokeWidth: 2,
        highlightColor: "grey"
    };
    /*console.log("before defaults");
    for(var property in config){
        console.log(property);
    }*/
    for (var property in this.defaults) {
        if (this.defaults.hasOwnProperty(property)) {
            if (!config.hasOwnProperty(property)) {
                config[property] = this.defaults[property];
            }
        }
    }
    /*console.log("after defaults");
    for(var property in config){
        console.log(property);
    }*/
};

var psd3 = psd3 || {};

psd3.Pie = function(config) {
    psd3.Graph.call(this, config);
    this.zoomStack = [];
    var pos = "top";
    if (this.config.heading !== undefined && this.config.heading.pos !== undefined) {
        pos = this.config.heading.pos;
    }
    if (pos == "top") {
        this.setHeading();
    }

    //this.calcDimensions();
    this.drawPie(config.data);
    if (pos == "bottom") {
        this.setHeading();
    }
};

psd3.Pie.prototype = Object.create(psd3.Graph.prototype);

psd3.Pie.prototype.constructor = psd3.Pie;

psd3.Pie.prototype.findMaxDepth = function(dataset) {
    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return 0;
    }
    var currentLevel;
    var maxOfInner = 0;
    for (var i = 0; i < dataset.length; i++) {
        var maxInnerLevel = this.findMaxDepth(dataset[i][this.config.inner]);
        if (maxOfInner < maxInnerLevel) {
            maxOfInner = maxInnerLevel;
        }
    }
    currentLevel = 1 + maxOfInner;
    return currentLevel;
};

psd3.Pie.prototype.setHeading = function() {
    if (this.config.heading !== undefined) {
        d3.select("#" + this.config.containerId)
            .append("div")
            .style("text-align", "center")
            .style("margin-bottom", "10px")
            .append("strong")
            .text(this.config.heading.text);
    }
};

psd3.Pie.prototype.mouseover = function(d) {
    var tooltipId = d.containerId + "_tooltip";

    d3.select("#" + tooltipId)
        .style("left", (d3.event.clientX + window.scrollX) + "px")
        .style("top", (d3.event.clientY + window.scrollY - 50) + "px")
        .select("#value")
        .html(d.config.tooltip(d.data, d.config.label));
    d3.select("#" + tooltipId).classed("psd3Hidden", false);
    d3.select(d.path)
        .style("fill", d.config.highlightColor);
};
psd3.Pie.prototype.mouseout = function(d) {
    var tooltipId = d.containerId + "_tooltip";
    d3.select("#" + tooltipId).classed("psd3Hidden", true);
    d3.select(d.path)
        .style("fill", d.fill);
};

psd3.Pie.prototype.drawPie = function(dataset) {
    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return;
    }

    var _this = this;
    //Get the rootNode of data to display
    if (_this.rootNode.length > 0) {
        for (var desiredIdx in _this.rootNode) {
            for (var index in dataset) {
                if (dataset[index].name == _this.rootNode[desiredIdx]) {
                    dataset = dataset[index].drilldown;
                    break;
                }
            }
        }

    }


    _this.lastColorId =0;
    _this.arcIndex = 0;
    var svg = d3.select("#" + _this.config.containerId)
        .append("svg")
        .attr("id", _this.config.containerId + "_svg")
        .attr("width", _this.config.width)
        .attr("height", _this.config.height);

    _this.tooltipId = _this.config.containerId + "_tooltip";
    var tooltipDiv = d3.select("#" + _this.config.containerId).append("div")
        .attr("id", _this.tooltipId)
        .attr("class", "psd3Hidden psd3Tooltip");
    tooltipDiv.append("p")
        .append("span")
        .attr("id", "value")
        .text("100%");

    if (_this.config.legendId) {

        var legendIndex = 0,
            legendRectSize = 18,
            legendSpacingY = 4,
            legendSpacingX = 18;

        var legendContainer = d3.select("#" + _this.config.legendId),
            legendSvg = legendContainer.select("#" + _this.config.legendId + "_svg");

        if (legendSvg.empty()) legendSvg = legendContainer.append("svg").attr("id", _this.config.legendId + "_svg" ).attr("class", "pieChartLegend");

        var calcInnerDeep = function (dataset, deep) {
            if (deep == undefined) deep = 0;
            if (!dataset) return deep;

            deep += dataset.length;

            for (var j = 0; j < dataset.length; j++) {
                if (dataset[j][_this.config.inner] !== undefined) {
                    deep += calcInnerDeep(dataset[j][_this.config.inner], deep);
                }
            }

            return deep;
        };

        var drawLegend = function (svg, dataset, level, parentDataIndex, parentX, parentY) {
            if (dataset === null || dataset === undefined || dataset.length < 1) {
                return;
            }

            var legendClass = _this.config.legendId + "_leg_" + legendIndex;

            var legend = svg.selectAll("g."+legendClass)
                .data(dataset)
                .enter()
                .append('g')
                .attr('class', "legend "+legendClass)
                .attr('transform', function(d, i) {
                    var height = legendRectSize + legendSpacingY;

                    d.x = (parentX == undefined) ? 0 : parentX + legendSpacingX;
                    d.y = (parentY == undefined) ? 0 : parentY + height;

                    if (i > 0) {
                        d.y += height * (i + calcInnerDeep(dataset[i-1][_this.config.inner]));
                    }

                    /*
                    console.debug("parentDataIndex: " + parentDataIndex + " - level: " + level + " - data index: " + i + " - data name: " + d.name);
                    console.debug(">> data x: " + d.x + " - data y: " + d.y + " - parentX: " + parentX + " - parentY: " + parentY);
                    */

                    return 'translate(' + d.x + ',' + d.y + ')';
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                .style('fill', function(d, i) {
                    return _this.config.colors(d.name);
                });

            legend.append('text')
                .attr('x', legendRectSize + legendSpacingY)
                .attr('y', legendRectSize - legendSpacingY)
                .text(function(d) {
                    var remap = _this.config.legendRemap;
                    if (remap[d.name]) {
                        return remap[d.name];
                    } else {
                        return d.name;
                    }
                });

            legendIndex++;
            level++;

            for (var j = 0; j < dataset.length; j++) {
                if (dataset[j][_this.config.inner] !== undefined) {
                    drawLegend(svg, dataset[j][_this.config.inner], level, j, dataset[j].x, dataset[j].y);
                }
            }

        };

        drawLegend(legendSvg, dataset, 0, -1);
    }

    // to contain pie cirlce
    var radius;
    if (_this.config.width > _this.config.height) {
        radius = _this.config.width / 2;
    } else {
        radius = _this.config.height / 2;
    }
    var innerRadius = _this.config.donutRadius;
    var maxDepth = _this.findMaxDepth(dataset);
    //console.log("maxDepth = " + maxDepth);
    var outerRadius = innerRadius + (radius - innerRadius) / maxDepth;
    var originalOuterRadius = outerRadius;
    var radiusDelta = outerRadius - innerRadius;
    _this.draw(svg, radius, dataset, dataset, dataset.length, innerRadius, outerRadius, radiusDelta, 0, 360 * 22 / 7 / 180, [0, 0]);
};


psd3.Pie.prototype.customArcTween = function(d) {
    var start = {
        startAngle: d.startAngle,
        endAngle: d.startAngle
    };
    var interpolate = d3.interpolate(start, d);
    return function(t) {
        return d.arc(interpolate(t));
    };
};

psd3.Pie.prototype.textTransform = function(d) {
    return "translate(" + d.arc.centroid(d) + ")";
};


psd3.Pie.prototype.draw = function(svg, totalRadius, dataset, originalDataset, originalDatasetLength, innerRadius, outerRadius, radiusDelta, startAngle, endAngle, parentCentroid) {
    var _this = this;
    //console.log("**** draw ****");
    //console.log("dataset = " + dataset);
    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return;
    }
    //console.log("parentCentroid = " + parentCentroid);
    // console.log("innerRadius = " + innerRadius);
    // console.log("outerRadius = " + outerRadius);
    // console.log("startAngle = " + startAngle);
    // console.log("endAngle = " + endAngle);

    psd3.Pie.prototype.textText = function(d) {
        return _this.config.label(d);
    };

    var pie = d3.layout.pie();
    pie.sort(null);
    pie.value(function(d) {
        //console.log("d.value = " + d.value);
        return d[_this.config.value];
    });
    pie.startAngle(startAngle)
        .endAngle(endAngle);

    //_this.pie = pie;

    //  TODO MH I dont think this does anything but log
    var values = [];
    for (var i = 0; i < dataset.length; i++) {
        values.push(dataset[i][_this.config.value]);
    }
    //console.log(values);

    var dblclick = function(d) {
       // _this.reDrawPie(d, originalDataset);
        if (d.data.drilldown) {
            _this.rootNode = d.data.nodePath;
            _this.replace(_this.config.data);
            //_this.config.heading = _this.config.heading + " ("+d.data.nodePath.join(".")+")";
            // A refresh always the current root path, store the root path in data object as string keys, must not use array indices!
            // root[] root[pay,mediaset,cinema]
            // B suspend refresh whilst drilling down mode
        } else {
            _this.rootNode = [];
            _this.replace(_this.config.data);
            //_this.config.heading
        }
    };

    var arc = d3.svg.arc().innerRadius(innerRadius)
        .outerRadius(outerRadius);
    //Set up groups
    _this.arcIndex = _this.arcIndex + 1;

    _this.arc = arc;

    var clazz = _this.config.containerId + "arc" + _this.arcIndex;

    var storeMetadataWithArc = function(d) {
        d.path = this;
        d.fill = this.fill;
        d.arc = arc;
        d.length = dataset.length;
        d.containerId = _this.config.containerId;
        d.config = _this.config;
    };

    var arcs = svg.selectAll("g." + clazz)
        .data(pie(dataset))
        .enter()
        .append("g")
        .attr("class", "arc " + clazz)
        .attr("transform",
            "translate(" + (totalRadius) + "," + (totalRadius) + ")")
        .on("dblclick", dblclick);

    //Problem with gradient is adds a gradient per arc, this means one level has same color not what we want
    var gradient = svg.append("svg:defs")
        .append("svg:linearGradient")
        .attr("id", _this.config.containerId+"_gradient_" + _this.arcIndex)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    var startColor, endColor;
    if (_this.config.gradient) {
        var index = 2 * _this.arcIndex;
        var endIndex = index + 1;
        //console.log("arcindex = " + _this.arcIndex + "(" + index + ", " + endIndex);
        startColor = _this.config.colors(index);
        endColor = _this.config.colors(endIndex);
    } else {
        startColor = endColor = _this.config.colors(this.arcIndex);
    }
    //console.log("color = " + startColor + ", " + endColor);
    gradient.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", startColor)
        .attr("stop-opacity", 0.5);

    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", endColor)
        .attr("stop-opacity", 1);

    //Draw arc paths
    var paths = arcs.append("path")
        //.attr("fill", color(_this.arcIndex));
        .attr("fill", "url(#"+_this.config.containerId+"_gradient_" + _this.arcIndex + ")")
        .style("stroke", _this.config.stroke)
        .style("stroke-width", _this.config.strokeWidth);

    paths.on("mouseover", _this.mouseover);

    paths.on("mouseout", _this.mouseout);

    paths.each(storeMetadataWithArc);

    paths.transition()
        .duration(_this.config.transitionDuration)
        .delay(_this.config.transitionDuration * (_this.arcIndex - 1))
        .ease(_this.config.transition)
        .attrTween("d", _this.customArcTween)
        // We could set the gradient id from the name here but need first each gradient defined seperately above
        // in order to control color by name we place here co.or function
        .attr("fill", function(d, i) {

            //return _this.config.colors(_this.arcIndex);
            return _this.config.colors(d.data.name);
        })
        .each(function(d) {
            this._current = d;
        });

    //paths.each(storeMetadataWithArc);
    _this.paths= paths;
    //Labels
    var texts = arcs.append("text")
        .attr("x", function() {
            return parentCentroid[0];
        })
        .attr("y", function() {
            return parentCentroid[1];
        })
        .transition()
        .ease(_this.config.transition)
        .duration(_this.config.transitionDuration)
        .delay(_this.config.transitionDuration * (_this.arcIndex - 1))
        .attr("transform", function(d) {
            var a = [];
            a[0] = arc.centroid(d)[0] - parentCentroid[0];
            a[1] = arc.centroid(d)[1] - parentCentroid[1];
            return "translate(" + a + ")";
        })
        .attr("text-anchor", "middle")
        .text(_this.textText)
        //.attr("transform", function(d, i) { return "translate(" + d.arc.centroid(d) + ")";})
        //.attr("transform", function(d, i) {return "translate(20,0) rotate(-45,0,0)";})
        .style("fill", _this.config.labelColor)
        .attr("title",
            function(d) {
                return d.data[_this.config.value];
            });



    //console.log("paths.data() = " + paths.data());
    for (var j = 0; j < dataset.length; j++) {
        //console.log("dataset[j] = " + dataset[j]);
        //console.log("paths.data()[j] = " + paths.data()[j]);
        if (dataset[j][_this.config.inner] !== undefined) {
            //Recursive call to self !!!
            _this.draw(svg, totalRadius, dataset[j][_this.config.inner], originalDataset, originalDatasetLength, innerRadius + radiusDelta, outerRadius + radiusDelta, radiusDelta, paths.data()[j].startAngle, paths.data()[j].endAngle, arc.centroid(paths.data()[j]));
        }
    }


};

psd3.Pie.prototype.reDrawPie = function(d, ds) {
    var tmp = [];
    d3.select("#" + _this.tooltipId).remove();
    d3.select("#" + _this.config.containerId + "_svg") //.remove();
        .transition()
        .ease(_this.config.drilldownTransition)
        .duration(_this.config.drilldownTransitionDuration)
        .style("height", 0)
        .remove()
        .each("end", function() {
            if (d.length == 1) {
                tmp = _this.zoomStack.pop();
            } else {
                tmp.push(d.data);
                _this.zoomStack.push(ds);
            }
            _this.drawPie(tmp);
        });
};

psd3.Pie.prototype.remove = function() {
    d3.select("#" + this.tooltipId).remove();
    d3.select("#" + this.config.containerId + "_svg").remove();
    d3.select("#" + this.config.legendId + "_svg").remove();
};

psd3.Pie.prototype.replace = function(ds) {
    this.remove();
    this.config.data = ds;
    this.drawPie(ds);
};

psd3.Pie.prototype.customArcTween2 = function(d) {
    var start = {
        startAngle: d.startAngle,
        endAngle: d.startAngle
    };
    var interpolate = d3.interpolate(start, d);
    return function(t) {
        return d.arc(interpolate(t));
    };
};


psd3.Pie.prototype.arcTweenRefresh = function (a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    var arc = this._current.arc;
    return function(t) {
        // return _this.arc(i(t));
        return arc(i(t));
    };
}

psd3.Pie.prototype.refresh = function(data) {
        this.paths.data(this.pie(data));
        this.paths.transition().duration(750).attrTween("d", _this.arcTweenRefresh);
       // this.paths.transition().duration(1).each(function(d) {
       //     this.arc = _this.arc;
       // }); // redraw the arcs

};


psd3.Pie.prototype.updatePie = function(dataset) {
    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return;
    }
    var _this = this;
    _this.arcIndex = 0;
    var svg = d3.select("#" + _this.config.containerId);

    // to contain pie cirlce
    var radius;
    if (_this.config.width > _this.config.height) {
        radius = _this.config.width / 2;
    } else {
        radius = _this.config.height / 2;
    }
    var innerRadius = _this.config.donutRadius;
    var maxDepth = _this.findMaxDepth(dataset);
    //console.log("maxDepth = " + maxDepth);
    var outerRadius = innerRadius + (radius - innerRadius) / maxDepth;
    var originalOuterRadius = outerRadius;
    var radiusDelta = outerRadius - innerRadius;
    _this.update(svg, radius, dataset, dataset, dataset.length, innerRadius, outerRadius, radiusDelta, 0, 360 * 22 / 7 / 180, [0, 0]);
};

/* psd3.Pie.prototype.calcDimensions = function() {
    //Width is most important thing so size based solely on width
    var bb = document.getElementById(this.config.containerId).getBoundingClientRect();
    var width = bb.right - bb.left;
    // height when we open the page is very small
    var height = bb.bottom - bb.top;

    var minDim = height;
    if (width < height) {
        minDim = width;
    }

    if (width > 217) {
        width = 217;
    }
    this.config.width = width;
    this.config.height = width;
};*/

psd3.Pie.prototype.resize = function() {
    //this.calcDimensions();
    this.replace(this.config.data);
}

psd3.Pie.prototype.updateConfig = function(config) {
    debugger;
    for (var property in config) {
        this.config[property] = config[property];
    }
}





