function StackedArea(d3, appGroupsUtil) {
    var legendRectSize = 12;
    var legendSpacing = 4;
    var divisor = LIVE_DIVISOR;

    var areaMargin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 560 - areaMargin.left - areaMargin.right,
            height = 315 - areaMargin.top - areaMargin.bottom;
    var areax = d3.time.scale()
            .range([0, width]);

    var y = d3.scale.linear()
            .range([height, 0]);

    //var z = d3.scale.category10();
    var grpNames = [];

    var areaxAxis = d3.svg.axis()
            .scale(areax)
            .orient("bottom")
            .ticks(10)
            .outerTickSize(0)
            .tickPadding(10);

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10)
            .tickFormat(d3.format("s"));

    var stackarea = d3.layout.stack()
            .offset("zero")
            .values(function (d) {
                //console.log('d.values ' + JSON.stringify(d.values));
                return d.values;
            })
            .x(function (d) {
                return d.date;
            })
            .y(function (d) {
                return d.value;
            });

    var nest = d3.nest()
            .key(function (d) {
                return d.groupname;
            });
    var gnest = d3.nest()
            .key(function (d) {
                return d.groupname;
            })
            .key(function (d) {
                return d.classid;
            });


    var area = d3.svg.area()
            .interpolate("basis")
            .x(function (d) {
                return areax(d.date);
            })
            .y0(function (d) {
                return y(d.y0);
            })
            .y1(function (d) {
                return y(d.y0 + d.y);
            });

    var svgarea = d3.select("#stacareat").append("svg")
            .attr("width", width + areaMargin.left + areaMargin.right)
            .attr("height", height + areaMargin.top + areaMargin.bottom)
            .append("g")
            .attr("transform", "translate(" + areaMargin.left + "," + areaMargin.top + ")");
    var tooltip = d3.select('#stacareat')
            .append('div')
            .attr('class', 'tooltipstarea');
    tooltip.append('div')
            .attr('class', 'label starea');
    tooltip.append('div')
            .attr('class', 'count');

    function getGroupedData(rawData) {
        //console.log('rawdata ' + JSON.stringify(rawData));
        rawData.forEach(function (d) {
            d.groupname = appGroupsUtil.getGroupName(d.classid);
            d.date = new Date(d.update_time * 1000);
            d.download_bytes = +d.download_bytes;
            d.upload_bytes = +d.upload_bytes;
        });

        var nestedData = gnest.entries(rawData);
        //console.log('nestedData ' + JSON.stringify(nestedData));
        var groupEntries = [];

        function getGroupEntry(update_time, groupname) {
            var groupEntry;
            groupEntries.some(function (d) {
                if (d.update_time == update_time && d.groupname == groupname) {
                    groupEntry = d;
                    return true;
                }
            });

            return groupEntry;
        }

        nestedData.forEach(function (d) {

            var vals = d.values;
            //var i = 0;

            vals.forEach(function (d1, j) {
                var classEntries = d1.values;
                var groupEntry;
                classEntries.forEach(function (d2, i) {

                    //console.log('classEntry ' + JSON.stringify(d2));
                    var newValue;
                    if (i != 0) {
                        newValue = (d2.download_bytes - classEntries[i - 1].download_bytes + d2.upload_bytes - classEntries[i - 1].upload_bytes) * 8 / divisor;
                        if (newValue < 0) {
                            newValue = -1 * newValue;
                        }
                    } else {
                        newValue = 0;
                    }

                    if (j === 0) {
                        groupEntry = {groupname: d.key, date: d2.date, value: newValue, update_time: d2.update_time};
                        groupEntries.push(groupEntry);
                    } else {
                        groupEntry = getGroupEntry(d2.update_time, d.key);
                        if (typeof groupEntry == 'undefined') {
                            ('j value ' + j + 'group.values ' + JSON.stringify(groupEntries));
                        } else {
                            groupEntry.value += newValue;
                        }
                    }
                });
            });
        });
        //console.log('groupedEntries ' + JSON.stringify(groupEntries));
        return groupEntries;
    }

    Array.prototype.remove = Array.prototype.remove || function (val) {
        var i = this.length;
        while (i--) {
            if (this[i] === val) {
                this.splice(i, 1);
            }
        }
    };

    function getNestedData(rawData) {
        var nstedData = nest.entries(rawData);
        var maxDataPoints = 0;
        var correctDataset;
        var filtdData = nstedData.filter(function(d){
            var gValues = d.values;
            var maxVal = d3.max(gValues, function (d) {
                return d.value;
            });
            if (maxVal > 0) {
                var valLength = gValues.length;
                //console.log('adding grp ' + d.key + ' value ' + maxVal + ' number of alues ' + valLength);
                if (valLength > 1) {
                    gValues[0].value = gValues[1].value;
                }
                if (valLength > maxDataPoints) {
                    correctDataset = gValues;
                    maxDataPoints = valLength;
                }
                return true;
            } else {
                return false;
            }
        });
        
        filtdData.forEach(function(d){
            var grpDps = d.values;
            var wdl = grpDps.length;
            if (wdl < maxDataPoints) {
                //console.log('Data points missing in group ' + d.key + ' length ' +  wdl);
                correctDataset.forEach(function (d1, i) {
                    if (wdl > i) {
                        var wdp = grpDps[i];
                        if (wdp.update_time != d1.update_time) { //insert new data
                            var cdp = {groupname: d.key, date: d1.date, value: 0, update_time: d1.update_time};
                            grpDps.splice(i, 0, cdp);
                        }
                    } else {
                        //no dp exists, add new
                        var cdp = {groupname: d.key, date: d1.date, value: 0, update_time: d1.update_time};
                        grpDps.push(cdp);
                    }
                    
                });
                
                //console.log('Data points corrected in group ' + d.key + ' length ' +  grpDps.length);
            }
        });
//        nstedData.forEach(function (d, i, arr) {
//            var gValues = d.values;
//            var maxVal = d3.max(gValues, function (d) {
//                return d.value;
//            });
//            console.log('maxVal ' + maxVal + ' appgroup ' + d.key);
//            if (maxVal <= 1000) {
//                arr.remove(d);
//            } else {
//                if (gValues.length > 1) {
//                    gValues[0].value = gValues[1].value;
//                }
//            }
//
//        });
        return filtdData;
    }

    function getLayeredData(nData) {
        var layers;
        try {
            layers = stackarea(nData);
        } catch (err) {
            //console.log('error data ' + JSON.stringify(nData));
        }
        return layers;
    }

    StackedArea.prototype.drawChart = function (rdata, data_divisor, callback) {
        svgarea.selectAll('*').remove();
        grpNames = [];
        if (data_divisor) {
            divisor = data_divisor;
            //console.log('data divisor ' + data_divisor);
        }

        //console.log('data ' + JSON.stringify(rdata));
        if (!rdata || rdata.length === 0) {
            return;
        }
        var data = getGroupedData(rdata);
        var ndata = getNestedData(data);
        var layers = getLayeredData(ndata);

        if (data && data.length > 0) {
            //console.log('layered data ' + JSON.stringify(data));
            areax.domain(d3.extent(data, function (d) {
                return d.date;
            }));

            y.domain([0, d3.max(data, function (d) {
                    return d.y0 + d.y;
                }) * 1.3]);

            var apps = svgarea.selectAll(".layer")
                    .data(layers)
                    .enter().append("g")
                    .attr("class", "browser");

            apps.append("path")
                    .attr("class", "layer")
                    .attr("d", function (d) {
                        //console.log('area data ' + JSON.stringify(d));
                        return area(d.values);
                    })
                    .style("fill", function (d, i) {
                        grpNames.push(d.key);
                        return colorpal(d.key);
                    });

            svgarea.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(areaxAxis);

            svgarea.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Bandwidth Usage (bps)");

            var legend = svgarea.selectAll('.legend')
                    .data(grpNames)
                    .enter()
                    .append('g')
                    .attr('class', 'legend')
                    .attr('transform', function (d, i) {
                        var row = Math.floor(i / 4) + 1;
                        var col = i % 4;
                        var height = legendRectSize + legendSpacing;
                        var offset = height * grpNames.length / 4;
                        var horz = col * 10 * legendRectSize + 20;
                        var vert = row * height - offset + 10;
                        return 'translate(' + horz + ',' + vert + ')';
                    });

            legend.append('rect')
                    .attr('width', legendRectSize)
                    .attr('height', legendRectSize)
                    .style('fill', colorpal)
                    .style('stroke', colorpal);


            legend.append('text')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing + 2)
                    .text(function (d) {
                        return d;
                    });
                    
        var mouseG = svgarea.append("g")
                .attr("class", "mouse-over-effects");

        mouseG.append("path") 
                .attr("class", "mouse-starea")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("opacity", "0");

        var lines = document.getElementsByClassName('layer');

        var mousePerLine = mouseG.selectAll('.mouse-per-starea')
                .data(layers)
                .enter()
                .append("g")
                .attr("class", "mouse-per-starea");

        mousePerLine.append("circle")
                .attr("r", 3)
                .style("stroke", function (d) {
                    return colorpal(d.key);
                })
                .style("fill", "none")
                .style("stroke-width", "1px")
                .style("opacity", "0");

        mousePerLine.append("text")
                .attr("transform", "translate(10,3)");

        mouseG.append('svg:rect') 
                .attr('width', width) 
                .attr('height', height)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on('mouseout', function () { 
                    d3.select(".mouse-starea")
                            .style("opacity", "0");
                    d3.selectAll(".mouse-per-starea circle")
                            .style("opacity", "0");
                    d3.selectAll(".mouse-per-starea text")
                            .style("opacity", "0");
                    tooltip.select('.label').html('');
                    tooltip.style('display', 'none');
                })
                .on('mouseover', function (d) { 
                    d3.select(".mouse-starea")
                            .style("opacity", "1");
                    d3.selectAll(".mouse-per-starea circle")
                            .style("opacity", "1");
                    d3.selectAll(".mouse-per-starea text")
                            .style("opacity", "1");
                    tooltip.style('display', 'block');
                })
                .on('mousemove', function () { 
                    var mouse = d3.mouse(this);
                    
                    tooltip.select('.label').html('');
                    tooltip.style('top', (d3.event.pageY - 700) + 'px')
                            .style('left', (mouse[0] - 5) + 'px');
                    d3.select(".mouse-starea")
                            .attr("d", function () {
                                var d = "M" + mouse[0] + "," + height;
                                d += " " + mouse[0] + "," + 25;
                                return d;
                            });
                            var htmlText = '';
                            var mousePoins = [];
                    d3.selectAll(".mouse-per-starea")
                            .attr("transform", function (d, i) {
                                //console.log(width/mouse[0])
                                var xDate = areax.invert(mouse[0]),
                                        bisect = d3.bisector(function (d) {
                                            return d.date;
                                        }).right,
                                        idx = bisect(d.values, xDate);

                                var beginning = 0,
                                        end = lines[i].getTotalLength(),
                                        target = null;

                                while (true) {
                                    target = Math.floor((beginning + end) / 2);
                                    pos = lines[i].getPointAtLength(target);
                                    if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                        break;
                                    }
                                    if (pos.x > mouse[0])
                                        end = target;
                                    else if (pos.x < mouse[0])
                                        beginning = target;
                                    else
                                        break; 
                                }
                                
                                mousePoins.push({groupname:d.values[idx].groupname, value:y.invert(pos.y)});
                                return "translate(" + mouse[0] + "," + pos.y + ")";
                            });
                            mousePoins.sort(function(a, b){return d3.descending(a.value, b.value);});
                            mousePoins.forEach(function(d){
                                var fmt = d3.formatPrefix(d.value, 2);
                                var xfrRate = fmt.scale(d.value).toFixed(1) + fmt.symbol + "bps";
                                htmlText += "<div class='row'><div class='col-lg-6'>" + d.groupname + "</div><div class='col-lg-3'>" + xfrRate + "</div></div>";
                            });
                            tooltip.select('.label').html("<label>Bandwidth Usage</label>");
                            tooltip.select('.count').html(htmlText);
                });
        }


    };

//    StackedArea.prototype.updateChart = function (ldata, hdata, newmode) {
//        var layers;
//        var rdata;
//        
//        if (newmode == MODE_HISTORIC) {
//            mode = MODE_HISTORIC;
//            divisor = HISTORIC_DIVISOR;
//            rdata = hdata;
//        } else {
//            mode = MODE_LIVE;
//            rdata = ldata;
//            divisor = LIVE_DIVISOR;
//        }
//        var data = getGroupedData(rdata);
//        var ndata = getNestedData(data);
//        var layers = getLayeredData(ndata);
//        //console.log(' data ' + JSON.stringify(data));
//        areax.domain(d3.extent(data, function (d) {
//            return d.date;
//        }));
//
//        y.domain([0, d3.max(data, function (d) {
//                return d.y0 + d.y;
//            }) * 1.3]);
//        svgarea.selectAll(".layer")
//                .data(layers)
//                .attr("d", function (d) {
//                    return area(d.values);
//                });
//    };
}

