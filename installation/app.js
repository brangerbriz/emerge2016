var nw = require('nw.gui');
var win = nw.Window.get();
var socket = io.connect('http://localhost:8008');
var fs = require("fs");
var spawn = require('child_process').spawn;


// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ------------------------------------------ SERVE CONTROLS-CLIENT ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io2 = require('socket.io')(http);

app.get('/', function(req, res){
   res.sendFile( process.env.PWD + '/controls-client/index.html');
});

app.get('/bbLogo.svg', function(req, res){
   res.sendFile( process.env.PWD + '/image/bbLogo.svg');
});

app.get('/emergeLogo.svg', function(req, res){
   res.sendFile( process.env.PWD + '/image/emergeLogo.svg');
});

io2.on('connection', function(soc){
	
	fs.readFile(process.env.PWD+'/controls-client/settings.json', 'utf8', function (err, data) {
		if (err) console.log(err); 
		var json = JSON.parse(data);
		soc.emit('settings', json );
	});

	soc.on('update-settings',function(set){
		PARAM = set;
		var json = JSON.stringify( PARAM );
		fs.writeFile(process.env.PWD+'/controls-client/settings.json', json, 'utf8', function(err) {
			if(err) console.log(err);
		});

		onSocketReconnectIntervalChanged();
	});

	soc.on('action',function(obj){
			 if( obj.type == "debug" && obj.value ) Debug.toggleOn();
		else if( obj.type == "debug" && !obj.value ) Debug.toggleOff();
		else if( obj.type == "sesh"  && obj.value ) KeyFrame.initDoc();
		else if( obj.type == "sesh"  && !obj.value ) sessionReset(0);
		else if( obj.type == "kinect"&& obj.value ) spawn(process.env.PWD + '/../bin/kill_kinect_daemon.sh');
		else if( obj.type == "rekinect"&& obj.value ) Latency.reconnect();
	});

});

http.listen(8003, function(){
  console.log('running server for controls-client on:8003');
});






// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ------------------------------------------------ THREE.JS STUFFS ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------

var scene, camera, renderer; 
var depth, wiremesh, pointcloud, frameDiff, diffTex, flowField, flowTex; // live vars
var idleDepth, idleDiffCanv, idleDiffCtx, idleDiffTex, idleDiffImg; // idle vars
var clearColor = new BB.Color( 30, 32, 47 );
var socketReconnectIntervalId = null;
// read current params from settings file ..................................................
var PARAM = JSON.parse( fs.readFileSync(process.env.PWD+'/controls-client/settings.json') );
onSocketReconnectIntervalChanged();

function onSocketReconnectIntervalChanged() {
	// latency issue.......
	clearInterval(socketReconnectIntervalId);
	if (PARAM.socketReconnectInterval !== 0) {
		socketReconnectIntervalId = setInterval(function(){
			Latency.reconnect();
		},PARAM.socketReconnectInterval * 1000);
	}
}




