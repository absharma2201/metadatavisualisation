function ClassCPUsage(d3, appGroupsUtil) {
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
            return x(d.update_time);
        })
        .y(function(d) {
            var cpu_use = d.cpu_use;
            return y(cpu_use);
        });


    var svg = d3.select('#cput').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select('#cput')
        .append('div')
        .attr('class', 'tooltipline');
    tooltip.append('div')
        .attr('class', 'label mline');
    tooltip.append('div')
        .attr('class', 'count');

    function getFilteredData(data, appFilterType) {
        //console.log('filtered Data ' + JSON.stringify(filtedData));
	var time = Date.now();
        var json;
        var max_values = [];
        var avg_values = [];
        var avg_data = {
            key: "Avg CPU",
            values: avg_values
        };
        var max_data = {
            key: "Max CPU",
            values: max_values
        };

        data.forEach(function(d) {
//            var time = new Date(d.update_time * 1000)
            avg_values.push({
                cpu_use: d.avg_cpu,
                name: "Average",
                min_cpu: d.min_cpu,
                max_cpu: d.max_cpu,
//                update_time: time
                update_time: new Date(time),
            });
            max_values.push({
                cpu_use: d.max_cpu,
                name: "Maximum",
                min_cpu: d.min_cpu,
                max_cpu: d.max_cpu,
//                update_time: time
                update_time: new Date(time),
            });
        });

        json = [avg_data, max_data];

        return json;
    }

    ClassCPUsage.prototype.drawChart = function(rdata, data_divisor, appFilterType) {
        divisor = data_divisor;
        svg.selectAll('*').remove();
        color.domain([]);
        var data = getFilteredData(rdata, appFilterType);
        if (!data || data.length < 1) {
            return;
        }

        x.domain(d3.extent(data[0].values, function(d) {
            return d.update_time;
        }));

        y.domain([

            d3.min(data, function(c) {
                return d3.min(c.values, function(v) {
                    return v.min_cpu;
                });
            }),
            d3.max(data, function(c) {
                return d3.max(c.values, function(v) {
                    return v.max_cpu;
                });

                /*            d3.min(data, function (c) {
                                    //return parseInt(c.min_use);
                                    return 0;
                            }),
                            d3.max(data.max_cpu, function (c) {

                                    return c.cpu_use;*/
            }) * 1.3
        ]);
        //        console.log (" data domain " + data.min_use);

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
            .text("CPU Usage (in %)");

        var apps = svg.selectAll(".app")
            .data(data)
            .enter().append("g")
            .attr("class", "app");

        /*        apps.append("path")
                        .attr("class", "appline")
                        .attr("d", line)
                        .style("stroke", function (d) {
                            return color(d.key);
                        }); 
                        svg.append("path")
                                .datum(data)
                                .attr("class", "appline")
                                .attr("d", line)
                                .style("stroke", "#0000CC");*/

        apps.append("path")
            .attr("class", "cpuiline")
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
        //      color.domain(['Average CPU Use','Maximum CPU Use']);
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
            .attr("class", "mouse-over-effects-cpu");

        mouseG.append("path")
            .attr("class", "mouse-line-cpui")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        var lines = document.getElementsByClassName('cpuiline');

        var mousePerLine = mouseG.selectAll('.mouse-per-line-cpui')
            .data(data)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line-cpui");

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
                d3.select(".mouse-line-cpui")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-cpui circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-cpui text")
                    .style("opacity", "0");
                tooltip.select('.label').html('');
                tooltip.style('display', 'none');
            })
            .on('mouseover', function(d) {
                d3.select(".mouse-line-cpui")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-cpui circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-cpui text")
                    .style("opacity", "1");
                tooltip.style('display', 'block');
            })
            .on('mousemove', function() {
                var mouse = d3.mouse(this);
                tooltip.select('.label').html('');
                tooltip.style('top', (d3.event.pageY - 700) + 'px')
                    .style('left', (mouse[0] - 5) + 'px');
                d3.select(".mouse-line-cpui")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 25;
                        return d;
                    });
                var htmlText = '';
                var mousePoins = [];
                d3.selectAll(".mouse-per-line-cpui")
                    .attr("transform", function(d, i) {
                        //console.log(width/mouse[0])
                        var xDate = x.invert(mouse[0]),
                            bisect = d3.bisector(function(d) {
                                return d.update_time;
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
                        if (d.values[idx]) {
                            mousePoins.push({
                                name: d.values[idx].name,
                                value: y.invert(pos.y)
                            });
                        }
                        return "translate(" + mouse[0] + "," + pos.y + ")";
                    });
                mousePoins.sort(function(a, b) {
                    return d3.descending(a.value, b.value);
                });
                mousePoins.forEach(function(d) {
                    var fmt = d3.formatPrefix(d.value, 2);
                    var xfrRate = fmt.scale(d.value).toFixed(1) + fmt.symbol + "%";
                    htmlText += "<div class='row'><div class='col-lg-6'>" + d.name + "</div><div class='col-lg-3'>" + xfrRate + "</div></div>";
                });
                tooltip.select('.label').html("<label>C P U</label>");
                tooltip.select('.count').html(htmlText);
            });

    };
}
