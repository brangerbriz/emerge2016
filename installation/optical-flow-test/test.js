var socket = io.connect('http://localhost:8008');

var width = 640;
var height = 480;

var flowField = new OpticalFlowField(width, height, 10, true);

var gui = new dat.GUI();
gui.add(flowField, 'cutoff', 500, 2000 ).name('Cutoff');

socket.on('kinect-depth', function(data) {
	var d = new Uint8ClampedArray(data);
	// unlike FrameDifference.addFrame(), OpticalFlowField.addFrame()
	// must take a Uint8ClampedArray not an ImageData.data.
	flowField.addFrame(d);
	document.getElementById('u-val').innerHTML = flowField.u;
	document.getElementById('v-val').innerHTML = flowField.v;
});


