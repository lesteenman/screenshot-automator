Screenshot Automator
====================

This is a script that automatically frames screenshots with text to accompany them.

Install
=======
Requires several packages, as stated by [the node-canvas documentation](https://github.com/Automattic/node-canvas#installation). After that. install with `npm install` and run with `npm start`.

Config
======
A sample config can be found in `sample_screenshots.json`.

- valid fontweights:
	- 100
	- 300
	- 400
	- 600
	- 700
	- 800
- available fonts:
	- Open Sans
	- Ralewa
	- Lato
	- Roboto
	- Oswald
	- Lora
	- PT Sans
	- Aria
	- Impac
	- Georgi
	- Palatin
	- Tahom
	- Time
	- Verdan

Notice
======
The script that actually performs the framing, along with the static phone assets, are (almost) directly sourced from the [LaunchKit](https://github.com/launchkit/LaunchKit) source.
