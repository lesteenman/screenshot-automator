Screenshot Automator
====================
This is a script that automatically frames screenshots with text to accompany them.

Install
=======
Requires several packages, as stated by [the node-canvas documentation](https://github.com/Automattic/node-canvas#installation). After that. install with `npm install` and run with `npm start`.

Config
======
A sample config can be found in `sample_screenshots.json`.

Screenshot Config format:

 * _screenshots_: directory where the screenshots can be found.
 * _fontName (optional)_: which font to use. Defaults to _Roboto_.
 * _fontWeight (optional)_: weight of the text. Defaults to 400.
 * _fontColor (optional)_: default color of fonts. Defaults to black.
 * _shots_: a structure of which shots to make, indexed by its output name.
 	* _source_: the name of the screenshots in _screenshots_/_device_ that should be used for this shot.
	* _background (optional)_:
		* _color (optional)_: background color for the shot. Defaults to black.
		* _image (optional)_: background image for the shot. Overrides color.
		* _cover (optional)_:
			* _color_: color of the background cover.
			* _opacity (optional)_: opacity of the background cover. Defaults to 0.5.
	* _text_:
		* _text_: Text to place on the image.
		* _position_: Where to place the text with relation to the image.
		* _color (optional)_: Color of text on this shot.
		* _fontSizeMultiplier (optional)_: Multiplication factor of text placed on the shot, relative to the global _fontSize_.
		* _fontWeightMultiplier (optional)_: Weight multiplier of the text placed on the shot, relative to the global _fontWeight_.
		* _shadow (optional)_:
			* _color_
			* _blur_
			* _offsetX_
			* _offsetY_

 - valid text positions:
	- `above`
	- `below`
	- `above_full_device`
	- `below_full_device`
	- `device`
	- `above_screenshot`
	- `below_screenshot`
	- `none`

 - valid fontweights:
	- `100`
	- `300`
	- `400`
	- `600`
	- `700`
	- `800`
 - available fonts:
	- `Open Sans`
	- `Ralewa`
	- `Lato`
	- `Roboto`
	- `Oswald`
	- `Lora`
	- `PT Sans`
	- `Aria`
	- `Impac`
	- `Georgi`
	- `Palatin`
	- `Tahom`
	- `Time`
	- `Verdan`

Notice
======
The script that actually performs the framing, along with the static phone assets, are (almost) directly sourced from the [LaunchKit](https://github.com/launchkit/LaunchKit) source.

TODO
====
 - [x] Properly document the screenshots.json structure
 - [x] Add font size/weight to each device, and multipliers per shot
 - [x] Properly support text shadow
 - [x] Option to darken background

Future:
 - [ ] Automatically add status bars etc.
