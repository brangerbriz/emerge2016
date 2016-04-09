importScripts('../share/BB.min.js');

var imageFlow = new oflow.ImageDataFlow(640, 480, zoneSize);
imageFlow.onCalculated(function(direction){

    // render zones
    if (debug) {
        self.debugContext.fillStyle = '#000';
        self.debugContext.fillRect(0, 0, self.debugCanvas.width, self.debugCanvas.height);
    }
    
    self.context.fillStyle = "#fff";
    self.context.fillRect(0, 0, self.canvas.width, self.canvas.height);
    var then = window.performance.now();
    for(var i = 0; i < direction.zones.length; ++i) {
       
       // fill flow debug context
        var zone = direction.zones[i];
        var color = getDirectionalColor(zone.u, zone.v);
        
        if (debug) {
            self.debugContext.strokeStyle = color;
            self.debugContext.beginPath();
            self.debugContext.moveTo(zone.x,zone.y);
            self.debugContext.lineTo((zone.x - zone.u), zone.y + zone.v);
            self.debugContext.stroke();
        }

        // fill difference texture
        // for some reason empty background fills red, switch this to black
        if (color === 'rgba(255,0,0,1)') {
            color = 'rgba(255,255,255,1)';
        } else {
            // zone.u and zone.y are values between -(zoneSize * 2 + 1) and (zoneSize * 2 + 1), 
            // so to calculate the magnitude of the vector 
            var len = new BB.Vector2(zone.u, zone.v).length();

            var alpha = BB.MathUtils.map(len, 0, maxLength, 0.0, 1.0);
            // var alpha = BB.MathUtils.map((Math.abs(zone.u) + Math.abs(zone.v)), 0, (zoneSize * 2 + 1) * 2, 0.0, 1.0);
            // var alpha = vec.alphaanceTo(new BB.Vector2(zone.u, zone.v)) // / Math.floor(zoneSize * 2 + 1);
            // var alpha = BB.MathUtils.map(((new BB.Vector2(zone.u - zone.x, zone.v - zone.y)).length() % zoneSize * 2 + 1), 0, 17, 0.0, 1.0);
            // if (alpha < 0.1) console.log(alpha);
            // alphas.push(alpha);
            color = color.split(',');
            color[color.length - 1] = alpha + ')';
            color = color.join(',')

            self.context.fillStyle = color;
            self.context.fillRect(zone.x / (self.depthCanvas.width / self.canvas.width),
                                zone.y / (self.depthCanvas.height / self.canvas.height), 1, 1);
        }
    } 
    console.log(window.performance.now() - then);
});

var imageData;
var cutoff = 1000;

onmessage = function(e) {

	if (e.data.name == 'setImageData') {
		imageData = e.data.message;
	} else if (e.data.name == 'setCutoff') {
		cutoff = e.data.message;
	} else if (e.data.name == 'addFrame') {

		if (imageData) {

			var pixels = e.data.message;
			var i = 0;
		    var j = 0;

		    for (var y = 0; y < 640; y++) {
		        for (var x = 0; x < 480; x++) {
		            
		            var val = pixels[j + 1] << 8 | pixels[j];
		            val = BB.MathUtils.map(val, 0, cutoff, 255, 0);

		            imageData.data[i + 0] = val;
		            imageData.data[i + 1] = val;
		            imageData.data[i + 2] = val;
		            imageData.data[i + 3] = 255;

		            j += 2;
		            i += 4;
		        }
		    }

		    imageFlow.addFrame(imageData.data);
		}
	}
}