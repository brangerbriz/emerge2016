# Depth Portraits

Interactive portrait installation that transforms a person's likeness into a real-time digitally processed 3D portrait and archives it on the internet to be viewed in the browser. See http://emerge.brangerbriz.com.

## Project Overview

This project contains two primary components, [`installation/`](installation) and [`microsite/`](microsite). 

- `installation/` contains the code needed to run the portrait capturing installation on a linux (tested with Ubuntu 14.04) machine at the venue. This machine should have a Kinect v1 connected. The application is built with `NW.js` v0.12.3 and uses this [node-kinect submodule](https://github.com/brannondorsey/node-kinect.git) to pipe raw 11-bit depth-images via websockets from a node v0.10.25 instance to the NW.js application. The installation is setup to automatically detect (using motion values produced from a frame-differencing algorithm) a user's presence in front of the kinect and begin recording a portrait and saving it to the database. If the `microsite/` has been deployed (and the installation was launched with `bin/start_installations.sh`) a reverse-ssh tunnel should have also been created to the cloud server running the `microsite/` and a master-slave replication model should be setup to keep the online database in sync with the database running on the `installation/` machine. All default behaviors can be tweaked by visiting the control panel at `http://localhost:8003/` on the `installation/` machine. If printing is enabled via that panel (and the correct printer-related steps in this `[bin/README.md](bin/README.md)` have been followed) then each portrait sessions should trigger a portrait printout with custom URL via a Polaroid POGO bluetooth printer so that users can find their 3D portrait on the web.

- `microsite/` contains the code needed to run the archive website where users can view and share the portraits they created with `installation/`. It should be run from a cloud linux server with `bin/start_microsite.sh` assuming MongoDB and Node.js are installed (and everything has been installed w/ `npm install` in `microsite/`). See http://emerge.brangerbriz.com for an example of a live version of `microsite/`.

## Branches

Each time the project is deployed at a new event or location we create a new branch for it:

- master: Depth Portraits was originally created for the eMERGE Americas 2016 conference in Miami, FL (http://emerge.brangerbriz.com).
- BYOB: Branch holding changes applied for the BYOB Chicago IV event (http://byob.brangerbriz.com).

## Dependencies

This project is fairly involved and may be difficult to setup on a machine if you are unfamiliar with many of the tools involved. Here be dragons.

* [NVM (Node Version Manager)](https://github.com/creationix/nvm)
* [Node.js](https://nodejs.org/) v0.10.x and v0.12.x (or v5.x) installed via NVM.
* [mongodb](https://www.mongodb.org/)
* [libfreenect](https://github.com/OpenKinect/libfreenect) ( see [node-kinect](https://github.com/nguyer/node-kinect/blob/master/README.md) )
* ...possibly also [libusb](http://www.libusb.org/)

## Running the Installation

With everything properly installed:

```bash
cd installations
npm install
../bin/start_installation.sh
```
```bash
# to stop the processes launched by running the installation
../bin/stop_installation.sh
```

## Running the Microsite

On your cloud server run: 

```bash
cd microsite
npm install
../bin/start_microsite.sh
```

For a full list of all automation scripts see [this README](bin/README.md).

## Repurposing the Project for a New Event

Below is a checklist of things to edit in order to reskin the project for a new event or venue.
The result will be an installation that uploads portraits to a new microsite.

Clone the repo to a **new folder** (even if you already have a clone of the project). Change `NEW_NAME`
to fit your new event/project name.

```bash
git clone https://github.com/brangerbriz/emerge2016.git # clone the repo
mv emerge2016 NEW_EVENT # rename the repo
git checkout -b NEW_EVENT # create and checkout a new branch
```
The following edits are now required (Replace `NEW_*` with custom values):

- [bin/env.sh](bin/env.sh)
	Here many variables can be changed depending on your setup, most notably:

		- `MONGOD_PORT`: The port to run `mongod` on
		- `REMOTE_SERVER_HOST`: Host used to create a reverse-ssh tunnel allowing the microsite `mongod` instance to be the slave of a master `mongod` instance running on the installation machine behind a firewall.
		- `SSH_TUNNEL_REMOTE_USER`: The user on `REMOTE_SERVER_HOST`.
		- `SSH_TUNNEL_REMOTE_PORT`: The port to open on `REMOTE_SERVER_HOST` that will be forwarded to the installation machine's `MONGOD_PORT`.
- [installation/app.js](installation/app.js)
	- `mongoose.connect('mongodb://localhost:4003/emerge');` to `mongoose.connect('mongodb://localhost:NEW_MONGOD_PORT/NEW_DATABASE');` 
	- `var url = PARAM.saveData ? 
 			"emerge.brangerbriz.com/" + id : "emerge.brangerbriz.com";` to `var url = PARAM.saveData ? 
 			"NEW_NAME.brangerbriz.com/" + id : "NEW_NAME.brangerbriz.com";`
 	- Remove both `this.context.drawImage(...)` calls inside `CardPriner.renderImage(...)` or replace with your own logos.
 - [microsite/server.js](microsite/server.js)
 	- `mongoose.connect('mongodb://localhost:4004/byob');` to `mongoose.connect('mongodb://localhost:NEW_MONGOD_PORT/NEW_DATABASE');`
 	- `title` value in all instances of `res.render(...)`
 - [microsite/views/*](microsite/views)
 	- All meta tags that feature a description or twitter/open graph cards
 	- Update google analytics link
 	- [microsite/views/index.html](microsite/views/index.html): Description in `p.desktop-only` and `p.mobile-only`.
 	- [microsite/views/portrait.html](microsite/views/portrait.html): Share links in `div.shareButtons a` and all instances of `eMergePortrait` or `eMerge Portrait`. Also remove all instances of `EA16` hashtag in share content.
 - [share/flaggedList.js](share/flaggedList.js): Empty or update. Also remove `microsite/public/flaggedList.js` if it exists because that file will incorrectly be used instead if it is present.