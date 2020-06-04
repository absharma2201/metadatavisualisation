const INTERVAL_5MINS = 300000;
const INTERVAL_5SECS = 5000;
const INTERVAL_1SEC = 1000;
const GET_CMODE_URL = "http://{proxyhost}:{proxyport}/get_cmode";
const DPDK_URL = "http://{proxyhost}:{proxyport}/dpdk_cmode";
const NON_DPDK_URL = "http://{proxyhost}:{proxyport}/non_dpdk_cmode";
const DEFAULT_CMODE_URL = "http://{proxyhost}:{proxyport}/default_cmode";
const FIVE_SECONDS_FULL_VIEW_URL = "http://{proxyhost}:{proxyport}/apprep_stats";
const FIVE_SECONDS_CPU_VIEW_URL = "http://{proxyhost}:{proxyport}/apprep_stats";
const FIVE_SECONDS_PROC_CPU_VIEW_URL = "http://{proxyhost}:{proxyport}/apprep_stats";
const ONE_SECOND_CACHE_VIEW_URL = "http://{proxyhost}:{proxyport}/apprep_stats";
const FIVE_SECONDS_CACHE_VIEW_URL = "http://{proxyhost}:{proxyport}/apprep_stats";
const FIVE_MINS_24H_FULL_VIEW_URL = "http://{proxyhost}:{proxyport}/apprep_stats";
const DEFAULT_PROXY_PORT = "4501";
const NODEJS_PROXY_PORT = "4501";
const MODE_LIVE = "live";
const MODE_HISTORIC = "historic";
const APP_FILTER_TOP = "top";
const APP_FILTER_SELECTED = "selected";
const LIVE_DIVISOR = 5;
const HISTORIC_DIVISOR = 300;
const GROUP_MAPPINGS_URL = "tc_groups_mapping.json";

var data_5secs_5m;
var cpu_data_5secs_5m;
var cmode_val;
var proc_cpu_data_5secs_5m;
var cache_data_1sec_1m;
var cache_data_5secs_5m;
var wanutil_data_5secs_5m;
var data_5mins_24h;
var data_5mins_2d;
var charts_all = [];
var bar_chart;
var cpu_chart;
var cpu_chart2;
var proc_cpu_chart;
var cache_chart;
//var wanutil_chart;
//var wanutil_chart2;
var appsTrendGraph;
var appGroupsUtil;
var groupMappings;
var histTimeout;
var liveTimeout;
var get_cmode_url = GET_CMODE_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", NODEJS_PROXY_PORT);
var dpdk_url = DPDK_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", NODEJS_PROXY_PORT);
var non_dpdk_url = NON_DPDK_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", NODEJS_PROXY_PORT);
var default_cmode_url = DEFAULT_CMODE_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", NODEJS_PROXY_PORT);
var history_url_24h = FIVE_MINS_24H_FULL_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);
//var history_url_24h = "http://172.23.235.51:10080/apprep_stats?query_name=tc_stats_5m_last_24_hr";
var live_url = FIVE_SECONDS_FULL_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);
//var live_url = "marea_debug.json";
var cpu_url = FIVE_SECONDS_CPU_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);
var proc_cpu_url = FIVE_SECONDS_PROC_CPU_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);
var cache_url = ONE_SECOND_CACHE_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);;
//var wanutil_url = FIVE_SECONDS_FULL_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);;
//var wanutil_url2 = FIVE_SECONDS_FULL_VIEW_URL.replace("{proxyhost}", location.hostname).replace("{proxyport}", DEFAULT_PROXY_PORT);;
var newmode = MODE_LIVE;
var data_divisor = LIVE_DIVISOR;
var appFilterType = APP_FILTER_TOP;
var selectedGroup = '';
var colorpal = window.d3.scale.category10();
var cmodes = ["default", "non_dpdk", "dpdk"];



cpu_chart = new ClassCPUsage(window.d3, appGroupsUtil);
cpu_chart2 = new ClassCPUsageX(window.d3, appGroupsUtil);
proc_cpu_chart = new ClassProcCPUsage(window.d3, appGroupsUtil);
cache_chart = new ClassCacheStats(window.d3, appGroupsUtil);


