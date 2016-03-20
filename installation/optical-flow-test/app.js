var socket = io.connect('http://localhost:8008');
var guiObj = { cutoff: 1000 };
var gui; 

var toDegree = 180 / Math.PI;
function fromArgb(a, r, g, b) {
    return 'rgba(' + [r, g, b, a/255].join(',') + ')';
}
function convertHsvToRgb(h, s, v) {
    var a, b, c, d, hueFloor;
    h = h / 360;
    if (s > 0) {
        if (h >= 1) {
            h = 0;
        }
        h = 6 * h;
        hueFloor = Math.floor(h);
        a = Math.round(255 * v * (1.0 - s));
        b = Math.round(255 * v * (1.0 - (s * (h - hueFloor))));
        c = Math.round(255 * v * (1.0 - (s * (1.0 - (h - hueFloor)))));
        d = Math.round(255 * v);

        switch (hueFloor) {
            case 0: return fromArgb(255, d, c, a);
            case 1: return fromArgb(255, b, d, a);
            case 2: return fromArgb(255, a, d, c);
            case 3: return fromArgb(255, a, b, d);
            case 4: return fromArgb(255, c, a, d);
            case 5: return fromArgb(255, d, a, b);
            default: return fromArgb(0, 0, 0, 0);
        }
    }
    d = v * 255;
    return fromArgb(255, d, d, d);
}

function getDirectionalColor(x, y) {
    var hue = (Math.atan2(y, x) * toDegree + 360) % 360;
    return convertHsvToRgb(hue, 1, 1);
}

function setup() {

	var width = 640;
	var height = 480;
	// frame differencing -----------------------------------
	// flowField = new OpticalFlowField(width, height);
	// depth = new DepthFromKinect();
	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	var context = canvas.getContext('2d');
	// document.body.appendChild(canvas);
	var imageData = context.createImageData(width, height);

	gui = new dat.GUI();
	gui.add(guiObj, 'cutoff', 500, 2000 ).name('Cutoff');

	socket.on('kinect-depth', function(data) {
		var d = new Uint8ClampedArray(data);

		var i = 0;
		for (var y = 0; y < 480; y++) {
			for (var x = 0; x < 640; x++) {
				var val = d[i+1] << 8 | d[i];
				var j = (x + y * width) * 4;
				var val = BB.MathUtils.map(val, 0, guiObj.cutoff, 255, 0);
				imageData.data[j + 0] = val;
				imageData.data[j + 1] = val;
				imageData.data[j + 2] = val;
				imageData.data[j + 3] = 255;
				
				i+=2;
			}
		}
		
		context.putImageData(imageData, 0, 0);
		// depth.updateCanvasData(d);
		// flowField.addFrame(depth.imageData.data);
	});

	var zoneSize = 8;
    var canvasFlow = new oflow.CanvasFlow(canvas, zoneSize);
    var flowCanvas = document.createElement('canvas');
    flowCanvas.width = width;
    flowCanvas.height = height;
    var flowContext = flowCanvas.getContext('2d');
    document.body.appendChild(flowCanvas);

    var outCanvas = document.createElement('canvas');
    outCanvas.width = Math.floor(width / (zoneSize * 2 - 1));
    outCanvas.height = Math.floor(height / (zoneSize * 2 - 1));
    console.log('out canv size', outCanvas.width, outCanvas.height);
    var outContext = outCanvas.getContext('2d');
    outCanvas.style.width = '155px';
    outCanvas.style.height = '120px';
    document.body.appendChild(outCanvas);
    // var outData = new ImageData();
    // outData.width = outCanvas.width;
    // outData.height = outCanvas.height;

    canvasFlow.onCalculated( function (direction) {
        
        // render zones
        flowContext.fillStyle = '#000';
        flowContext.fillRect(0, 0, canvas.width, canvas.height);
        
        outContext.fillStyle = "#fff";
        outContext.fillRect(0, 0, outCanvas.width, outCanvas.height);

        for(var i = 0; i < direction.zones.length; ++i) {
           
           // fill flow debug context
            var zone = direction.zones[i];
            var color = getDirectionalColor(zone.u, zone.v);
            // flowContext.strokeStyle = color;
            // flowContext.beginPath();
            // flowContext.moveTo(zone.x,zone.y);
            // flowContext.lineTo((zone.x - zone.u), zone.y + zone.v);
            
            // flowContext.stroke();

            // fill difference texture
            // for some reason empty background fills red, switch this to black
            // if (color === 'rgba(255,0,0,1)') color = 'rgba(0,0,0,1)';
           
            var dist = BB.MathUtils.map((zone.u + zone.v) / 2, 0, zoneSize * 2 + 1, 0.0, 1.0);
            // var dist = vec.distanceTo(new BB.Vector2(zone.u, zone.v)) // / Math.floor(zoneSize * 2 + 1);
          	// var dist = BB.MathUtils.map(((new BB.Vector2(zone.u - zone.x, zone.v - zone.y)).length() % zoneSize * 2 + 1), 0, 17, 0.0, 1.0);
          	// if (dist < 0.1) console.log(dist);
          	// dists.push(dist);
           	color = color.split(',');
           	color[color.length - 1] = dist + ')';
			color = color.join(',')

            outContext.fillStyle = color;
            outContext.fillRect(zone.x / (canvas.width / outCanvas.width),
            					zone.y / (canvas.height / outCanvas.height), 1, 1);
        }
        
    });
	
    canvasFlow.startCapture();
}

setup();

