/**
 * @license
 * Copyright 2016 Cluster Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var createClass = require('create-class');
var each = require('foreach');
var Canvas = require('canvas');
var Image = Canvas.Image;
var sizing = require('./screenshot-sizing.js');
var fonts = require('./screenshot-fonts.js');
var appRoot = require('app-root-path');


// This should be in dips.
var PHONE_IMAGE_EDGE_OFFSET = 20;


function renderWrappedText(context, text, x, y, maxWidth, lineHeight, shadow) {
	var totalHeight = 0;
	var words = text.split(/\s/g);
	var spaces = text.match(/\s/g) || [];
	var lines = 0;
	while (words.length) {
		var i = 0;
		var width;
		for (; i < words.length; i++) {
			line = words.slice(0, i + 1).join(' ');
			width = context.measureText(line).width;
			if (i > 0 && (width > maxWidth || spaces[i - 1] == '\n')) {
				line = words.slice(0, i).join(' ');
				width = context.measureText(line).width;
				break;
			}
		}
		if (shadow) {
			context.shadowBlur = shadow.blur;
			context.shadowColor = shadow.color;
			context.shadowOffsetX = shadow.offsetX;
			context.shadowOffsetY = shadow.offsetY;
		} else {
			context.shadowBlur = 0;
		}
		var myX = x + ((maxWidth - width) / 2.0);
		context.fillText(line, myX, y);

		y += lineHeight;
		totalHeight += lineHeight;
		words = words.slice(i);
		spaces = spaces.slice(i);
	}

	// console.log('textheight', text, totalHeight);
	return totalHeight;
}

var LABEL_POSITION_ABOVE = 'above';
var LABEL_POSITION_BELOW = 'below';
var LABEL_POSITION_ABOVE_FULL_DEVICE = 'above_full_device';
var LABEL_POSITION_BELOW_FULL_DEVICE = 'below_full_device';
var LABEL_POSITION_DEVICE = 'device';
var LABEL_POSITION_ABOVE_SCREENSHOT = 'above_screenshot';
var LABEL_POSITION_BELOW_SCREENSHOT = 'below_screenshot';
var LABEL_POSITION_NONE = 'none';

/*
 * Phone:
 *  - name
 *
 * Options:
 *  - label
 *  - labelPosition
 *  - isLandscape
 *  - phoneColor
 */