function getMode() {
	console.log("get mode called");
    $.ajax({
        url: get_cmode_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "text/plain; charset=utf-8"
        },
        dataType: 'text',
        success: function (data) {
	    console.log("data type: " + typeof data);
            cmode_val = parseInt(data);
            try {

		console.log("data: " + cmode_val + "type : " + typeof cmode_val);
//		if (data == 1) {
			var val = cmodes[cmode_val-1];
			var cmode1 = document.getElementById('controlmode1');
			var cmode2 = document.getElementById('controlmode2');
			var opts = cmode1.options;
			for(var opt, j = 0; opt = opts[j]; j++) {
				if(opt.value == val) {
					cmode1.selectedIndex = j;
					cmode2.selectedIndex = j;
					break;
				}
			}
	//	}

            } catch(err) {
                    console.log('control mode execution error: ' + err);
            }
        },
        complete: function () {
            liveTimeout = setTimeout(getMode
                    , INTERVAL_5SECS);
        }

    });
}

function procCpuDataFetch() {
    $.ajax({
        url: proc_cpu_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            proc_cpu_data_5secs_5m = data;
            try {
                if (newmode = MODE_LIVE) {
                    proc_cpu_chart.drawChart(data, data_divisor, appFilterType);
                }
            } catch(err) {
                console.log('periodic updateLiveCharts error ' + err);
            }
        },
        complete: function () {
            liveTimeout = setTimeout(procCpuDataFetch
                    , INTERVAL_5SECS);
        }

    });
}

function cpuDataFetch() {
    $.ajax({
        url: cpu_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            cpu_data_5secs_5m = data;
            try {
                if (newmode = MODE_LIVE) {
                    cpu_chart2.drawChart(data, data_divisor, appFilterType);
                    cpu_chart.drawChart(data, data_divisor, appFilterType);
                }
            } catch(err) {
                console.log('periodic updateLiveCharts error ' + err);
            }
        },
        complete: function () {
            liveTimeout = setTimeout(cpuDataFetch
                    , INTERVAL_5SECS);
        }

    });
}

function cacheDataFetch() {
    $.ajax({
        url: cache_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            cache_data_5secs_5m = data;
            try {
                if (newmode = MODE_LIVE) {
                    cache_chart.drawChart(data, data_divisor, appFilterType);
                }
            } catch(err) {
                console.log('periodic updateLiveCharts error ' + err);
            }
        },
        complete: function () {
            liveTimeout = setTimeout(cacheDataFetch
                    , INTERVAL_5SECS);
        }

    });
}


/*function wanUtilCallback(data1, data2, data_divisor, selected) {
    topGroup = selected;
    //console.log('bar data ' + selected);
    if (wanutil_chart) {
        wanutil_chart.drawChart(data1, data2, data_divisor, selected, appFilterType);
         
    }
}

function wanUtilDataFetch() {
    $.ajax({
        url: wanutil_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            wanutil_data_5secs_5m = data;
//console.log('data at 1st fetch:' + wanutil_data_5secs_5m);
    $.ajax({
        url: wanutil_url2,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            wanutil2_data_5secs_5m = data;

//console.log('data at 2nd fetch:' + wanutil2_data_5secs_5m);
            try {
                if (newmode = MODE_LIVE) {
                    wanutil_chart.drawChart(wanutil_data_5secs_5m, wanutil2_data_5secs_5m, data_divisor, wanUtilCallback)
                }
            } catch(err) {
                console.log('periodic updateLiveCharts error ' + err);
            }
        },
        complete: function () {
            liveTimeout = setTimeout(wanUtilDataFetch
                    , INTERVAL_5SECS);
        }
});
}
    });
}*/

function drawCharts(data, data_divisor) {
    charts_all.forEach(function (d) {
        try {
            d.drawChart(data, data_divisor, barChartRedrawCallback);
        } catch(err) {
            console.log('drawCharts error ' + err.stack);
        }
    });
}

Array.prototype.remove = Array.prototype.remove || function (val) {
    var i = this.length;
    while (i--) {
        if (this[i] === val) {
            this.splice(i, 1);
        }
    }
};

function barChartRedrawCallback(data, data_divisor, selected) {
    topGroup = selected;
    console.log('bar data ' + selected);
    if (bar_chart) {
        bar_chart.drawChart(data, data_divisor, selected, appFilterType);
        if (selected) {
            $(".selectedgrp").text(" Top 10 " + selected);
        } else {
            $(".selectedgrp").text(" Top 10 Selected");
        }
        if ($(".appcons").prop("disabled")) {
            //console.log("making radio enabled");
            $(".appcons").prop( "disabled", false );
        }
        
    }
  
    if (appsTrendGraph) {
        appsTrendGraph.drawChart(data, data_divisor, selected, appFilterType);
        if (selected) {
            if (appFilterType == APP_FILTER_SELECTED) {
                $("#mlinetop").html("&nbsp;Top 10 " + selected);
            } else {
                $("#mlinetop").html("&nbsp;Top 10 Applications");
            }
        } else {
            $("#mlinetop").html("&nbsp;Top 10 Applications");
        }
    }
}

