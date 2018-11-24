'use strict';

/* Magic Mirror
 * Module: MMM-bergfex
 *
 * By Juergen Wolf-Hofer
 * Apache 2.0 Licensed.
 */

const NodeHelper = require('node_helper');
var async = require('async');
var sys = require('sys');
var exec = require('child_process').exec;
const request = require('request');
const cheerio = require("cheerio");

// Constants
const URL = "https://www.bergfex.ch/schweiz/schneewerte/";

module.exports = NodeHelper.create({

  start: function() {
    console.log('Starting node helper: ' + this.name);
  },

  // Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
    if (notification === 'CONFIG') {
		var self = this;
		this.config = payload;
		self.retrieveAndUpdate();
		setInterval(function() {
			self.retrieveAndUpdate();
		}, this.config.updateInterval);
    }
  },

  retrieveAndUpdate: function() {
	var self = this;
	console.log('retrieveAndUpdate()');

	request(URL, function (err, response, html) {
		let $ = cheerio.load(html);
		var allSnowReports = [];
		var tbody = $('.content').children().last();
		
		tbody.children().each(function() {
			var entry = parseEntry($(this));
			allSnowReports.push(entry);
		});
		
		console.log(allSnowReports.length + " snow reports from bergfex.ch retrieved.");
		var selSnowReports = [];
		for (var i=0; i<self.config.skiareas.length; i++) {
			console.log("searching for " + self.config.skiareas[i]);
			selSnowReports.push(searchData(allSnowReports, self.config.skiareas[i]));
		}
		//console.log(selSnowReports);
		
		self.sendSocketNotification('SNOW_REPORT', selSnowReports);
	});
	
  }

});


function searchData(snow_reports, skiarea) {
	for (var i=0; i<snow_reports.length; i++) {
		if (snow_reports[i].skiarea === skiarea) {
			return snow_reports[i];
		}
	}
	return null;
}

function parseEntry(row) {
	var entry = {skiarea: "", tal: "", berg: "", neu: "", lifte: ""};
	
	var td1 = row.children().first();
	var td2 = td1.next();
	var td3 = td2.next();
	var td4 = td3.next();
	var td5 = td4.next();
	var td6 = td5.next();
	var td7 = td6.next();
	
	entry.skiarea = td1.text().trim();
	entry.tal = td2.text().trim();
	entry.berg = td3.text().trim();
	entry.neu = td4.text().trim();
	entry.lifte = td5.text().trim();
	entry.update = td7.text().trim();
	
	return entry;
}

function testData() {
	return [
			{ 
				skiarea: 'Gosau - Dachstein West',
				tal: '80 cm',
				berg: '100 cm',
				neu: '10 cm',
				lifte: '32/32',
				update: 'Heute, 08:13' 
			},
			{ 
				skiarea: 'Gerlos - Zillertal',
				tal: '40 cm',
				berg: '70 cm',
				neu: '15 cm',
				lifte: '11/11',
				update: 'Heute, 08:10' 
			},
			{ 
				skiarea: 'Hauser Kaibling',
				tal: '85 cm',
				berg: '70 cm',
				neu: '20 cm',
				lifte: '16/17',
				update: 'Heute, 07:13' 
			},
	];
}