// 																							 _____________
//__________________________________________________________________________________________/   SETUP     \
//																										  |
//________________________________________________________________________________________________________|
function setup() {

	renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
	renderer.setClearColor( clearColor.hex );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.left = '0px';
	renderer.domElement.style.top = '0px';
	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	sceneIdle = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, 400 );

	// canvTex = new CanvTex(20);

	webglTex = new WebGLTexture({ // RIPPLE EFFECT SHADER TEXTURE
		width:640,
		height:480,
		vertexShader: '../share/shaders/wgltex-vert.glsl',
		fragmentShader: '../share/shaders/wgltex-frag.glsl'
	});
	

	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ idle mode
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ idle mode
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ idle mode

	// framediff texture -------------------------------------
	idleDiffCanv = document.createElement('canvas');
	idleDiffCanv.width = 640; idleDiffCanv.height = 480;
	idleDiffCtx = idleDiffCanv.getContext('2d');
	idleDiffTex = new THREE.Texture( idleDiffCanv );
	idleDiffTex.minFilter = THREE.NearestFilter;				
	idleDiffImg = new Image();
	idleDiffImg.src = IdleMode.keyframes[0].diffDataURL;
	idleDiffImg.onload = function(){ idleDiffCtx.drawImage( this, 0,0 ); }
	idleDiffTex.needsUpdate = true;

	// depth data ------------------------------
	idleDepth = new DepthFromKinect( 640, 480, IdleMode.keyframes[0].depthData );

	// meshes ----------------------------------
	idleWiremesh = new MeshFromDepth({
		depthData: idleDepth.canvas,
		scene: sceneIdle,
		vertexShader: '../share/shaders/glazewire-v.glsl',
		fragmentShader: '../share/shaders/glazewire-f.glsl',
		type: 'mesh',
		wireframe: true,
		polycount: 20,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "motionGate", type:"i", value: 0 }
		]
	});

	idlePointcloud = new MeshFromDepth({
		depthData: idleDepth.canvas,
		scene: sceneIdle,
		vertexShader: '../share/shaders/huepoints-v.glsl',
		fragmentShader: '../share/shaders/huepoints-f.glsl',				
		type: 'point',
		polycount: 100,
		pointsize: 3.0,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "motion", type:"f", value: 0.0 },
			{ name: "motionGate", type:"i", value: 0 },
			{ name: "motionFade", type:"f", value: 1.0 },
			{ name: "smoothMotion", type:"f", value: 1.0 },
			{ name: "diffTex", type: "t", value: idleDiffTex },
			{ name: "webglTex", type:"t", value: webglTex.getTexture() },
		]
	});


	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ live mode
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ live mode
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ live mode

	// frame differencing -----------------------------------
	frameDiff = new FrameDifference(640, 480);
	diffTex = new THREE.Texture(frameDiff.canvas);
	diffTex.minFilter = THREE.NearestFilter;
	diffTex.needsUpdate = true;

	// optical flow -----------------------------------
	// flowField = new OpticalFlowField(640, 480, 10, false);
	// flowTex = new THREE.Texture(flowField.canvas);
	// flowTex.minFilter = THREE.NearestFilter;
	// flowTex.needsUpdate = true;


	// kinect data + meshes ---------------------------------
	
	depth = new DepthFromKinect();	

	wiremesh = new MeshFromDepth({
		depthData: depth.canvas,
		scene: scene,
		vertexShader: '../share/shaders/glazewire-v.glsl',
		fragmentShader: '../share/shaders/glazewire-f.glsl',
		type: 'mesh',
		wireframe: true,
		// wireframeLinewidth: 10,
		polycount: 20,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "motion", type:"f", value: 1.0 },
			{ name: "motionGate", type:"i", value: 0 },
			{ name: "param1", type:"f", value: 7.0 },
			{ name: "param2", type:"f", value: 20.0 },
			{ name: "param3", type:"f", value: 0.2 },
			// { name: "canvTex", type:"t", value: canvTex.getTexture() },
		]
	});

	pointcloud = new MeshFromDepth({
		depthData: depth.canvas,
		scene: scene,
		// fragmentShaderID: 'fs',
		// vertexShaderID: 'vs',
		vertexShader: '../share/shaders/huepoints-v.glsl',
		fragmentShader: '../share/shaders/huepoints-f.glsl',				
		type: 'point',
		polycount: 100,
		pointsize: 3.0,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "motion", type:"f", value: 1.0 },
			{ name: "smoothMotion", type:"f", value: 1.0 },
			{ name: "motionFade", type:"f", value: 1.0 },
			{ name: "motionGate", type:"i", value: 0 },
			{ name: "param1", type:"f", value: 7.0 },
			{ name: "param2", type:"f", value: 20.0 },
			{ name: "diffTex", type: "t", value: diffTex },
			// { name: "flowTex", type: "t", value: flowTex }
			{ name: "webglTex", type:"t", value: webglTex.getTexture() },
		]
	});

	
	socket.on('kinect-depth', function(data) {
		
		var d = new Uint8ClampedArray(data);
		depth.updateCanvasData(d);
		frameDiff.addFrame(depth.imageData.data);
		//flowField.addFrame(depth.imageData.data)

		if( User.present ){			
			wiremesh.update();
			pointcloud.update();			
		}

	});


	
	Debug.init(); // ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~  initialize debug stuffs
	CardPrinter.init();

	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  controls
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  controls
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  controls
	/*
			   S 	: toggle stats
			   F 	: misc.
		ctrl + Q 	: quote
		ctrl + F 	: toggle kiosk mode
		ctrl + G 	: toggle hide mouse
	 */
	document.onkeypress = function(e){
		var e = window.event || e;
		// console.log(e.keyCode)

		if(e.keyCode == 115 ) Debug.toggle(); // S ( to toggle debug / stats )
		if(e.keyCode == 102 ){  // F
			// var dframe = frameDiff.canvas;
			// dframe.style.position="absolute";
			// dframe.style.zIndex = 1999;
			// document.body.appendChild(dframe);
			// socket.emit('redo', {nfo:"this is a tester"} );
			// socket.io.reconnect();
			// if( socket.connected ) socket.disconnect();
			// else socket.connect();
		} 
		if(e.keyCode == 17)  closeApp(); 
		if(e.keyCode == 6 ) (win.isKioskMode) ? nw.Window.get().leaveKioskMode() : nw.Window.get().enterKioskMode(); 
		if(e.keyCode == 7) (document.body.style.cursor=="") ? 
							document.body.style.cursor = "none" : document.body.style.cursor = ""; 
	}

	window.onresize = function() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	window.onresize();

	nw.Window.get().enterKioskMode(); 
	document.body.style.cursor = "none";
}



