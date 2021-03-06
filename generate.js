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

	each(exportDevices, function(device) {
		var shotFramer = new Framer(device, {
			'label': shot.text.text,
			'labelPosition': shot.text.position,
			'isLandscape': device.config.orientation == 'landscape',
			'phoneColor': device.config.color
		});

		if (shot.background) {
			var background = shot.background;
			if (background.color) shotFramer.setBackgroundColor(background.color);
			if (background.image) shotFramer.setBackgroundImageWithUrl(appRoot + '/' + background.image);
		}

		var fontSize = device.config.fontSize || 12;
		if (shot.text.fontSizeMultiplier) fontSize *= shot.text.fontSizeMultiplier;
		shotFramer.setFontSize(fontSize);

		var fontWeight = config.fontWeight || 400;
		if (shot.text.fontWeightMultiplier) fontWeight *= shot.text.fontWeightMultiplier;

		shotFramer.setFontColor(shot.text.color || config.fontColor || '#000');
		var fontName = config.fontName || 'roboto';

		if (shot.text.shadow) {
			var shadow = shot.text.shadow;
			shotFramer.setShadow(shadow.color, shadow.blur, shadow.offsetX, shadow.offsetY);
		}

		shotFramer.setFontWeight(fontName, fontWeight, function() {
			var screenshotUrl = appRoot + '/' + config.screenshots + '/' + device.config.shotsname + '/' + shot.source;
			if (!fs.existsSync(screenshotUrl)) {
				errors++;
				return console.error('File not found', screenshotUrl);
			}
			shotFramer.setScreenshotImageWithUrl(screenshotUrl);

			if (shot.background && shot.background.cover) {
				var cover = shot.background.cover;
				shotFramer.setBackgroundCover(cover.color, cover.opacity);
			}

			dataUrl = shotFramer.renderToDataURL(function(err, dataUrl) {
				if (err) return console.error(err);

				var shotFolder = 'output/'+device.filenamePrefix;
				if (!fs.existsSync(shotFolder)) {
					fs.mkdirSync(shotFolder);
				}
				var outputUrl = appRoot + '/' + shotFolder + '/' + shotName + '.jpg';
				save(dataUrl, outputUrl);
				console.log('Saved', outputUrl);
			});
		}, this);
	});
});
if (errors) {
	console.error("Not all screenshots could be framed");
	exit(1);
}
