function Slider(d3) {
    var margin = {top: 10, right: 28, bottom: 20, left: 28},
    width = 1000 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;
    var ndsDate = d3.time.format(NDS_DATE_FORMAT.NDS_GRAPH_PREFERRED).parse;
//                    var parseDate = d3.time.format("%H:%M:%S-%Z").parse;
//                    var tzOff = Util.getCurrentTZOffset();
    var x = d3.scale.linear()
            .range([0, width]);
//                    var defaultDomain = Util.getCurrentDayStartAndEnd();
    var x = d3.time.scale()
            .range([0, width]);
    //.domain([ndsDate(defaultDomain[0]), ndsDate(defaultDomain[1])]);

    var xAxis = d3.svg.axis().scale(x)
            .orient("bottom")
            .ticks(15);

    var arc = d3.svg.arc()
            .outerRadius(height / 2)
            .startAngle(0)
            .endAngle(function (d, i) {
                return i ? -Math.PI : Math.PI;
            });

    var svg = d3.select("#slider").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    Slider.prototype.drawChart = function(newData, data_divisor, callback) {
        
        if (newData) {
            svg.selectAll('*').remove();
            var da = d3.tsv.parse(da);
            //$log.log('parsed da Day ' + JSON.stringify(da));
//                            x.domain(da.map(function (d) {
//                                return ndsDate(d.Timestamp);
//                            }));
            //$log.log('x domain ' + x.domain());
            x.domain([ndsDate(da[0].Timestamp), ndsDate(da[da.length - 1].Timestamp)]);
            var xdomain = x.domain();
            var brush = d3.svg.brush()
                    .x(x)
                    .extent(xdomain)
                    .on("brushstart", brushstart)
                    //.on("brush", brushmove)
                    .on("brushend", brushend);
            //brush.extent([xdomain[0], xdomain[xdomain.length - 1]]);
//                            brush(d3.select(".brushGlobal").transition());
            //brush.event(d3.select(".brushGlobal").transition().delay(1000));
            $log.log('brush.extent ' + brush.extent());
            svg.append("g")
                    .attr("class", "x gbaxis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                    .append("text")
                    .attr("x", width - 6)
                    .attr("dy", "-.71em")
                    .style("text-anchor", "end")
                    .text("Time of Recording");

            var brushg = svg.append("g")
                    .attr("class", "brushGlobal")
                    .call(brush);

            brushg.selectAll(".resize").append("path")
                    .attr("transform", "translate(0," + height / 2 + ")")
                    .attr("d", arc);

            brushg.selectAll("rect")
                    .attr("height", height);

            brushstart();
            //brushmove();
            var startExtent = null;
            function brushstart() {
                startExtent = brush.extent();
                svg.classed("selecting", true);
            }

//                            function brushmove() {
//                                var s = brush.extent();
//                                //circle.classed("selected", function(d) { return s[0] <= d && d <= s[1]; });
//                            }

            function brushend() {
                svg.classed("selecting", !d3.event.target.empty());
                var s = brush.extent();
                //console.log("Brush Extend " + JSON.stringify(s));
                if (startExtent && (Util.getMinutes(s[1]) - Util.getMinutes(s[0])) < 30) {
                    s = startExtent;
                    brush.extent(s);
                    brush(d3.select(".brushGlobal").transition());
                    brush.event(d3.select(".brushGlobal").transition().delay(1000));
                }
                scope.brushing({$ext: s});
                //attrs.globalExtent = s;
            }
            scope.globalExtent = brush.extent();
            //scope.brushing({$ext: brush.extent()});
        });
    };
}