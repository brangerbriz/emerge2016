var nw = require('nw.gui');
var win = nw.Window.get();
var socket = io.connect('http://localhost:8008');
var fs = require("fs");




// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ------------------------------------------------ THREE.JS STUFFS ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------

var scene, camera, renderer; 
var debug, gui, stats, axes;
var depth, wiremesh, pointcloud, frameDiff, diffTex, flowField, flowTex; // live vars
var idleDepth, idleDiffCanv, idleDiffCtx, idleDiffTex, idleDiffImg; // idle vars
var clearColor = 0x1E202F;

// 																							 _____________
//__________________________________________________________________________________________/   SETUP     \
//																										  |
//________________________________________________________________________________________________________|
function setup() {

	renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
	renderer.setClearColor( clearColor );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.left = '0px';
	renderer.domElement.style.top = '0px';
	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	sceneIdle = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, 400 );



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
			{ name: "motion", type:"f", value: 1.0 },
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
			{ name: "motion", type:"f", value: 1.0 },
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
			{ name: "param1", type:"f", value: 0.2 },
			{ name: "param2", type:"f", value: 0.2 },
			{ name: "param3", type:"f", value: 0.2 },
			// { name: "canvTex", type:"t", value: CanvTex(10) },
			// { name: "whichTex", type:"f", value: 1.0 },
			{ name: "diffTex", type: "t", value: diffTex },
			// { name: "idleDiffTex", type: "t", value: idleDiffTex },
			// { name: "flowTex", type: "t", value: flowTex }
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
			{ name: "diffTex", type: "t", value: diffTex },
			// { name: "flowTex", type: "t", value: flowTex }
		]
	});

	socket.on('kinect-depth', function(data) {
		
		var d = new Uint8ClampedArray(data);
		depth.updateCanvasData(d);
		frameDiff.addFrame(depth.imageData.data);
		//flowField.addFrame(depth.imageData.data)
		wiremesh.update();
		pointcloud.update();

	});



	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ helpers / debug
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ helpers / debug
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ helpers / debug
	debug = document.getElementById('debug');
	//
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '90px';
	stats.domElement.style.width = "100px";
	stats.domElement.style.display = "none";
	document.body.appendChild( stats.domElement );
	//
	axes = new THREE.AxisHelper(150);
	axes.material.transparent = true;
	axes.material.opacity = 0.0;
	scene.add(axes);
	//
	var canvas = depth.canvas;
	canvas.style.position = "absolute";
	canvas.style.display = "none";
	canvas.style.width = "100px";
	document.body.appendChild(canvas);


	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  controls
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  controls
	// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~  ~ ~ ~ ~ ~  controls

	/*
		+	: zoom camera in
		-	: zoom camera out
		}	: rotate mesh this way
		{	: rotate mesh that way
		C 	: change bg color
		S 	: toggle stats
		D 	: save to database 

		ctrl + Q 	: quote
		ctrl + F 	: toggle kiosk mode
		ctrl + G 	: toggle hide mouse
	 */
	document.onkeypress = function(e){
		var e = window.event || e;
		// console.log(e.keyCode)

		if(e.keyCode==61) camera.position.z -= 25;	// +
		if(e.keyCode==45) camera.position.z += 25;	// -

		if(e.keyCode == 99 ){ // C ( to change background color )
			clearColor = (clearColor==0xffffff) ? 0x000000 : 0xffffff;
			renderer.setClearColor( clearColor );
		}
		if(e.keyCode == 115 ){ // S ( to toggle stats )
			if(canvas.style.display=='none'){
				debug.style.display = /*gui.domElement.style.display = */
					canvas.style.display = stats.domElement.style.display = 'block';
				axes.material.opacity = 1.0;
			} else { 
				debug.style.display = /*gui.domElement.style.display = */
					canvas.style.display = stats.domElement.style.display = 'none';
				axes.material.opacity = 0.0;
			}
		}

		if(e.keyCode == 100 ){  

			// debug.innerHTML = frameDiff.motion ;
			// document.body.appendChild(frameDiff.canvas);
			// KeyFrame.initDoc();
			// IdleMode.init();


		} // D

		if(e.keyCode == 102 ){  

			var dframe = frameDiff.canvas;
			dframe.style.position="absolute";
			dframe.style.zIndex = 1999;
			document.body.appendChild(dframe);

			// KeyFrame.saveKeyFrame(
			// 	new Buffer( depth.data ).toString('base64'),
			// 	frameDiff.canvas.toDataURL(),
			// 	frameDiff.motion
			// );

		} // F

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
}


var doIdle = true;