// 																							 _____________
//__________________________________________________________________________________________/ DRAW LOOP   \
//																										  |
//________________________________________________________________________________________________________|
function draw() { 
	requestAnimationFrame(draw);

	Debug.update();

	var time = performance.now();

	// check connection
	if( !(mongoose.connection.readyState) ) console.log('no db connected!');
	

	User.detect( frameDiff.motion );

	if( !User.present ){ // --------------- --------------- ---- draw IDLE mode ---------------
	
		
		if( !PARAM.autoDetectOverride ) 
			sessionReset( PARAM.absentWait ); // reset for next session 
		else User.absentFor = PARAM.absentWait+1;
		
		if( User.absentFor > PARAM.absentWait ){

			IdleMode.motionUpdate();
			webglTex.update( time/5000 );
		
			if( idleWiremesh.loaded && idlePointcloud.loaded ){

				idleWiremesh.mesh.material.uniforms.time.value = time;			
				idleWiremesh.mesh.material.uniforms.motionGate.value = IdleMode.keyframes[IdleMode.frame].motionValue;		
				if( IdleMode.keyframes[IdleMode.frame].motionValue == 2 ) idleWiremesh.mesh.material.wireframe = false;
				else idleWiremesh.mesh.material.wireframe = true;
				//
				idlePointcloud.mesh.material.uniforms.time.value = time;
				idlePointcloud.mesh.material.uniforms.motion.value = IdleMode.motion*4;
				idlePointcloud.mesh.material.uniforms.motionFade.value = IdleMode.keyframes[IdleMode.frame].motionValue;
				idlePointcloud.mesh.material.uniforms.motionGate.value = IdleMode.keyframes[IdleMode.frame].motionValue;		
				idlePointcloud.mesh.material.uniforms.smoothMotion.value = IdleMode.motion * IdleMode.mScale;

				idleDiffTex.needsUpdate = true;
			}

			// switch frames
			IdleMode.counter++;
			if( IdleMode.counter % IdleMode.intervalAmt  == 0 ){ // approx every 4 seconds 
				IdleMode.frame++; 
				if(IdleMode.frame>=IdleMode.keyframes.length) {
					IdleMode.init();
					IdleMode.frame = 0;
				}
				
				idleDepth.crossFadeCanvasData( IdleMode.keyframes[IdleMode.frame].depthData, 1000 );
								
				idleDiffImg.onload = function(){ idleDiffCtx.drawImage( this, 0,0 ); }
				idleDiffImg.src = IdleMode.keyframes[IdleMode.frame].diffDataURL;
				idleDiffTex.needsUpdate = true;
			}
			idleWiremesh.update();
			idlePointcloud.update();

			//
			camera.position.x = Math.sin( performance.now() * 0.0004 ) * 200;
			camera.lookAt( sceneIdle.position );
			//
			renderer.render( sceneIdle, camera );
			Debug.stats.update();
		
		} else {

	
			// if user is not present BUUUUT we haven't xceeded the absentWait time
			// ... then keep rendering the LIVE scene
			//
			camera.position.x = Math.sin( performance.now() * 0.0004 ) * 200;
			camera.lookAt( scene.position );
			//
			renderer.render( scene, camera );
			Debug.stats.update();
		}

		
		

	} else { // --------------- --------------- --------------- draw LIVE mode ---------------
		


		User.absentFor = 0;
		User.readyAt( PARAM.presentWait, function(){ // if ready for 5 seconds, create new session
			if( !PARAM.autoDetectOverride ) KeyFrame.initDoc();
		});

		// Latency.reconnect( User );

		// save to db timer ---------------------------------------
		if( typeof KeyFrame.sessionId === "string" ){
			KeyFrame.updateTimer( 'progressBar', PARAM.keyFrameInterval );
			if( KeyFrame.loops % PARAM.keyFrameInterval === 0 ){ 
				KeyFrame.thumbCount++;
				KeyFrame.flashOpacity = 0.5;
					
				if (KeyFrame.thumbCount <= PARAM.keyFrameLimit || PARAM.keyFrameLimit === 0) {
					console.log('KEYFRAME SAVED');
					KeyFrame.saveKeyFrame(
						new Buffer( depth.data ).toString('base64'),
						frameDiff.canvas.toDataURL(),
						Motion.gate
					);	
					
					KeyFrame.saveThumbnail();
				} else {
					console.log('KEYFRAME NOT SAVED, COUNT IS ' + KeyFrame.thumbCount);
				}

				if (KeyFrame.thumbCount == 2 && PARAM.print) {
					CardPrinter.print(KeyFrame.sessionId);
				}

				KeyFrame.flash();
			}	
		}

		

		// update uniforms ----------------------------------------
		if(typeof wiremesh !== "undefined" &&  wiremesh.loaded){
			Motion.update( time, frameDiff.motion ); // update motion gate
			// canvTex.refresh();				// update canvas texture 
			webglTex.update( time/1000 );		// update webgl texture canvas

			wiremesh.mesh.material.uniforms.time.value = time;			
			wiremesh.mesh.material.uniforms.motion.value = frameDiff.motion;
			wiremesh.mesh.material.uniforms.motionGate.value = Motion.gate;		
			if( Motion.gate == 2 ) wiremesh.mesh.material.wireframe = false;
			else wiremesh.mesh.material.wireframe = true;
			
		}
		if(typeof pointcloud !== "undefined" && pointcloud.loaded){
			pointcloud.mesh.material.uniforms.time.value = time;
			pointcloud.mesh.material.uniforms.motion.value = frameDiff.motion;
			pointcloud.mesh.material.uniforms.motionFade.value = Motion.fade;
			pointcloud.mesh.material.uniforms.motionGate.value = Motion.gate;		
			pointcloud.mesh.material.uniforms.smoothMotion.value = Motion.smooth;		
		}
		diffTex.needsUpdate = true;

		//
		camera.position.x = Math.sin( performance.now() * 0.0004 ) * 200;
		camera.lookAt( scene.position );
		//
		renderer.render( scene, camera );
		Debug.stats.update();
	}

}





// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// --------------------------------------------------- MISC OBJS -------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------


// ------------ 
// ---------------------- ------ -- reKinect
// ------------ ----
// ---- ( disconnect/reconnect to daemon on new sessions to get around latency bug )


var Latency = {
	wait: false,
	reconnect: function( usr ){
		if( !this.wait && ( typeof usr =="undefined"||(usr.present && usr.presentFor < 1) ) ){

			var self = this;
			this.wait = true;
			
			socket.disconnect();
			console.log("Latency: disconnected from kinect-server")

			setTimeout(function(){
				if( socket.connected ){ self.reconnect(); }
				else {
					socket.connect();
					console.log("Latency: reconnected to kinect-server")
					setTimeout(function(){
						self.wait = false
					},1500);
				}
			},250);
		}
	}
}



// ------------ 
// ---------------------- ------ -- MOTION
// ------------ ----
// ---- ( >> smoothing && gates )



var Motion = {
	buffer:[0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0],
	debug: "",
	smoothBuff:[0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			// 0,0,0,0,0,0,0,0,0,0,
			// 0,0,0,0,0,0,0,0,0,0,
			// 0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0],
	prevGate: 0,
	fade: 0.0,
	isfading: false, 
	gate: 0,
	smooth: 0,
	update: function( time, motion ){
		var self = this;
		if( motion < 1.0 ){
			this.gate = this.setGate();
			this.smooth = this.setSmooth();
			//
			var d = Math.floor(time%this.buffer.length);
			if( motion > PARAM.motionThreshold2 ) this.buffer[d] = 2;
			else if( motion > PARAM.motionThreshold1 ) this.buffer[d] = 1;
			else this.buffer[d] = 0;
			//
			this.smoothBuff.push( motion );
			this.smoothBuff.shift();
			//
			if( this.gate > 0 ) this.fade = 1;
			if( this.gate==0 && this.prevGate==1  ){
				this.isfading = true;
				this.fade = 1;
			}
			if( this.isfading ) {
				this.fade -= 0.02;
				if( this.fade <= 0.0 ){
					this.isfading = false; 
					this.fade = 0;
				}
			}
			this.prevGate = this.gate;
		}
	},
	setGate: function(){
		var sum = this.buffer.reduce(function(a, b) { return a + b; });
		var avg = sum / this.buffer.length;
		var g = Math.round(avg);
		return g;
	},
	setSmooth: function(){
		var sum = this.smoothBuff.reduce(function(a, b) { return a + b; });
		var avg = sum / this.smoothBuff.length;
		return avg;
	}
}



// ------------ 
// ---------------------- ------ -- MONGOOSE
// ------------ ----
// ---- ( initial mongo db communication )


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:4004/byob'); 

// test connection ............
var db = mongoose.connection;
db.on('error',function(err){ console.log(err); });
db.once('open', function() { 
	// RUN THE SCENE !!! ---------------------
	console.log('connected to emerge mongodb');
	runApp();
});

// model: http://mongoosejs.com/docs/guide.html
var seshModel = require('./models/session');




// ------------ 
// ---------------------- ------ -- sessionReset
// ------------ ----
// ---- ( resets stuff for next User after wait period )

function sessionReset( wait ){
	User.absentFor += 1/60;
	if( User.absentFor > wait && User.readied ){
		KeyFrame.sessionId = null;
		User.readied = false;	
		KeyFrame.loops = -1;
		document.getElementById("progressBar1").style.width = "0px";
		document.getElementById("progressBar2").style.width = "0px";		
	}
}



// ------------ 
// ---------------------- ------ -- User Object
// ------------ ----
// ---- ( checks to see if user is present )


var User = {
	presentFor: 0,
	absentFor: 0,
	readied: false,
	present: false,
	threshold: PARAM.presenceBufferThresh,
	delta: 0,
	record:[0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0,
			0,0,0,0,0,0,0,0,0,0
	],
	lastFrame: null,
	detect: function( motion ){
		var self = this;
		this.delta++;
		if( this.delta >= this.record.length ) this.delta = 0;

		var places = 1000000;
		var mAvg = Math.floor(motion*places)/places;
		var lfAvg = Math.floor(this.lastFrame*places)/places;
		
		if( mAvg == lfAvg ) this.record[this.delta] = 0;
		else this.record[this.delta] = 1;		
		
		this.lastFrame = motion;

		if( this.checkRec() ){
			this.present = true;
			this.presentFor += 1/60;
		}
		else {
			this.present = false;	
			this.presentFor = 0;
		} 
	},
	checkRec: function(){
		var cnt = 0;
		for (var i = 0; i < this.record.length; i++) {
			if( this.record[i] == 1 ) cnt++;
		};
		if( cnt > this.threshold ) return true;
		else return false;
	},
	readyAt: function( sec, callback ){
		if( this.presentFor > sec && !this.readied ){
			callback();
			this.readied = true;
		}	
	}
}




// ------------ 
// ---------------------- ------ -- KeyFrame Object
// ------------ ----
// ---- ( handles db sessions, ie. creates docs && updates docs )


var KeyFrame = {
	loops: -1,
	sessionId: null,
	thumbCount: 0,
	flashOpacity: 0,
	flashElement: document.getElementById('flash'),
	initDoc: function(){
		if( this.sessionId === null ){
			this.thumbCount = 0;
			if( PARAM.saveData ){
				var self = this;
				var session = new seshModel();				

				session.save(function(err,doc){
					if(err && err.code==11000){
						console.log('error: duplicate id, trying again');
						self.initDoc(); 
						return;
					}
					else if(err) {
						console.log("error: "+err);
					} 
					else {
						self.sessionId = doc.id;
						console.log( doc.id + " was added to db!");							
					}
				});		

			} else {
				this.sessionId = "temp";	
			}		
		}
	},
	saveKeyFrame: function( dataString, diffDataURL, motionValue ){	
		var kfObj = {
			depthData: 		dataString,
			diffDataURL: 	diffDataURL,//frameDiff.canvas.toDataURL(),
			motionValue: 	motionValue//frameDiff.motion
		}
		var self = this;
		var query = { id: self.sessionId };
		var update = { $push: { keyFrames: kfObj } };
		var options = {upsert:true};

		if( PARAM.saveData && this.sessionId!=="temp"){
			seshModel.findOneAndUpdate( query, update, options, function(err){
				if(err) console.log(err);
				else console.log( "saved a " + self.sessionId + " frame");
			});			
		}


	},
	updateTimer: function( element, target ){
		this.loops++;
		var width = (window.innerWidth/target) * (this.loops%target);
		document.getElementById(element+"1").style.width = width + "px";
		document.getElementById(element+"2").style.width = width + "px";
	},
	// --
	saveThumbnail: function(){

		var self = this;
		var imgDataURL = renderer.domElement.toDataURL();
		var base64Data = imgDataURL.replace(/^data:image\/png;base64,/, "");
		
		if( PARAM.saveData && this.sessionId!=="temp"){
			fs.writeFile("../data/thumbnails/"+self.sessionId+"_"+self.thumbCount+".png", base64Data, 'base64', function(err) {
				if(err) console.log(err);
				else console.log('saved ../data/thumbnails/'+self.sessionId+'.png');
			});
		}

	},
	flash: function(){
		var self = this;
		this.flashOpacity -= 0.01;
		this.flashElement.style.opacity = this.flashOpacity;
		if(this.flashOpacity < 1 && this.flashOpacity > 0 ){
			setTimeout(function(){
				self.flash();
			},20);
		} 
		
	}
};



// ------------ 
// ---------------------- ------ -- IdleMode Object
// ------------ ----
// ---- ( queries db for random doc && generates keyframes for idle mode model )


var IdleMode = {
	//
	keyframes: [],
	// ...used in draw loop ....
	intervalAmt: 60 * 4, // ( 4sec * 60frames)
	frame: 0,
	counter: 0,
	motion: 0.001,
	mInc: 0.00001,
	mScale: 1,
	motionUpdate: function(){
		this.motion += this.mInc;
		if( this.motion > 0.002 || this.motion < 0.001 ) this.mInc = -this.mInc;
		if( this.keyframes[this.frame].motionValue > 1 ) this.mScale = 2;
		else this.mScale = 1;
	},
	str2Uint8Array: function( base64 ) {
		var bstr =  window.atob( base64 );
		var len = bstr.length;
		var arr = new Uint8Array( len );
		for (var i = 0; i < len; i++) arr[i] = bstr.charCodeAt(i);
		return arr;
	},
	init: function(){
		var self = this;
		seshModel.find({}, {"id":1,"_id":0}, function (err, doc) {
			if (err) { console.error(err); return; }
			else {
				var ran = Math.floor( Math.random()*doc.length );
				if( flaggedList.indexOf( doc[ran].id ) != -1 ){
					self.init();
				} else {
					self.load( doc[ran].id );	
				}
			}
		});
	},
	load: function( IDString ){
		var self = this;
		seshModel.findOne({ id: IDString }, function (err, doc) {
			if (err) { console.error(err); return; }
			// res.json({ data: doc });
			self.run( doc );
		});
	},
	run: function( data ){
		this.keyframes = [];
		for (var i = 0; i < data.keyFrames.length; i++) {
			var decodedArray = this.str2Uint8Array( data.keyFrames[i].depthData );
			this.keyframes.push({
				depthData: decodedArray,
				diffDataURL: data.keyFrames[i].diffDataURL,
				motionValue: data.keyFrames[i].motionValue
			});
		};
		this.frame = 0;
	}
}

var CardPrinter = {
	canvasImage: new Image(),
	printImage: new Image(),
	emergeLogo: new Image(),
	bbLogo: new Image(),
	// loadedImageCount: 0,
	canvas: null,
	context: null,
	init: function() {
		this.canvas = document.createElement('canvas');
		this.canvas.width = renderer.domElement.width;
		this.canvas.height = renderer.domElement.height;
		this.context = this.canvas.getContext('2d');
		this.emergeLogo.src = "http://localhost:8003/bbLogo.svg"; 
		this.bbLogo.src = "http://localhost:8003/emergeLogo.svg"
		this.emergeLogo.onload = this.onImageLoad;
		this.bbLogo.onload = this.onImageLoad;
	},
	print: function(id, callback) {
		var self = this;
		this.canvasImage.src = renderer.domElement.toDataURL('image/png');
		this.canvasImage.onload = function() {
			
			self.renderImage(id);
			var imgDataURL = self.canvas.toDataURL("image/jpeg");
			var base64Data = imgDataURL.replace(/^data:image\/jpeg;base64,/, "");
			if( PARAM.print){
				fs.writeFile("../data/prints/"+ id + ".jpg", 
					         base64Data, 
					         'base64', 
					         function(err) {
					if(err) console.log(err);
					else {
						self.sendToPrinter("../data/prints/"+ id + ".jpg");
					}
				});
			}
		}
	},
	sendToPrinter: function(filename) {
		var proc = spawn('../bin/send_to_printer.sh', [filename]);
		var errorText = ''
		proc.stdout.on('data', function(data){
			var str = data.toString();
			if (str.indexOf('Connection established') !== -1) {
				console.log('SENDING TO PRINTER');
			}
		});

		proc.stderr.on('data', function(data){
			errorText += data.toString();
		});

		proc.on('close', function(){
			if (errorText == '') {
				console.log('SENT TO PRINTER');
			} else {
				console.log('ERROR SENDING TO PRINTER:');
				console.log(errorText);
			}
		})
	},
	renderImage: function(id) {
		
		this.context.drawImage(this.canvasImage, 
							   0, 0, 
							   this.canvas.width, 
							   this.canvas.height);
	
		var logoSize = 75;
		var logoMargin = 25;
		
		this.context.drawImage(
					  this.emergeLogo, 
					  logoMargin, // account for printer not being margin accurate
					  logoMargin * 1.5, // ...
					  logoSize * 2, 
					  logoSize);

		this.context.drawImage(
			          this.bbLogo, 
					  logoMargin + logoSize + logoMargin, 
					  logoMargin * 1.5, 
					  logoSize * 2, 
					  logoSize);

		var url = PARAM.saveData ? 
			"emerge.brangerbriz.com/" + id : "emerge.brangerbriz.com";
		var fontSize = 42;
		this.context.font = fontSize + "px Arial";
		this.context.textBaseline = "middle";
		this.context.textAlign = "end";
		var textWidth = this.context.measureText(url).width;

		this.context.fillStyle = "#1E202F";
		var rectMargin = 5; // double this val on the left and right
		this.context.fillRect(
			         this.canvas.width - logoMargin * 2 - textWidth - rectMargin * 2, 
				     this.canvas.height - 60 - fontSize/2 - rectMargin,
				     textWidth + rectMargin * 4,
				     fontSize + rectMargin * 2);

		this.context.fillStyle = "#fff";
		this.context.fillText(url, 
			                  this.canvas.width - logoMargin * 2, 
			                  this.canvas.height - 60);
	}
};

// ------------ 
// ---------------------- ------ -- Debug Obj
// ------------ ----
// ---- ( toggle debug view / update debug text )

var Debug = {
	element: null,
	stats: null,
	axes: null,
	canvas: null,
	gui: null,
	init: function(){
		this.element = document.getElementById('debug');
		//
		this.stats = new Stats();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '90px';
		this.stats.domElement.style.width = "100px";
		this.stats.domElement.style.display = "none";
		document.body.appendChild( this.stats.domElement );
		//
		this.axes = new THREE.AxisHelper(150);
		this.axes.material.transparent = true;
		this.axes.material.opacity = 0.0;
		scene.add(this.axes);
		//
		this.canvas = depth.canvas;
		this.canvas.style.position = "absolute";
		this.canvas.style.display = "none";
		this.canvas.style.width = "100px";
		document.body.appendChild(this.canvas);
		//
		// this.makeGui();
	},
	toggle: function( status ){
		if(this.canvas.style.display=='none') this.toggleOn();
		else this.toggleOff();	
	},
	toggleOn: function(){
		this.element.style.display = 'block';
		// document.querySelector('div.dg').style.display = 'block';
		this.canvas.style.display = 'block';
		this.stats.domElement.style.display = 'block';
		this.axes.material.opacity = 1.0;
	},
	toggleOff: function(){
		this.element.style.display = 'none';
		// document.querySelector('div.dg').style.display = 'none';
		this.canvas.style.display = 'none';
		this.stats.domElement.style.display = 'none';
		this.axes.material.opacity = 0.0;
	},
	update: function(){
		this.element.innerHTML = (PARAM.autoDetectOverride) ? "autoDetectOverride On" : "autoDetectOverride Off";
		this.element.innerHTML += "<br><br>";
		this.element.innerHTML += "motionGate: "+Motion.gate+"<br>";
		this.element.innerHTML += "motion.fade: "+Motion.fade+"<br>";
		this.element.innerHTML += "<br><br>";
		this.element.innerHTML += "presence buff threshold: " + PARAM.presenceBufferThresh +"<br><br>";
		this.element.innerHTML += (User.present) ? "PRESENT" : "ABSENT"
		this.element.innerHTML += " -- sesh: "+KeyFrame.sessionId+"<br>";
		if( User.present ){
			this.element.innerHTML += "wait-time: "+PARAM.presentWait+"<br>";
			this.element.innerHTML += "presentFor: "+ Math.floor(User.presentFor)+"<br>";
		} else {
			this.element.innerHTML += "wait-time: "+PARAM.absentWait+"<br>";
			this.element.innerHTML += "absentFor: "+ Math.floor(User.absentFor)+"<br>";		
		}		
		// this.element.innerHTML += "motion: "+ depth.getDepthLvl();  +"<br>"
	},
	makeGui: function(){
		var self = this;
		if( wiremesh.loaded && (this.gui==null||typeof this.gui=="undefined") ){
			this.gui = new dat.GUI(); 
			// this.gui.add( wiremesh.mesh.material, 'wireframe');
			// this.gui.add( wiremesh.mesh.material, 'wireframeLinewidth', 0.0, 10.0).step(0.25);
			this.gui.add( pointcloud.mesh.material.uniforms.param1, 'value', 0.1, 100.0 ).step(0.1).name('speed');
			this.gui.add( pointcloud.mesh.material.uniforms.param2, 'value', 5.0, 50.0 ).step(0.1).name('amount');
			// this.gui.domElement.style.display = "none";
			document.querySelector('div.dg').style.zIndex = 9999999;	
		} else {
			setTimeout( self.makeGui, 500 );
		}
	}
}








// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// --------------------------------------------- runApp // closeApp ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------

function runApp(){
	if( socket.connected && IdleMode.keyframes.length > 0 ){
		console.log('connected to kinect-server');
		
		setup();			// set up scene && events
		draw();				// start the draw loop
	
	} else if( socket.connected && IdleMode.keyframes.length <= 0 ){
	
		IdleMode.init();	// set up initial idle mode data 
		console.log('...waiting on IdleMode data');
		setTimeout( runApp, 500 );
	
	} else if( !socket.connected && IdleMode.keyframes.length > 0){

		console.log('...waiting on kinect-daemon');
		setTimeout( runApp, 500 );
	}
	else {
		console.log('...waiting on kinect-daemon && IdleMode data');
		setTimeout( runApp, 500 );
	}
}



function closeApp(){
	if( mongoose.connection.readyState ){
		mongoose.disconnect();
		setTimeout( closeApp, 500 );
	} else {
		win.close();
	}
}