var ScreenshotCanvasWrapper = createClass({
	constructor: function(phone, options) {
		this.phone = phone;
		var options = options || {};

		this.canvas = new Canvas();

		var name = phone.name;

		// Set defaults.

		this.setFontWeight('Helvetica', '400');
		this.setFontColor('#333');
		this.setBackgroundColor('#fff');
		this.setPhoneColor(options.phoneColor || 'black');
		this.setFontSize(16);
		this.setOrientation(options.isLandscape || null);

		this.shadow = {
			color: 'rgba(0,0,0,0.25)',
			blur: 5,
			offsetX: 0,
			offsetY: 0
		};

		this.backgroundCover = {
			opacity: 0,
			color: '#000'
		};

		if (options.label) {
			this.setLabel(options.label)
		}
		this.setLabelPosition(options.labelPosition || 'above');

		var colors = ['black', 'white', 'gold', 'rose']

		for (var c in colors) {
			var color = colors[c];
			if (phone[this.orientation][color]) {
				var image = new Image();
				image.crossOrigin = 'Anonymous';
				image.src = appRoot + phone[this.orientation][color]['src'];
				image.dataset = {};
				image.dataset.color = color;
				image.dataset.name = phone.name;
				phone[this.orientation][color]['img'] = image;
			}
		}

	},

	setPhoneColor: function(color) {
		this.phoneColor = color || 'black';
	},
	setBackgroundColor: function(color) {
		this.backgroundColor = color;
		this.rerender();
	},
	setLabel: function(label) {
		this.label = label;
		this.rerender();
	},
	setLabelHidden: function(hidden) {
		this.labelHidden = hidden;
		this.rerender();
	},
	setLabelPosition: function(position) {
		this.labelPosition = position;
		this.rerender();
	},
	setFontWeight: function(fontName, fontWeight, cb, context) {
		if (this.fontName != fontName || this.fontWeight != fontWeight) {
			this.setLabelHidden(true);
		}

		this.fontName = fontName;
		this.fontWeight = fontWeight;

		fonts.loadFontByName(fontName, fontWeight, function() {
			this.setLabelHidden(false);
			this.rerender();
			if (cb) cb.call(context);
		}, this);

		this.rerender();
	},
	setFontSize: function(fontSize) {
		this.fontSize = fontSize;
		this.rerender();
	},
	setFontColor: function(fontColor) {
		this.fontColor = fontColor;
		this.rerender();
	},

	setShadow: function(color, blur, offsetX, offsetY) {
		if (color === false) {
			this.shadow = false;
		} else {
			blur = blur || 20;
			offsetX = offsetX || 0;
			offsetY = offsetY || 0;
			this.shadow = {
				color: color,
				blur: blur,
				offsetX: offsetX,
				offsetY: offsetY
			};
		}
		this.rerender();
	},

	setBackgroundCover: function(color, opacity) {
		if (color === false) {
			this.backgroundCover = false;
		} else {
			opacity = opacity === undefined ? 0.5 : opacity;
			this.backgroundCover = {
				color: color,
				opacity: opacity
			}
		}
		this.rerender();
	},

	setScreenshotImageWithUrl: function(url, opt_callback, context) {
		this.screenshotImage = new Image();
		this.screenshotImage.crossOrigin = 'Anonymous';
		var onLoad = function() {
			this.rerender();
			if (opt_callback){
				if (context) {
					opt_callback.call(context);
				} else {
					opt_callback();
				}
			}
		};
		this.screenshotImage.onload = onLoad.bind(this);
		this.screenshotImage.src = url;
	},

	setBackgroundImageWithUrl: function(url, opt_callback, context) {
		this.backgroundImage = new Image();
		this.backgroundImage.crossOrigin = 'Anonymous';
		var onLoad = function() {
			this.rerender();
			if (opt_callback){
				if (context) {
					opt_callback.call(context);
				} else {
					opt_callback();
				}
			}
		};
		this.backgroundImage.onload = onLoad.bind(this);
		this.backgroundImage.src = url;
	},

	removeBackgroundImage: function() {
		delete(this.backgroundImage);
		this.rerender();
	},

	setOptimizeQuality: function(optimizeQuality) {
		this.optimizeQuality = !!optimizeQuality;
	},

	setOrientation: function(val) {
		this.orientation = (!val) ? 'portrait' : 'landscape';
	},

	rerender: function() {
		clearTimeout(this.renderTimeout);
		var me = this;
		this.renderTimeout = setTimeout(function() {
			me.renderInCanvas(me.canvas);
		}, 0);
	},

	tweakDeviceMultiplier: function(phone, labelPosition, textHeight, canvasHeight) {
		// Each device needs scaling tweaks to show the entire device
		// TODO(lance): Take into consideration textHeight.
		var multiplier = phone.deviceSizeMultiplier || 1;

		if (labelPosition == LABEL_POSITION_ABOVE_FULL_DEVICE || labelPosition == LABEL_POSITION_BELOW_FULL_DEVICE) {
			var multiplierTextAdjustment = textHeight / canvasHeight;
			switch (phone.name) {
				case 'iphone4':
					multiplier = (this.orientation == 'portrait') ? .78 : 1.1;
					multiplier -= multiplierTextAdjustment
					break;

				case 'iphone5':
					multiplier = (this.orientation == 'portrait') ? .86 : 1;
					multiplier -= multiplierTextAdjustment
					break;

				case 'iphone6':
					multiplier = (this.orientation == 'portrait') ? .87 : 1;
					multiplier -= multiplierTextAdjustment
					break;

				case 'iphone6plus':
					multiplier = (this.orientation == 'portrait') ? .85 : 1;
					multiplier -= multiplierTextAdjustment
					break;

				case 'ipad':
					multiplier = 0.92 - multiplierTextAdjustment;
					break;
				case 'ipadpro':
					multiplier = 0.94 - multiplierTextAdjustment;
					break;
				default:
					multiplier = (this.orientation == 'portrait') ? .84 : .95;
					multiplier -= multiplierTextAdjustment
					break;
			}

		} else if (labelPosition == LABEL_POSITION_DEVICE) {
			switch (phone.name) {
				case 'iphone4':
					multiplier = (this.orientation == 'portrait') ? 0.80 : 1;
					break;
				case 'iphone5':
					multiplier = (this.orientation == 'portrait') ? 0.89 : 1;
					break;
				case 'iphone6':
					multiplier = (this.orientation == 'portrait') ? 0.91 : 1;
					break;
				case 'iphone6plus':
					multiplier = (this.orientation == 'portrait') ? 0.90 : 1;
					break;
				case 'ipad':
					multiplier = (this.orientation == 'portrait') ? 0.96 : 1;
					break;
				case 'ipadpro':
					multiplier = (this.orientation == 'portrait') ? 0.96 : 1;
					break;
				default:
					multiplier = (this.orientation == 'portrait') ? 0.92 : 1;
					break;
			}

		}
		return multiplier;
	},

	renderInCanvas: function(canvas) {
		var context = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;

		var phone = this.phone;
		var phoneImage = this.phone[this.orientation][this.phoneColor]['img'];

		var hasScreenshotImage = this.screenshotImage && this.screenshotImage.complete;

		var fontSize = width * (0.0125 * this.fontSize);
		if (this.orientation == 'landscape') {
			var minSize = Math.min(width, height);
			var fontSizeTweak = 1.2;
			if (phone.isIPad) {
				var fontSizeTweak = 1.8;
			}
			fontSize = (minSize / fontSizeTweak) * (0.0125 * this.fontSize);
		}
		var lineHeight = fontSize * 1.4;

		// Max width % of caption, and offset from left side
		var textMaxWidth = width * 0.9;
		var textX = width * .05;
		// Padding between text and edge of image, and additional padding between text & device
		var textPadding = lineHeight * 1.5;
		var textDevicePadding = 6;

		// Set font size before reading initial font stuff.
		context.font = this.fontWeight + ' ' + fontSize + 'px ' + this.fontName;

		// First, render the text at the top so we know how tall it is.
		var textHeight = 0;
		if (this.labelPosition != this.LABEL_POSITION_NONE) {
			textHeight = renderWrappedText(context, this.label || '',
				// First render, about to be discarded, these don't matter.
				0, 0,
				// .. but these do.
				textMaxWidth, lineHeight, this.shadow);
		}

		// RESET THE BACKGROUND.

		context.fillStyle = this.backgroundColor;
		context.fillRect(0, 0, width, height);

		if (this.backgroundImage) {
			var aspectFit = sizing.aspectFit(
				this.backgroundImage.width, this.backgroundImage.height,
				width, height);

			context.drawImage(this.backgroundImage,
				(width - aspectFit.width) / 2,
				(height - aspectFit.height) / 2,
				aspectFit.width, aspectFit.height);
		}

		if (this.backgroundCover) {
			context.fillStyle = this.backgroundCover.color;
			context.globalAlpha = this.backgroundCover.opacity;
			context.fillRect(0, 0, width, height);
			context.globalAlpha = 1;
		}

		// Then setup the text fill.
		context.fillStyle = this.fontColor;

		var measureFromBottom = false;
		var drawPhoneImage = false;
		var invisPhoneImage = false;

		// Decide if we're rendering the label.
		if (this.labelPosition == LABEL_POSITION_ABOVE) {
			drawPhoneImage = true;

			if (!this.labelHidden) {
				renderWrappedText(context, this.label || '',
					textX, textPadding,
					textMaxWidth, lineHeight, this.shadow);
			}

		} else if (this.labelPosition == LABEL_POSITION_ABOVE_FULL_DEVICE) {
			drawPhoneImage = true;

			if (!this.labelHidden) {
				renderWrappedText(context, this.label || '',
					textX, textPadding,
					textMaxWidth, lineHeight, this.shadow);
			}

		} else if (this.labelPosition == LABEL_POSITION_BELOW) {
			drawPhoneImage = true;
			measureFromBottom = true;

			if (!this.labelHidden) {
				var textTop = height - textHeight;
				renderWrappedText(context, this.label || '',
					textX, textTop,
					textMaxWidth, lineHeight, this.shadow);
			}

		} else if (this.labelPosition == LABEL_POSITION_BELOW_FULL_DEVICE) {
			drawPhoneImage = true;
			measureFromBottom = true;

			if (!this.labelHidden) {
				var textTop = height - textHeight;
				renderWrappedText(context, this.label || '',
					textX, textTop,
					textMaxWidth, lineHeight, this.shadow);
			}

		} else if (this.labelPosition == LABEL_POSITION_DEVICE) {
			drawPhoneImage = true;

		} else if (this.labelPosition == LABEL_POSITION_ABOVE_SCREENSHOT) {
			invisPhoneImage = true;

			if (!this.labelHidden) {
				this.shotAndText = renderWrappedText(context, this.label || '',
					textX, textPadding,
					textMaxWidth, lineHeight, this.shadow);
			}

		} else if (this.labelPosition == LABEL_POSITION_BELOW_SCREENSHOT) {
			invisPhoneImage = true;
			measureFromBottom = true;

			if (!this.labelHidden) {
				var textTop = height - textHeight;
				this.shotAndText = renderWrappedText(context, this.label || '',
					textX, textTop,
					textMaxWidth, lineHeight, this.shadow);
			}

		} else if (this.labelPosition == LABEL_POSITION_NONE) {
			this.labelHidden = true;
		}

		var deviceSizeMultiplier = this.tweakDeviceMultiplier(phone, this.labelPosition, textHeight, height);
		var phoneImageLeft = (width - (width * deviceSizeMultiplier)) / 2;
		var phoneImageTop = (height - (height * deviceSizeMultiplier)) / 2;
		var phoneImageWidth = width * deviceSizeMultiplier;
		var phoneImageHeight = (phoneImageWidth / (phoneImage.width || 1)) * phoneImage.height;

		// The rect on the destination canvas where we draw the screenshot image.
		var screenshotTargetRect = {x: 0, y: 0, width: 0, height: 0};

		if (drawPhoneImage || invisPhoneImage) {
			var dipsToCanvasPixels = phone.naturalMultiplier / (phone[this.orientation].naturalWidth / width);
			var phoneImageOffset = 0;

			if (this.labelPosition != LABEL_POSITION_DEVICE) {
				phoneImageOffset = textPadding + textDevicePadding + textHeight - (PHONE_IMAGE_EDGE_OFFSET * dipsToCanvasPixels);
			} else {
				if (this.orientation == 'landscape') {
					phoneImageOffset = (height - phoneImageHeight) /2
				}
			}

			var phoneImageTop;
			if (measureFromBottom) {
				if (this.labelPosition == LABEL_POSITION_BELOW_SCREENSHOT && this.orientation == 'landscape') {
					phoneImageOffset *= 1.5;
				}
				phoneImageTop = height - phoneImageHeight - phoneImageOffset;
			} else {
				phoneImageTop = phoneImageOffset;
			}

			// If we have the phone loaded, draw the phone image on the canvas.
			if (!invisPhoneImage && phoneImage.complete) {
				context.drawImage(phoneImage, phoneImageLeft, phoneImageTop,
					phoneImageWidth, phoneImageHeight);
			}

			// Now position the screenshot within the phone image.
			// The screenWidth / screenHeight here are percentages, so we take the
			// destination size of the image and multiply to find the rendered size.
			screenshotTargetRect.width = phoneImageWidth * phone[this.orientation].screenWidth;
			screenshotTargetRect.height = phoneImageHeight * phone[this.orientation].screenHeight;
			screenshotTargetRect.x = phoneImageLeft + (phoneImageWidth * phone[this.orientation].screenLeft);

			var screenTop = phoneImageHeight * phone[this.orientation].screenTop;
			screenshotTargetRect.y = phoneImageTop + screenTop;

			// for screenshot + text, move the screenshot up a bit
			if (invisPhoneImage) {
				screenshotTargetRect.width = phoneImageWidth * 0.90;
				screenshotTargetRect.height = phoneImageHeight * 0.84;
				screenshotTargetRect.x = (width - screenshotTargetRect.width) / 2;

				context.save();
				context.shadowColor = '#999';
				context.shadowBlur = 20;
				context.shadowOffsetX = 0;
				context.shadowOffsetY = 0;

				if (measureFromBottom) {
					screenTop = screenTop * -1;
					screenshotTargetRect.y += screenTop + (lineHeight * 3);
					if (phone.isIPad) {
						screenshotTargetRect.y += screenTop + (lineHeight * 4);
					}
				} else {
					screenshotTargetRect.y -= screenTop - (lineHeight / 2);
				}
			}

		} else {
			// There's no phone to draw.
			// So, fit the source image to the canvas, aligned to the top.
			screenshotTargetRect.width = width;
			screenshotTargetRect.height = height;
		}

		// Now draw the screenshot, if we have one loaded.
		if (hasScreenshotImage) {
			var sourceX = 0;
			var sourceY = 0;
			var sourceWidth = this.screenshotImage.width;
			var sourceHeight = this.screenshotImage.height;

			var targetAspect = screenshotTargetRect.width / (screenshotTargetRect.height || 1);
			var sourceAspect = sourceWidth / sourceHeight;

			if (Math.abs(sourceAspect - targetAspect) > 0.1) {
				// If the aspect ratios of the source and destination are not the same
				// by a nontrivial difference, fit the screenshot image at the top
				// or bottom of the destination rect, offset by the relative
				// difference in aspect ratio.
				var sourceRelativeAspectHeightDifference = (sourceWidth / targetAspect) - sourceHeight;
				var targetRelativeAspectHeightDifference = (screenshotTargetRect.width / sourceAspect) - screenshotTargetRect.height;

				if (sourceRelativeAspectHeightDifference < 0) {
					// reduce portion of source image we use.
					sourceHeight += sourceRelativeAspectHeightDifference;
				} else {
					// cannot increase source image's height. instead, change where it is drawn.
					screenshotTargetRect.height += targetRelativeAspectHeightDifference;
				}

				// If we want to align the image to the bottom of the target rect,
				// move the starting Y point for the rect.
				if (measureFromBottom) {
					if (targetRelativeAspectHeightDifference < 0) {
						screenshotTargetRect.y -= targetRelativeAspectHeightDifference;
					} else {
						sourceY -= sourceRelativeAspectHeightDifference;
					}
				}
			}

			context.drawImage(this.screenshotImage,
				sourceX, sourceY, sourceWidth, sourceHeight,
				screenshotTargetRect.x, screenshotTargetRect.y,
				screenshotTargetRect.width, screenshotTargetRect.height);
		}
	},

	renderToDataURL: function(opt_quality, cb) {
		var canvas = new Canvas();
		canvas.width = this.phone[this.orientation].naturalWidth;
		canvas.height = this.phone[this.orientation].naturalHeight;

		this.renderInCanvas(canvas);

		canvas.toDataURL('image/jpeg', opt_quality || 0.8, cb);
	},

	// EVENT HANDLERS

	onLoadPhoneImage: function(evt) {
		this.rerender();
	}
});


ScreenshotCanvasWrapper.LABEL_POSITION_ABOVE = LABEL_POSITION_ABOVE;
ScreenshotCanvasWrapper.LABEL_POSITION_BELOW = LABEL_POSITION_BELOW;
ScreenshotCanvasWrapper.LABEL_POSITION_ABOVE_FULL_DEVICE = LABEL_POSITION_ABOVE_FULL_DEVICE;
ScreenshotCanvasWrapper.LABEL_POSITION_BELOW_FULL_DEVICE = LABEL_POSITION_BELOW_FULL_DEVICE;
ScreenshotCanvasWrapper.LABEL_POSITION_DEVICE = LABEL_POSITION_DEVICE;
ScreenshotCanvasWrapper.LABEL_POSITION_ABOVE_SCREENSHOT = LABEL_POSITION_ABOVE_SCREENSHOT;
ScreenshotCanvasWrapper.LABEL_POSITION_BELOW_SCREENSHOT = LABEL_POSITION_BELOW_SCREENSHOT;
ScreenshotCanvasWrapper.LABEL_POSITION_NONE = LABEL_POSITION_NONE;

module.exports = ScreenshotCanvasWrapper;
