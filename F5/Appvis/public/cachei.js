function ClassCacheStats(d3, appGroupsUtil) {
    var legendRectSize = 12;
    var legendSpacing = 4;
    var divisor = LIVE_DIVISOR;
    var filteredData = [];
    var cacheData = [{
        key: "OffLoad",
        values: filteredData
    }];

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
            return y(d.cache_data);
        });


    var svg = d3.select('#cachet').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select('#cachet')
        .append('div')
        .attr('class', 'tooltipline');
    tooltip.append('div')
        .attr('class', 'label mline');
    tooltip.append('div')
        .attr('class', 'count');

    function getFilteredData(data, appFilterType) {


        console.log("cache :" + JSON.stringify(data));

        var time = Date.now();

        if (filteredData && filteredData.length < 1) {
            for (var i = 59; i > (data.length - 1); i--) {

                filteredData.push({
                    cache_data: 0,
                    hits_count: 0,
                    update_time: new Date(time - i * 5000),
                    timestamp: 0
                });
            }

            data.forEach(function(d, i) {

                filteredData.push({
                    cache_data: d.hits_count, //d.hits_count - filteredData[(filteredData.length -1)].hits_count,
                    hits_count: d.hits_count,
                    update_time: new Date(time - (data.length - i - 1) * 5000),
                    timestamp: d.timestamp

                });
            });

        } else {
            if (data && data.length >= 1) {
                var time1 = filteredData[filteredData.length - 1].timestamp;
                var time2 = data[data.length - 1].timestamp;
                if (time1 == time2) {
                    filteredData.shift();
                    filteredData.push({
                        cache_data: 0, //d.hits_count,
                        hits_count: 0, //d.hits_count,
                        update_time: new Date(time), // - (data.length -i -1 )  *5000)
                        timestamp: time1 // - (data.length -i -1 )  *5000)
                    });
                } else {

                    data.forEach(function(d, i) {

                        //var bytes = d.hits_count - filteredData[(filteredData.length -1)].hits_count;
                        filteredData.shift();


                        filteredData.push({
                            cache_data: d.hits_count,
                            hits_count: d.hits_count,
                            update_time: new Date(time - (data.length - i - 1) * 5000),
                            timestamp: d.timestamp // - (data.length -i -1 )  *5000)
                        });
                    });
                }
            } else {
                var time1 = filteredData[filteredData.length - 1].timestamp;
                filteredData.shift();
                filteredData.push({
                    cache_data: 0,
                    hits_count: 0,
                    update_time: new Date(time),
                    timestamp: time1
                });
            }
        }
        //console.log("filteredData: " + JSON.stringify(filteredData));
        filteredData.sort(function(a, b) {
            var x = a.update_time < b.update_time ? -1 : 1;
            return x;

        });
        return cacheData;
    }

    ClassCacheStats.prototype.drawChart = function(rdata, data_divisor, appFilterType) {
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
                //           return 0;
                return d3.min(c.values, function(v) {
                    return v.cache_data;
                });
            }),

            d3.max(data, function(c) {

                return d3.max(c.values, function(v) {
                    return v.cache_data;
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
            .text("OffLoad (bps)");

        var apps = svg.selectAll(".app")
            .data(data)
            .enter().append("g")
            .attr("class", "app");

        apps.append("path")
            .attr("class", "cacheline")
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
        //      color.domain(['Offload']);
        var legend = svg.selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
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
            .attr("class", "mouse-over-effects-cache");

        mouseG.append("path")
            .attr("class", "mouse-line-cache")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");

        var lines = document.getElementsByClassName('cacheline');

        var mousePerLine = mouseG.selectAll('.mouse-per-line-cache')
            .data(data)
            .enter()
            .append("g")
            .attr("class", "mouse-per-line-cache");

        //console.log("cache_data: " + d.cache_data + "\n");
        mousePerLine.append("circle")
            .attr("r", 3)
            .style("stroke", function(d) {

                return color(d.key); //d.cache_data+1);
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
                d3.select(".mouse-line-cache")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-cache circle")
                    .style("opacity", "0");
                d3.selectAll(".mouse-per-line-cache text")
                    .style("opacity", "0");
                tooltip.select('.label').html('');
                tooltip.style('display', 'none');
            })
            .on('mouseover', function(d) {
                d3.select(".mouse-line-cache")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-cache circle")
                    .style("opacity", "1");
                d3.selectAll(".mouse-per-line-cache text")
                    .style("opacity", "1");
                tooltip.style('display', 'block');
            })
            .on('mousemove', function() {
                var mouse = d3.mouse(this);
                tooltip.select('.label').html('');
                tooltip.style('top', (d3.event.pageY - 700) + 'px')
                    .style('left', (mouse[0] - 5) + 'px');
                d3.select(".mouse-line-cache")
                    .attr("d", function() {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 25;
                        return d;
                    });
                var htmlText = '';
                var mousePoins = [];
                d3.selectAll(".mouse-per-line-cache")
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
                        //                                      mousePoins.push({classname:d.values[idx].classname, value:y.invert(pos.y)});
                        mousePoins.push({
                            name: "OffLoad",
                            value: y.invert(pos.y)
                        });
                        return "translate(" + mouse[0] + "," + pos.y + ")";
                    });
                // mousePoins.sort(function(a, b){return d3.descending(a.value, b.value);});
                mousePoins.forEach(function(d) {
                    var fmt = d3.formatPrefix(d.value, 2);
                    var xfrRate = fmt.scale(d.value).toFixed(1) + fmt.symbol + "bps";
                    htmlText += "<div class='row'><div class='col-lg-6'>" + d.name + "</div><div class='col-lg-3'>" + xfrRate + "</div></div>";
                });
                tooltip.select('.label').html("<label>OffLoad</label>");
                tooltip.select('.count').html(htmlText);
            });

    };
}
