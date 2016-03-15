var nw = require('nw.gui');
var win = nw.Window.get();
var socket = io.connect('http://localhost:8008');




// THREE JS STUFFS ------------------------------------------------------------

var scene, camera, renderer; 
var gui, stats, axes;
var depth, wiremesh, pointcloud, frameDiff, diffTex;
var clearColor = 0x000000;

var mouseX = 0, mouseY = 0, mouseZ = 400;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function setup() {

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( clearColor );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute';
	renderer.domElement.style.left = '0px';
	renderer.domElement.style.top = '0px';
	document.body.appendChild( renderer.domElement );

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, 400 );

	// // timer mesh
	// var shape = new THREE.Shape();
	// shape.absarc( 0, 0, 200, 0, Math.PI*2, false );
	// var cutout = new THREE.Path();
	// cutout.absarc( 0, 0, 180, 0, Math.PI*2, true );
	// shape.holes.push( cutout );
	// var geometry = new THREE.ShapeGeometry( shape );
	// var material = new THREE.MeshBasicMaterial({shading: THREE.FlatShading, color: 0xffffff, transparent: true, opacity: 0.22});
	// timermesh = new THREE.Mesh( geometry, material );
	// timermesh.position.set( 0,0,-200 );
	// scene.add( timermesh );
	

	// frame differencing -----------------------------------
	frameDiff = new FrameDifference(640, 480);
	diffTex = new THREE.Texture(frameDiff.canvas);
	diffTex.minFilter = THREE.NearestFilter;
	diffTex.needsUpdate = true;

	// kinect data + meshes ---------------------------------
	
	depth = new DepthFromKinect();	
	
	wiremesh = new MeshFromDepth({
		depthData: depth.canvas,
		scene: scene,
		vertexShader: '../share/shaders/glazewire-v.glsl',
		fragmentShader: '../share/shaders/glazewire-f.glsl',
		type: 'mesh',
		wireframe: true,
		polycount: 20,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "motion", type:"f", value: 1.0 },			
			{ name: "param1", type:"f", value: 0.2 },
			{ name: "param2", type:"f", value: 0.2 },
			{ name: "param3", type:"f", value: 0.2 },			
			// { name: "canvTex", type:"t", value: CanvTex(10) },
			{ name: "diffTex", type: "t", value: diffTex }
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
			{ name: "diffTex", type: "t", value: diffTex }
		]
	});

	socket.on('kinect-depth', function(data) {
		
		var d = new Uint8ClampedArray(data);
		depth.updateCanvasData(d);
		frameDiff.addFrame(depth.imageData.data);

		wiremesh.update();
		pointcloud.update();

	});



	// ----------------------- helpers ----------------------- debug ----------------------- 
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
				gui.domElement.style.display = canvas.style.display = stats.domElement.style.display = 'block';
				axes.material.opacity = 1.0;
			} else { 
				gui.domElement.style.display = canvas.style.display = stats.domElement.style.display = 'none';
				axes.material.opacity = 0.0;
			}
		}

		if(e.keyCode == 100 ){  

			KeyFrame.initDoc();

		} // D

		if(e.keyCode == 102 ){  

			KeyFrame.saveKeyFrame(
				new Buffer( depth.data ).toString('base64'),
				frameDiff.canvas.toDataURL(),
				frameDiff.motion
			);

		} // F

		if(e.keyCode == 17)  closeApp(); // cntrl + Q
		if(e.keyCode == 6 ) (win.isKioskMode) ? nw.Window.get().leaveKioskMode() : nw.Window.get().enterKioskMode(); // cntrl + F
		if(e.keyCode == 7) (document.body.style.cursor=="") ? document.body.style.cursor = "none" : document.body.style.cursor = ""; // cntrl + G
	}

	document.addEventListener( 'mousemove',function(){
		mouseX = ( event.clientX - windowHalfX );
		mouseY = ( event.clientY - windowHalfY );
		mouseZ = event.clientX;
	}, false );

	window.onresize = function() {
		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}
	window.onresize();
}


function draw() {
	requestAnimationFrame(draw);
	var time = performance.now();

	// check connection
	if( !(mongoose.connection.readyState) ) console.log('no db connected!');
	

	// save to db logic ---------------------------------------
	// KeyFrame.saveEvery( 120 ); // save every 120 frames
	// KeyFrame.save( depth.data, dFrames );
	// if( typeof depth.data.buffer !== "undefined")
	// var x = new Uint16Array(10);
	// KeyFrame.saveFrameToDB( ab2str(x.buffer) );


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


	// control camera ( replace w/auto rotate for mobile )
	camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
	// var z = (mouseZ<=windowHalfX) ? windowHalfX-mouseZ : mouseZ-windowHalfX;
	// camera.position.z = BB.MathUtils.map( z, 0, windowHalfX, 200, 400 );
	camera.lookAt( scene.position );
	
	//
	renderer.render( scene, camera );
	stats.update();
}



// ------------ 
// ---------------------- ------ -- MISC 
// ------------ ----
// ----


function makeGui(){
	if( wiremesh.loaded ){
		gui = new dat.GUI(); 
		gui.add( wiremesh.mesh.material.uniforms.param1, 'value', 0.0, 360.0).step(0.1).name('param1');
		gui.add( wiremesh.mesh.material.uniforms.param2, 'value', 0.0, 360.0).step(0.1).name('param2');
		gui.add( wiremesh.mesh.material.uniforms.param3, 'value', 0.0, 1.0 ).step(0.1).name('param3');
		gui.domElement.style.display = "none";
		gui.domElement.style.zIndex = 100;	
	} else {
		setTimeout( makeGui, 500 );
	}
}


// ---------------------------------------


var KeyFrame = {
	loops: 0,
	sessionId: null,
	saveEvery: function( count ){
		if( this.loops % count === 0 ){
			this.saveKeyFrame( new Buffer( depth.data ).toString('base64') );	
		}
		this.loops++;
	},
	initDoc: function(){
		var self = this;
		var session = new seshModel();

		session.save(function(err,doc){
			if(err) console.log("error: "+err);
			else {
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
		});

		// seshModel.findOneAndUpdate(
		// 	{ id: self.sessionId },
		// 	{ $push: {keyFrames: {depthData:dataString} } }
		// );
	}
};



// ------------ 
// ---------------------- ------ --
// ------------ ----
// ----



// -------------------------------------
// ----------- MONGO + mongoos ---------
// -------------------------------------


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


// --------------------------------------------------------------------------

function runApp(){
	if( socket.connected ){
		console.log('connected to kinect-server');
		setup();
		draw();
		makeGui();
	} else {
		console.log('...waiting for socket connection to kinect-server');
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