//Get 5 mins historical data periodically
function histPeriodicDataFetch(url_to_get, data_to_store) {
    $.ajax({
        url: url_to_get,
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            data_to_store = data;
        },
        complete: function () {
            //asynStatReq();
            histTimeout = setTimeout(function(){
                histPeriodicDataFetch(url_to_get, data_to_store);}
                    , INTERVAL_5MINS);
        }

    });
}

//Get the last 1 minute data aggregated by 5 secs
function livePeriodicDataFetch() {
    $.ajax({
        url: live_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            data_5secs_5m = data;
            try {
                if (newmode = MODE_LIVE) {
                    drawCharts(data, data_divisor);
                }
            } catch(err) {
                console.log('periodic updateLiveCharts error ' + err);
            }
        },
        complete: function () {
            liveTimeout = setTimeout(livePeriodicDataFetch
                    , INTERVAL_5SECS);
        }

    });
}


function noTimeout() {
    if (histTimeout) {
        clearTimeout(histTimeout);
    }

    if (liveTimeout) {
        clearTimeout(liveTimeout);
    }
}

d3.json(GROUP_MAPPINGS_URL, function (error, gmdata) {
    if (error) {
        throw error;
    }
    appGroupsUtil = new AppGroupUtil(gmdata);
    var stAreaGraph = new StackedArea(window.d3, appGroupsUtil);
    var dnutGraph = new Donut(window.d3, appGroupsUtil);
    var wanutilGraph = new WanUtil(window.d3, appGroupsUtil);
    var otGraph = new ClassOT(window.d3, appGroupsUtil);
    appsTrendGraph = new ClassTrend(window.d3, appGroupsUtil);
    bar_chart = new ClassBarChart(window.d3, appGroupsUtil);
    charts_all.push(stAreaGraph);
//    charts_all.push(cpu_chart);
    charts_all.push(dnutGraph);
    charts_all.push(wanutilGraph);
    charts_all.push(otGraph);

    //charts_all.push(appsTrendGraph);
    
    //Get the 24 hours data 
    $.ajax({
        url: history_url_24h,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_new.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            data_5mins_24h = data;
        },
        complete: function () {
            //asynStatReq();
            histTimeout = setTimeout(function(){
                histPeriodicDataFetch(history_url_24h, data_5mins_24h);}
                    , INTERVAL_5MINS);
        }

    });

    //Get the last hour data aggregated by 5 secs
    $.ajax({
        url: live_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_debug.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
            try {
                data_5secs_5m = data;
                drawCharts(data, data_divisor);
            } catch(err) {
                console.log('drawLiveCharts error ' + err.stack);
                console.log('data ' + JSON.stringify(data));
            }
        },
        complete: function () {
            liveTimeout = setTimeout(livePeriodicDataFetch
                    , INTERVAL_5SECS);
        }

    });

    //Get the last hour Process-wise CPU usage data aggregated by 5 secs
    $.ajax({
        url: proc_cpu_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_debug.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
                proc_cpu_data_5secs_5m = data;
        },
        complete: function () {
            liveTimeout = setTimeout(function(){
                procCpuDataFetch(proc_cpu_url, proc_cpu_data_5secs_5m);}
                    , INTERVAL_5SECS);
        }

    });

    //Get the last hour CPU usage data aggregated by 5 secs
    $.ajax({
        url: cpu_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_debug.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
                cpu_data_5secs_5m = data;
        },
        complete: function () {
            liveTimeout = setTimeout(function(){
                cpuDataFetch(cpu_url, cpu_data_5secs_5m);}
                    , INTERVAL_5SECS);
        }

    });

    //Get the last hour Cache data aggregated by 5 secs
    $.ajax({
        url: cache_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_debug.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
                cache_data_5secs_5m = data;
        },
        complete: function () {
            liveTimeout = setTimeout(function(){
                cacheDataFetch(cache_url, cache_data_5secs_5m);}
                    , INTERVAL_5SECS);
        }

    });
