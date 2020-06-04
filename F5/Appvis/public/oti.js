function ClassOT(d3, appGroupsUtil) {
    var legendRectSize = 12;
    var legendSpacing = 4;
    var divisor = LIVE_DIVISOR;

    var margin = {
            top: 20,
            right: 30,
            bottom: 30,
            left: 40
        },
        width = 560 - margin.left - margin.right,
        height = 315 - margin.top - margin.bottom;

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var color = d3.scale.category10();

    var gnest = d3.nest()
        .key(function(d) {
            return d.category;
        })
        .key(function(d) {
            return d.classid;
        });


    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(10)
        .outerTickSize(0)
        .tickPadding(10);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10)
        .tickFormat(d3.format("s"));

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) {
            return x(d.date);
        })
        .y(function(d) {
            return y(d.bytesc);
        });

    var svg = d3.select('#ot').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var tooltip = d3.select('#ot')
        .append('div')
        .attr('class', 'tooltipline');
    tooltip.append('div')
        .attr('class', 'label mline');
    tooltip.append('div')
        .attr('class', 'count');

    function getFilteredData(data, appFilterType) {

        //        console.log('Incoming Data :' + JSON.stringify(data));

        var gData = [];
        var newData = [];
        data.forEach(function(d, i) {
            newData.push(data[i]);
            //      if (d[i].classid == 5080) {
            //          console.log('new 5080 Data :' + JSON.stringify(newData[i]));
            //      }
        });

        //console.log('new Data :' + JSON.stringify(newData[0]));

        newData.forEach(function(d) {
            if (d.classid == 5080) {

                //console.log(' 5080 Data :' + JSON.stringify(d));
                d.category = "OT";

                //console.log(' 5080 Data :' + JSON.stringify(d));
            } else {
                d.category = "Internet";
            }
        });
        var gnestedData = gnest.entries(newData);

        //      console.log('gnestData ' + JSON.stringify(gnestedData));

        //      return gnestedData;
        //      var time = new Date(Date.now()*1000); 
        gnestedData.forEach(function(d) {
            //      var value = {bytesc: 0, date : time};
            var group = {
                key: d.key,
                values: []
            }
            var appDets = d.values;

            appDets.forEach(function(ad) {
                var appTraffic = ad.values;
                appTraffic.forEach(function(cd, ci) {
                    cd.bytesc = 0;
                });
            });


            appDets.forEach(function(ad) {
                var appTraffic = ad.values;
                appTraffic.forEach(function(cd, ci) {
                    if (ci > 0) {
                        var d_bytes = appTraffic[ci].download_bytes - appTraffic[ci - 1].download_bytes;
                        var u_bytes = appTraffic[ci].upload_bytes - appTraffic[ci - 1].upload_bytes;
                        cd.bytesc = ((((d_bytes > 0 ? d_bytes : 0) + (u_bytes > 0 ? u_bytes : 0)) * 8) / 5);
                        //                      if (ad.key) {
                        //                              console.log(" groupname: " + d.key + " classname :" + cd.classname + " bytesc=" + cd.bytesc);
                        //                      }
                    }
                });
                if (appTraffic.length > 1) {
                    appTraffic[0].bytesc = appTraffic[1].bytesc;
                } else {
                    appTraffic[0].bytesc = 0;
                }

            });
            //         console.log("appDets length : " + appDets.length);
            //   console.log("appDets: " + JSON.stringify(appDets));
            var temp = {};
            appDets.forEach(function(ad) {
                var appTraffic = ad.values;
                appTraffic.forEach(function(cd, ci) {
                    if (!temp[cd.update_time]) {
                        temp[cd.update_time] = cd.bytesc;
                    } else {
                        temp[cd.update_time] += cd.bytesc;
                    }

                    //  console.log('Temp[ '+cd.update_time+ "] " + cd.bytesc + " -val:" + temp[cd.update_time]);

                });
            });

            //    console.log('Temp ' + JSON.stringify(temp));
            for (var prop in temp) {
                group.values.push({
                    "date": new Date(prop * 1000),
                    "bytesc": temp[prop]
                });
            }
            //      console.log("group-length: " + group.values.length + " group - id:" + group.key);
            if (group.values.length > 0) {
                gData.push(group);
            }
        });
        //      console.log('gData ' + JSON.stringify(gData));
        return gData;

    }

    ClassOT.prototype.drawChart = function(rdata, data_divisor, selected, appFilterType) {
        divisor = data_divisor;
        svg.selectAll('*').remove();
        color.domain([]);
        var data = getFilteredData(rdata, appFilterType);
        if (!data || data.length < 1 || !data[0].values) {
            return;
        }

        x.domain(d3.extent(data[0].values, function(d) {
            return d.date;
        }));

        y.domain([
            d3.min(data, function(c) {
                return d3.min(c.values, function(v) {
                    return v.bytesc;
                });
            }),
            d3.max(data, function(c) {
                return d3.max(c.values, function(v) {
                    return v.bytesc; //v.xfer;
                });
            }) * 1.3
        ]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Bandwidth Usage (bps)");

        var apps = svg.selectAll(".app")
            .data(data)
            .enter().append("g")
            .attr("class", "app");

        apps.append("path")
            .attr("class", "otline")
            .attr("d", function(d) {
                var dl;
                try {
                    dl = line(d.values);
                } catch (err) {
                    console.log('error key ' + d.key + ' d values ' + JSON.stringify(d.values));
                }
                return dl;
            })
            .style("stroke", function(d) {
                return color(d.key);
            });

        //console.log('color.domain() ' + JSON.stringify(color.domain()) + ' data length ' + data.length);
        var legend = svg.selectAll('.legendm')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legendm')
            .attr('transform', function(d, i) {
                var row = Math.floor(i / 4) + 1;
                var col = i % 4;
                var height = legendRectSize + legendSpacing;
                var offset = height * color.domain().length / 4;
                var horz = col * 10 * legendRectSize + 20;
                var vert = row * height - offset + 10;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', color)
            .style('stroke', color);


        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing + 2)
            .text(function(d) {
                return d;
            });
        var mouseG = svg.append("g")
            .attr("class", "mouse-over-effects-ot");

        mouseG.append("path")
            .attr("class", "mouse-line-ot")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        var lines = document.getElementsByClassName('otline');

        var mousePerLine = mouseG.selectAll('.mouse-per-line-ot')
            .data(data)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line-ot");

        mousePerLine.append("circle")
            .attr("r", 3)
            .style("stroke", function(d) {
                return color(d.key);
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
            .on('mouseout', function() {
                d3.select(".mouse-line-ot")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-ot circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-ot text")
                    .style("opacity", "0");
                tooltip.select('.label').html('');
                tooltip.style('display', 'none');
            })
            .on('mouseover', function(d) {
                d3.select(".mouse-line-ot")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-ot circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-ot text")
                    .style("opacity", "1");
                tooltip.style('display', 'block');
            })
            .on('mousemove', function() {
                var mouse = d3.mouse(this);
                tooltip.select('.label').html('');
                tooltip.style('top', (d3.event.pageY - 300) + 'px')
                    .style('left', (mouse[0] - 5) + 'px');
                d3.select(".mouse-line-ot")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 25;
                        return d;
                    });
                var htmlText = '';
                var mousePoins = [];
                d3.selectAll(".mouse-per-line-ot")
                    .attr("transform", function(d, i) {
                        //console.log(width/mouse[0])
                        //console.log("lines" + )
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function(d) {
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

                        mousePoins.push({
                            classname: d.key,
                            value: y.invert(pos.y)
                        });
                        return "translate(" + mouse[0] + "," + pos.y + ")";
                    });
                mousePoins.sort(function(a, b) {
                    return d3.descending(a.value, b.value);
                });
                //                            htmlText += "<div class='row'><div class='col-lg-9'>" + mousePoins[0].xpos+ "</div></div>";
                mousePoins.forEach(function(d) {
                    var fmt = d3.formatPrefix(d.value, 2);
                    var xfrRate = fmt.scale(d.value).toFixed(1) + fmt.symbol + "bps";
                    htmlText += "<div class='row'><div class='col-lg-6'>" + d.classname + "</div><div class='col-lg-3'>" + xfrRate + "</div></div>";
                });
                tooltip.select('.label').html("<label>Bandwidth Usage</label>");
                tooltip.select('.count').html(htmlText);
            });
    };
}
