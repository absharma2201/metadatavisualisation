function ClassBarChart(d3, appGroupsUtil) {
    var margin = {
            top: 20,
            right: 20,
            bottom: 80,
            left: 40
        },
        width = 560 - margin.left - margin.right,
        height = 360 - margin.top - margin.bottom;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .3);
    var vertTextPadding = 10;

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10)
        .tickFormat(d3.format("s"));

    var svg = d3.select('#barc').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var gnest = d3.nest()
        .key(function(d) {
            return d.groupname;
        })
        .key(function(d) {
            return d.classname;
        });

    var cnest = d3.nest()
        .key(function(d) {
            return d.classname;
        });

    function getGroupedData(rawdata, selected, barType) {
        rawdata.forEach(function(d) {
            d.groupname = appGroupsUtil.getGroupName(d.classid);
            d.classname = appGroupsUtil.getClassName(d.classid);
        });

        var selectedData;
        if (barType == APP_FILTER_TOP) {
            selectedData = cnest.entries(rawdata);
        } else {
            var gnestedData = gnest.entries(rawdata);
            gnestedData.some(function(d) {
                if (d.key == selected) {
                    selectedData = d.values;
                    return true;
                }
            });
        }
        //console.log('selected data ' + JSON.stringify(selectedData));
        var reducedData = [];
        if (selectedData) {
            selectedData.forEach(function(d) {
                var reducedEntry = {
                    classname: d.key,
                    bytesc: 0,
                    groupname: null
                };
                var vals = d.values;
                var d_bytes = vals[vals.length - 1].download_bytes - vals[0].download_bytes;
                var u_bytes = vals[vals.length - 1].upload_bytes - vals[0].upload_bytes;
                var value = d_bytes + u_bytes;
                if (value > 0) {
                    reducedEntry.bytesc = value;
                    reducedEntry.groupname = vals[0].groupname;
                    reducedData.push(reducedEntry);
                }
            });
        }

        reducedData.sort(function(a, b) {
            return d3.descending(a.bytesc, b.bytesc);
        });

        if (reducedData.length > 10) {
            reducedData = reducedData.splice(0, 10);
        }

        //console.log('reducedData ' + JSON.stringify(reducedData));
        return reducedData;
    }

    ClassBarChart.prototype.drawChart = function(rdata, data_divisor, selected, barType) {
        svg.selectAll('*').remove();
        var data = getGroupedData(rdata, selected, barType);

        if (data && data.length > 0 && selected.length > 0) {

            x.domain(data.map(function(d) {
                return d.classname;
            }));
            y.domain([0, d3.max(data, function(d) {
                return d.bytesc;
            }) * 1.3]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("y", 9)
                .attr("x", 0)
                .attr("dy", ".71em")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end")
                .style("font-weight", "bold");
            //.style("font-size", "11px");
            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Data Consumption (Bytes)");

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) {
                    return x(d.classname);
                })
                .attr("width", x.rangeBand())
                .attr("y", function(d) {
                    return y(d.bytesc);
                })
                .attr("height", function(d) {
                    return height - y(d.bytesc);
                }).style("fill", function(d) {
                    return colorpal(d.groupname);
                });

            svg.selectAll(".texttip")
                .data(data)
                .enter()
                .append("text")
                .text(function(d) {
                    var fmt = d3.formatPrefix(d.bytesc, 2);
                    var usage = fmt.scale(d.bytesc).toFixed(1) + fmt.symbol;
                    return usage;
                })
                .attr("x", function(d, i) {
                    return x(d.classname) + x.rangeBand() / 2;
                })
                .attr("y", function(d) {
                    return y(d.bytesc) - vertTextPadding;
                })
                .attr("font-size", "8px")
                .attr("fill", "grey")
                .attr("text-anchor", "middle");
        }

    };
}
