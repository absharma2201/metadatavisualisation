require ('shelljs/global');

var express = require('express');
var fs = require('fs');
var app = express();
'use strict';



app.get('*', function (req, res) {
        console.log("Got a GET request for the homepage");
	var str;
	if (req.url == '/dpdk_cmode') {
   		res.send('Hello DPDK');
		//fs.writeFileSync('/a/etc/scripts/run_mode', 'DPDK', 'utf8');
		fs.writeFileSync('/a/etc/scripts/run_mode', 3, 'utf8');
	} else if (req.url == '/non_dpdk_cmode') {
   		res.send('Hello NON DPDK');
		//fs.writeFileSync('/a/etc/scripts/run_mode', 'NON DPDK', 'utf8');
		fs.writeFileSync('/a/etc/scripts/run_mode', 2, 'utf8');
	} else if (req.url == '/default_cmode') {
   		res.send('Hello DEFAULT');
		//fs.writeFileSync('/a/etc/scripts/run_mode', 'Default', 'utf8');
		fs.writeFileSync('/a/etc/scripts/run_mode', 1, 'utf8');
	}else {
		console.log("Got a request for "+ req.url);
		var gData = [];
		var time = Date.now();
                gData.push({
                    cache_data: 110,
                    hits_count: 1230,
                    update_time: new Date(time -  5000),
                    timestamp: 0
                });


		
		let rawdata = fs.readFileSync('data.json');  
		let output = JSON.parse(rawdata);  
		gData.push(output);
		//console.log(student);  

		res.json(gData);
	}


	str = cat('/a/etc/scripts/run_mode');
	console.log("string written " + str.toString());

})

// This responds a POST request for the homepage
app.post('/', function (req, res) {
   console.log("Got a POST request for the homepage");
   res.send('Hello POST');
})

// This responds a DELETE request for the /del_user page.
app.delete('/del', function (req, res) {
   console.log("Got a DELETE request for /del_user");
   res.send('Hello DELETE');
})

var server = app.listen(4501, '172.16.242.91');

console.log("Example app listening at http://172.16.242.91:4501");
