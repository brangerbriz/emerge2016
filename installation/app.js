var nw = require('nw.gui');
var win = nw.Window.get();
var socket = io.connect('http://localhost:8008');




// THREE JS STUFFS ------------------------------------------------------------

var scene, camera, renderer; 
var stats, axes, depth, knct, knct2, frameDiff, diffTex;
var clearColor = 0x000000;

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
	camera.position.set( 0, 0, 650 );

	// frame differencing -----------------------------------
	frameDiff = new FrameDifference(640, 480);
	diffTex = new THREE.Texture(frameDiff.canvas);
	diffTex.minFilter = THREE.NearestFilter;
	diffTex.needsUpdate = true;

	// kinect data + meshes ---------------------------------
	
	depth = new DepthFromKinect();	

	// knct = new MeshFromDepth({
	// 	depthData: depth.canvas,
	// 	scene: scene,
	// 	polycount: 10,
	// 	vertexShader: '../share/shaders/mesh-vertex.glsl',
	// 	fragmentShader: '../share/shaders/mesh-fragment.glsl',
	// 	type: 'mesh',
	// 	uniforms: [
	// 		{ name: "time", type:"f", value: 1.0 },
	// 		{ name: "canvTex", type:"t", value: canvTex(10) }
	// 	]
	// });
	
	// knct2 = new MeshFromDepth({
	// 	depthData: depth.canvas,
	// 	scene: scene,
	// 	vertexShader: '../share/shaders/point-vertex.glsl',
	// 	fragmentShader: '../share/shaders/point-fragment.glsl',
	// 	type: 'point',
	// 	polycount: 100,
	// 	pointsize: 2,
	// 	uniforms: [
	// 		{ name: "time", type:"f", value: 1.0 }
	// 	]
	// });
	
	knct = new MeshFromDepth({
		depthData: depth.canvas,
		scene: scene,
		vertexShader: '../share/shaders/glazewire-v.glsl',
		fragmentShader: '../share/shaders/glazewire-f.glsl',
		type: 'mesh',
		wireframe: true,
		polycount: 20,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "diffTex", type: "t", value: diffTex}
		]
	});

	knct2 = new MeshFromDepth({
		depthData: depth.canvas,
		scene: scene,
		// fragmentShaderID: 'fs',
		// vertexShaderID: 'vs',
		vertexShader: '../share/shaders/huepoints-v.glsl',
		fragmentShader: '../share/shaders/huepoints-f.glsl',				
		type: 'point',
		polycount: 100,
		uniforms: [
			{ name: "time", type:"f", value: 0.0 },
			{ name: "pmax", type:"f", value: 1.0 },
			{ name: "resthresh", type:"f", value: 1.0 }
		]
	});

	socket.on('kinect-depth', function(data) {
		
		var d = new Uint8ClampedArray(data);
		depth.updateCanvasData(d);
		frameDiff.addFrame(depth.imageData.data);

		knct.update();
		knct2.update();

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

		if( typeof knct2 !== 'undefined' && typeof knct !== "undefined"){ // { and }
			if(e.keyCode==93) knct.mesh.rotation.y = knct2.mesh.rotation.y = axes.rotation.y += 0.2;
			if(e.keyCode==91) knct.mesh.rotation.y = knct2.mesh.rotation.y = axes.rotation.y -= 0.2;
		} else if( typeof knct !== 'undefined') {
			if(e.keyCode==93) knct.mesh.rotation.y = axes.rotation.y += 0.2;
			if(e.keyCode==91) knct.mesh.rotation.y = axes.rotation.y -= 0.2;
		} else {
			if(e.keyCode==93) knct2.mesh.rotation.y = axes.rotation.y += 0.2;
			if(e.keyCode==91) knct2.mesh.rotation.y = axes.rotation.y -= 0.2;
		}

		if(e.keyCode == 99 ){ // C ( to change background color )
			clearColor = (clearColor==0xffffff) ? 0x000000 : 0xffffff;
			renderer.setClearColor( clearColor );
		}
		if(e.keyCode == 115 ){ // S ( to toggle stats )
			if(canvas.style.display=='none'){
				canvas.style.display = stats.domElement.style.display = 'block';
				axes.material.opacity = 1.0;
			} else { 
				canvas.style.display = stats.domElement.style.display = 'none';
				axes.material.opacity = 0.0;
			}
		}

		if(e.keyCode == 100 ){  

			KeyFrame.initDoc();

		} // D

		if(e.keyCode == 102 ){  

			KeyFrame.saveKeyFrame( new Buffer( depth.data ).toString('base64') );

		} // F

		if(e.keyCode == 17)  closeApp(); // cntrl + Q
		if(e.keyCode == 6 ) (win.isKioskMode) ? nw.Window.get().leaveKioskMode() : nw.Window.get().enterKioskMode(); // cntrl + F
		if(e.keyCode == 7) (document.body.style.cursor=="") ? document.body.style.cursor = "none" : document.body.style.cursor = ""; // cntrl + G
	}

	window.onresize = function() {
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
	if(typeof knct !== "undefined" &&  knct.loaded){
		knct.mesh.material.uniforms.time.value = time;
		diffTex.needsUpdate = true;
	}
	if(typeof knct2 !== "undefined" && knct2.loaded){
		knct2.mesh.material.uniforms.time.value = time;
		knct2.mesh.material.uniforms.pmax.value = 
			BB.MathUtils.clamp(
				BB.MathUtils.map(frameDiff.motion, 0.0001, 0.003, 0.0, 15.0),
				0.0,
				15.0);
		// console.log(frameDiff.motion);
	}
	
	//
	renderer.render( scene, camera );
	stats.update();
}



// ------------ 
// ---------------------- ------ -- MISC 
// ------------ ----
// ----




// texture from canvas to be used as a uniform sampler2D
function canvTex( polycount ){
	// // ~~~~~~~ load custom image file as texture ~~~~~~~
	// var clrBox = new THREE.TextureLoader().load( 'images/colorbox.jpg' );
	// clrBox.wrapS = THREE.RepeatWrapping;
	// clrBox.wrapT = THREE.RepeatWrapping;
	// clrBox.repeat.set( 4, 4 );
	
	// ~~~~~~~ create a random color grid based on polycount via canvas ~~~~~~~
	var canvas = document.createElement('canvas');
		canvas.width = 640;
		canvas.height = 480;
	var dx = canvas.width/polycount;
	var dy = canvas.height/polycount;
	var ctx = canvas.getContext( '2d' );
	
	// // squares
	// for (var y = 0; y < polycount; y++) {
	// 	for (var x = 0; x < polycount; x++) {
	// 		ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
	// 		ctx.fillRect(x*dx,y*dy,dx,dy);
	// 	};
	// };
	
	// triangles
	for (var y = 0; y < polycount; y++) {
		for (var x = 0; x < polycount; x++) {
			ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
			var X = x*dx;
			var Y = y*dy;
			ctx.beginPath();
			ctx.moveTo( X, Y );
			ctx.lineTo( X+dx, Y );
			ctx.lineTo( X, Y+dy );
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
			ctx.beginPath();
			ctx.moveTo( X+dx, Y );
			ctx.lineTo( X+dx, Y+dy );
			ctx.lineTo( X, Y+dy );
			ctx.closePath();
			ctx.fill();
		};
	};	

	var clrBox = new THREE.Texture( canvas );
		clrBox.minFilter = THREE.NearestFilter;
		clrBox.needsUpdate = true;

	return clrBox;
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
	saveKeyFrame: function( dataString ){	
		var self = this;
		var query = { id: self.sessionId };
		var update = { $push: { keyFrames: {depthData:dataString} } };
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

