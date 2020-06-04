function WanUtil(d3, appGroupsUtil) {
    'use strict';
    var margin = {
        top: 20,
        right: 40,
        bottom: 20,
        left: 70
    };
    var width = 500 - margin.left - margin.right;
    var height = 380 - margin.top - margin.bottom;


    /*    var margin = {top: 20, right: 30, bottom: 30, left: 40};
        var width = 1100 - margin.left - margin.right;
        var height = 380 - margin.top - margin.bottom;*/
    var radius = Math.min(width, height) / 2;
    var donutWidth = 55;
    var selectCallback;

    var colorpal = d3.scale.category10();
    var legendRectSize = 12;
    var legendSpacing = 4;
    var bigAppGroup;
    var groups = [];
    var svg = d3.select('#wanutilt')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + ((width / 2) + margin.left) +
            ',' + ((height / 2) + 0) + ')');

    var arc = d3.svg.arc()
        .innerRadius(radius - donutWidth)
        .outerRadius(radius);

    var pie = d3.layout.pie()
        .value(function(d) {
            return d.bytesc;
        })
        .sort(null);

    var gnest = d3.nest()
        .key(function(d) {
            return d.groupname;
        })
        .key(function(d) {
            return d.classid;
        });

    var tooltip = d3.select('#wanutilt')
        .append('div')
        .attr('class', 'tooltippie');

    tooltip.append('div')
        .attr('class', 'label pie');

    tooltip.append('div')
        .attr('class', 'count');

    tooltip.append('div')
        .attr('class', 'percent');

    function groupData(data) {


        console.log('gData ' + JSON.stringify(data));
        var gData = [];
        data.forEach(function(d) {
            if (d.classid == 5080) {
                d.groupname = "OT";
            } else {
                d.groupname = "Internet"
            }
            //            d.groupname = appGroupsUtil.getGroupName(d.classid);
        });
        var gnestedData = gnest.entries(data);
        gnestedData.forEach(function(d) {
            var group = {
                groupname: d.key,
                bytesc: 0
            };
            var appDets = d.values;

            appDets.forEach(function(ad) {
                var appTraffic = ad.values;
                var d_bytes = appTraffic[appTraffic.length - 1].download_bytes - appTraffic[0].download_bytes;
                var u_bytes = appTraffic[appTraffic.length - 1].upload_bytes - appTraffic[0].upload_bytes;
                group.bytesc += ((d_bytes + u_bytes) * 8 / 5);
            });
            //console.log('groupname ' + d.key + ' number of entries ' + appDets.length + ' group.bytesc ' + group.bytesc);
            if (group.bytesc > 0) {
                gData.push(group);
            }

            var group1 = {
                groupname: "OT",
                bytesc: 95
            };
            var group2= {
                groupname: "Internet",
                bytesc: 55
            };

            gData.push(group1);
            gData.push(group2);


        });
        //console.log('gData ' + JSON.stringify(data));
        return gData;
    }

    var path;
    var mode = MODE_LIVE;

    WanUtil.prototype.drawChart = function(tdata, data_divisor, ucallback) {
        svg.selectAll('*').remove();
        groups = [];
        if (tdata && tdata.length > 0) {
            //console.log('got data');
            selectCallback = ucallback;
            //console.log('donut drawChart ' + JSON.stringify(tdata));

            var dataset = groupData(tdata);
            dataset.forEach(function(d) {
                d.bytesc = +d.bytesc;
                d.enabled = true;
            });

            path = svg.selectAll('path')
                .data(pie(dataset))
                .enter()
                .append('path')
                .attr('class', 'donutpath')
                .attr('d', arc)
                .attr('fill', function(d, i) {
                    groups.push(d.data.groupname);
                    var col = colorpal(d.data.groupname);
                    return col;
                })
                .each(function(d) {
                    this._current = d;
                });

            path.on('mouseover', function(d) {
                var total = d3.sum(dataset.map(function(d) {
                    return (d.enabled) ? d.bytesc : 0;
                }));
                var percent = Math.round(1000 * d.data.bytesc / total) / 10;
                tooltip.select('.label').html(d.data.groupname);
                var fmt = d3.formatPrefix(d.data.bytesc, 2);
                tooltip.select('.count').html(fmt.scale(d.data.bytesc).toFixed(2) + fmt.symbol + "B");
                tooltip.select('.percent').html(percent + '%');
                tooltip.style('display', 'block');
            });

            path.on('mouseout', function() {
                tooltip.style('display', 'none');
            });

            path.on('click', function(d) {
                //console.log('selected pie ' + JSON.stringify(d));
                // bigAppGroup = d.data.groupname;
                //selectCallback(tdata, data_divisor, d.data.groupname);
            });

            /* OPTIONAL 
             path.on('mousemove', function(d) {
             tooltip.style('top', (d3.event.pageY + 5) + 'px')
             .style('left', (d3.event.pageX + 5) + 'px');
             });
             */

            if (groups.length > 0) {
                var legend = svg.selectAll('.legend')
                    .data(groups)
                    .enter()
                    .append('g')
                    .attr('class', 'legend')
                    .attr('transform', function(d, i) {
                        var height = legendRectSize + legendSpacing;
                        var offset = height * groups.length / 2;
                        var horz = -2 * legendRectSize;
                        var vert = i * height - offset;
                        return 'translate(' + horz + ',' + vert + ')';
                    });

                legend.append('rect')
                    .attr('class', 'selectable')
                    .attr('width', legendRectSize)
                    .attr('height', legendRectSize)
                    .style('fill', colorpal)
                    .style('stroke', colorpal)
                    .on('click', function(groupname) {
                        var rect = d3.select(this);
                        var enabled = true;
                        var totalEnabled = d3.sum(dataset.map(function(d) {
                            return (d.enabled) ? 1 : 0;
                        }));

                        if (rect.attr('class') === 'disabled') {
                            rect.attr('class', '');
                        } else {
                            if (totalEnabled < 2)
                                return;
                            rect.attr('class', 'disabled');
                            enabled = false;
                        }
                        pie.value(function(d) {
                            if (d.groupname === groupname)
                                d.enabled = enabled;
                            return (d.enabled) ? d.bytesc : 0;
                        });

                        path = path.data(pie(dataset));

                        path.transition()
                            .duration(750)
                            .attrTween('d', function(d) {
                                var interpolate = d3.interpolate(this._current, d);
                                this._current = interpolate(0);
                                return function(t) {
                                    return arc(interpolate(t));
                                };
                            });
                    });

                legend.append('text')
                    .attr('x', legendRectSize + legendSpacing)
                    .attr('y', legendRectSize - legendSpacing + 2)
                    .text(function(d) {
                        var total = d3.sum(dataset.map(function(d) {
                            return (d.enabled) ? d.bytesc : 0;
                        }));

                        var dBytesc = 0;
                        dataset.some(function(dg) {
                            if (dg.groupname == d) {
                                dBytesc = dg.bytesc;
                                return true;
                            }
                        });
                        var percent = 0;
                        if (dBytesc > 0) {
                            percent = Math.round(1000 * dBytesc / total) / 10;
                            if (percent < 1) {
                                percent = "<1";
                            }
                        }

                        return d + '(' + percent + '%)';
                    }).style('cursor', 'pointer')
                    .on('click', function(groupname) {
                        //       bigAppGroup = groupname;
                        //     selectCallback(tdata, data_divisor, groupname);
                    });

            }
            if (!bigAppGroup) { // redraw only for the first time
                var maxBytes = 0;
                dataset.forEach(function(d) {
                    if (d.bytesc > maxBytes) {
                        maxBytes = d.bytesc;
                        //     bigAppGroup = d.groupname;
                    }
                });
            }
            //selectCallback(tdata, data_divisor, bigAppGroup);

        } else {
            //selectCallback(tdata, data_divisor, "");
        }
    };

    WanUtil.prototype.updateChart = function(ldata, hdata) {
        var dataset;
        if (mode == MODE_LIVE) {
            dataset = ldata;
        } else {
            dataset = hdata;
        }
        dataset = groupData(tdata);
        dataset.forEach(function(d) {
            d.bytesc = +d.bytesc;
            d.enabled = true;
        });

        pie.value(function(d) {
            return d.bytesc;
        }); // change the value function

        path = path.data(pie(dataset)); // compute the new angles
        path.transition().duration(750).attrTween("d", function(d) {
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                return arc(interpolate(t));
            };
        }); // redraw the arcs

    };

};