// 																							 _____________
//__________________________________________________________________________________________/ DRAW LOOP   \
//																										  |
//________________________________________________________________________________________________________|
function draw() { 
	requestAnimationFrame(draw);

	var time = performance.now();

	// check connection
	if( !(mongoose.connection.readyState) ) console.log('no db connected!');
	

	User.detect( frameDiff.motion );


	if( !User.present ){ // --------------- --------------- ---- draw IDLE mode ---------------

		debug.innerHTML = ": no user";
		
		if( idleWiremesh.loaded && idlePointcloud.loaded ){
			idleWiremesh.mesh.material.uniforms.time.value = time;
			idlePointcloud.mesh.material.uniforms.time.value = time;	
			idlePointcloud.mesh.material.uniforms.motion.value += 0.25/IdleMode.intervalAmt;
		}
		// switch frames
		IdleMode.counter++;
		if( IdleMode.counter % IdleMode.intervalAmt  == 0 ){ // approx every 4 seconds 
			IdleMode.frame++; 
			if(IdleMode.frame>=IdleMode.keyframes.length) {
				IdleMode.init();
				IdleMode.frame = 0;
			}

			debug.innerHTML = IdleMode.frame;
			
			idleDepth.crossFadeCanvasData( IdleMode.keyframes[IdleMode.frame].depthData, 1000 );
			
			idlePointcloud.mesh.material.uniforms.motion.value = IdleMode.keyframes[IdleMode.frame].motionValue;
			
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
		stats.update();


	} else { // --------------- --------------- --------------- draw LIVE mode ---------------


		debug.innerHTML = ": user present";

		// save to db timer ---------------------------------------
		if( typeof KeyFrame.sessionId === "string" ){
			KeyFrame.updateTimer( 'progressBar', 240 );
			if( KeyFrame.loops % 240 === 0 ){ // save every 240 frames
				KeyFrame.saveKeyFrame(
					new Buffer( depth.data ).toString('base64'),
					frameDiff.canvas.toDataURL(),
					frameDiff.motion
				);	
				KeyFrame.saveThumbnail();
			}	
		}

		// update uniforms ----------------------------------------
		if(typeof wiremesh !== "undefined" &&  wiremesh.loaded){
			wiremesh.mesh.material.uniforms.time.value = time;
			// pointcloud.mesh.material.uniforms.motion.value = frameDiff.motion;
		}
		if(typeof pointcloud !== "undefined" && pointcloud.loaded){
			pointcloud.mesh.material.uniforms.time.value = time;
			pointcloud.mesh.material.uniforms.motion.value = frameDiff.motion;
		}
		diffTex.needsUpdate = true;

		//
		camera.position.x = Math.sin( performance.now() * 0.0004 ) * 200;
		camera.lookAt( scene.position );
		//
		renderer.render( scene, camera );
		stats.update();
	}




}






// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// --------------------------------------------------- MISC OBJS -------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------




// ------------ 
// ---------------------- ------ -- DAT GUI
// ------------ ----
// ----( for debuging )


function makeGui(){
	if( wiremesh.loaded ){
		gui = new dat.GUI(); 
		gui.add( wiremesh.mesh.material.uniforms.param1, 'value', 0.0, 360.0).step(0.1).name('param1');
		gui.add( wiremesh.mesh.material.uniforms.param2, 'value', 0.0, 360.0).step(0.1).name('param2');
		gui.add( wiremesh.mesh.material.uniforms.param3, 'value', 0.0, 1.0 ).step(0.1).name('param3');
		gui.domElement.style.display = "none";
		gui.domElement.style.zIndex = 100;	
	} else {
		// setTimeout( makeGui, 500 );
	}
}


// ------------ 
// ---------------------- ------ -- User Object
// ------------ ----
// ---- ( checks to see if user is present )


var User = {
	present: false,
	threshold: 15,
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

		if( this.checkRec() ) this.present = true;
		else this.present = false;
	},
	checkRec: function(){
		var cnt = 0;
		for (var i = 0; i < this.record.length; i++) {
			if( this.record[i] == 1 ) cnt++;
		};
		if( cnt > this.threshold ) return true;
		else return false;
	}
}





// ------------ 
// ---------------------- ------ -- MONGOOSE
// ------------ ----
// ---- ( initial mongo db communication )


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/emerge'); 

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
// ---------------------- ------ -- IdleMode Object
// ------------ ----
// ---- ( queries db for random doc && generates keyframes for idle mode model )


var IdleMode = {
	// ...used in draw loop ....
	intervalAmt: 60 * 4, // ( 4sec * 60frames)
	frame: 0,
	counter: 0,
	//
	keyframes: [],
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
				self.load( doc[ran].id );
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
		var self = this;
		var session = new seshModel();

		session.save(function(err,doc){
			if(err) {
				console.log("error: "+err);
			} else {
				self.sessionId = doc.id;
				console.log( doc.id + " was added to db!");
			}
		});

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

		seshModel.findOneAndUpdate( query, update, options, function(err){
			if(err) console.log(err);
			else console.log( "saved a " + self.sessionId + " frame");
		});

	},
	updateTimer: function( element, target ){
		this.loops++;
		var width = (window.innerWidth/target) * (this.loops%target);
		document.getElementById(element).style.width = width + "px";
	},
	// --
	saveThumbnail: function(){
		this.thumbCount++;
		this.flashOpacity = 1.0;

		var self = this;
		var imgDataURL = renderer.domElement.toDataURL();
		var base64Data = imgDataURL.replace(/^data:image\/png;base64,/, "");
		
		fs.writeFile("../data/thumbnails/"+self.sessionId+"_"+self.thumbCount+".png", base64Data, 'base64', function(err) {
			if(err) console.log(err);
			else console.log('saved ../data/thumbnails/'+self.sessionId+'.png');
		});

		this.flash();
	},
	flash: function(){
		var self = this;
		this.flashOpacity-=0.1;
		this.flashElement.style.opacity = this.flashOpacity;
		if(this.flashOpacity<1){
			setTimeout(function(){
				self.flash();
			},20);
		} 
		
	}
};











// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// --------------------------------------------- runApp // closeApp ----------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------

function runApp(){
	if( socket.connected && IdleMode.keyframes.length > 0  ){
		console.log('connected to kinect-server');
		
		setup();			// set up scene && events
		draw();				// start the draw loop
		makeGui();			// make the gui ( hidden away w/stats+helpers )
		
		// create new database document 
		// setTimeout(function(){
		// 	KeyFrame.initDoc();
		// },1000);
	
	} else if( socket.connected && IdleMode.keyframes.length <= 0){
	
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