/*
    //Get the last hour Cache data aggregated by 5 secs
    $.ajax({
        url: wanutil_url,
        //url: '/' + window.location.pathname.split('/')[1] + '/marea_debug.json',
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        dataType: 'json',
        success: function (data) {
                wanutil_data_5secs_5m = data;
        },
        complete: function () {
            liveTimeout = setTimeout(function(){
                wanUtilDataFetch(wanutil_url, wanutil_data_5secs_5m);}
                    , INTERVAL_5SECS);
        }

    });*/

});

window.unload = noTimeout;

$(".appcons").on('change', function() {
    appFilterType = this.value;
    //console.log('appFilterType ' + appFilterType);
    if (newmode == MODE_LIVE) {
        barChartRedrawCallback(data_5secs_5m, data_divisor, topGroup);
    } else {
        barChartRedrawCallback(data_5mins_24h, data_divisor, topGroup);
    }
});

$("#controlmode1").on('change', function (){
    var cmode = this.value;
    console.log('controlmode: ' + cmode);
    if (cmode == "dpdk") {
        $.ajax({
            url: dpdk_url,
            headers: {
                Accept: "text/plain; charset=utf-8"
            },
            dataType: 'text',
            success: function (data) {
                try {
                    console.log('control mode execution response: ' + data);
                } catch(err) {
                    console.log('control mode execution error: ' + err);
                }
            }
        });
    } else if (cmode == "non_dpdk") {
        $.ajax({
            url: non_dpdk_url,
            headers: {
                Accept: "text/plain; charset=utf-8"
            },
            dataType: 'text',
            success: function (data) {
                try {
                    console.log('control mode execution response: ' + data);
                } catch(err) {
                    console.log('control mode execution error: ' + err);
                }
            }
        });
    } else if (cmode == "default") {
        $.ajax({
            url: default_cmode_url,
            headers: {
                Accept: "text/plain; charset=utf-8"
            },
            dataType: 'text',
            success: function (data) {
                try {
                    console.log('control mode execution response: ' + data);
                } catch(err) {
                    console.log('control mode execution error: ' + err);
                }
            }
        });
    }
});


$("#controlmode2").on('change', function (){
    var cmode = this.value;
    console.log('controlmode: ' + cmode);
    if (cmode == "dpdk") {
        $.ajax({
            url: dpdk_url,
            headers: {
                Accept: "text/plain; charset=utf-8"
            },
            dataType: 'text',
            success: function (data) {
                try {
                    console.log('control mode execution response: ' + data);
                } catch(err) {
                    console.log('control mode execution error: ' + err);
                }
            }
        });
    } else if (cmode == "non_dpdk") {
        $.ajax({
            url: non_dpdk_url,
            headers: {
                Accept: "text/plain; charset=utf-8"
            },
            dataType: 'text',
            success: function (data) {
                try {
                    console.log('control mode execution response: ' + data);
                } catch(err) {
                    console.log('control mode execution error: ' + err);
                }
            }
        });
    } else if (cmode == "default") {
        $.ajax({
            url: default_cmode_url,
            headers: {
                Accept: "text/plain; charset=utf-8"
            },
            dataType: 'text',
            success: function (data) {
                try {
                    console.log('control mode execution response: ' + data);
                } catch(err) {
                    console.log('control mode execution error: ' + err);
                }
            }
        });
    }
});



$("#datalength").on('change', function (){
    var dlength = this.value;
    //console.log('dlength ' + dlength);
    if (dlength.includes(MODE_LIVE)) {
        newmode = MODE_LIVE;
        data_divisor = LIVE_DIVISOR;
        if (liveTimeout) {
            clearTimeout(liveTimeout);
        }
        $.ajax({
            url: live_url,
            headers: {
                Accept: "application/json; charset=utf-8"
            },
            dataType: 'json',
            success: function (data) {
                try {
                    drawCharts(data, data_divisor);
                } catch(err) {
                    console.log('datalength drawHistCharts error ' + err);
                }
            },
            complete: function () {
                liveTimeout = setTimeout(livePeriodicDataFetch
                    , INTERVAL_5SECS);
            }

        });
    } else {
        newmode = MODE_HISTORIC;
        data_divisor = HISTORIC_DIVISOR;
        if (liveTimeout) {
            clearTimeout(liveTimeout);
        }
        if (dlength.includes("2d")) {
            try {
                drawCharts(data_5mins_2d, data_divisor);
            } catch(err) {
                console.log('datalength drawHistCharts - 2d error ' + err);
            }
        } else {
            try {
                drawCharts(data_5mins_24h, data_divisor);
            } catch(err) {
                console.log('datalength drawHistCharts - 24hr error ' + err);
            }
        }
    }
    
});
