// Copyright 2016 Cluster Labs, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

var Framer = require('./static/js/framer.js');
var lkDevices = require('./static/js/devices.js');
var fs = require('fs');
var each = require('foreach');
var appRoot = require('app-root-path');

save = function(dataUrl, output) {
	var data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	fs.writeFileSync(output, buf);
}

config = require('./screenshots.json');
exportDevices = [];

var failed = false;
each(config.devices, function(d) {
	var device = false;
	each(lkDevices.platforms, function(platform) {
		each(platform.devices.byName, function(lkd) {
			if (lkd.name == d.lkname) {
				device = lkd;
				lkd.config = d;
			}
		});
	});
	if (!device) {
		failed = true;
		console.error("Device not found: ", d.lkname);
		return;;
	}
	exportDevices.push(device);
});

if (failed) {
	process.exit(1);
}

if (!fs.existsSync('output')) fs.mkdirSync('output');

var errors = 0;
each(config.shots, function(shot, shotName) {
	var shotFolder = 'output/'+shotName;
	if (!fs.existsSync(shotFolder)) {
		console.log('Making directory', shotFolder);
		fs.mkdirSync(shotFolder);
	}

	each(exportDevices, function(device) {
		var shotFramer = new Framer(device, {
			'label': shot.text.text,
			'labelPosition': shot.text.position,
			'isLandscape': device.config.orientation == 'landscape',
			'phoneColor': device.config.color
		});

		if (shot.backgroundColor) shotFramer.setBackgroundColor(shot.backgroundColor);
		if (shot.backgroundImage) shotFramer.setBackgroundImageWithUrl(shot.backgroundImage);
		if (shot.fontSize) shotFramer.setFontSize(shot.fontSize);
		if (config.fontName) shotFramer.setFontSize(config.fontName);
		if (shot.fontColor) shotFramer.setFontColor(shot.fontColor);

		shotFramer.setFontColor('#333');
		shotFramer.setFontSize(6);
		shotFramer.setFontWeight('roboto', '200', function() {
			// TODO: Customize screenshots folder?
			var screenshotUrl = appRoot + '/screenshots/' + device.config.shotsname + '/' + shot.source;
			if (!fs.existsSync(screenshotUrl)) {
				errors++;
				return console.error('File not found', screenshotUrl);
			}
			shotFramer.setScreenshotImageWithUrl(screenshotUrl);

			dataUrl = shotFramer.renderToDataURL(function(err, dataUrl) {
				if (err) return console.error(err);
				save(dataUrl, appRoot + '/' + shotFolder + '/' + device.filenamePrefix + '.jpg');
				console.log('Saved', shotFolder + '/' + device.filenamePrefix + '.jpg');
			});
		}, this);
	});
});
if (errors) {
	console.error("Not all screenshots could be framed");
	exit(1);
}
