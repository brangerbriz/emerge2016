var socket = io.connect('http://localhost:8008');

function setup() {

	// frame differencing -----------------------------------
	frameDiff = new FrameDifference(640, 480);
	depth = new DepthFromKinect();
	document.body.appendChild(frameDiff.canvas);

	socket.on('kinect-depth', function(data) {
		var d = new Uint8ClampedArray(data);
		depth.updateCanvasData(d);
		frameDiff.addFrame(depth.imageData.data);
	});
}

setup();