function FrameDifference(width, height) {

	this.width = width;
	this.height = height;
	this.threshold = 0.05; // normalized float representing percent
	this.motion = 0;
	this.canvas = document.createElement('canvas');
	this._context = this.canvas.getContext('2d');
	this._prevFrame = null;
	this._frame = null; // assigned the value of an ImageData.data
	this._imageData = this._context.createImageData(width, height);
}

// pixels MUST be an instance of ImageData.data (not just any old Uint8ClampedArray).
// For some reason ImageData.data seems to be optimized for use here.
FrameDifference.prototype.addFrame = function(pixels) {

  var total = 0;
  if(pixels.length > 0) { // don't forget this!
    if(!this._prevFrame) {
      this._prevFrame = copyImage(pixels, this._prevFrame);
      this._frame = pixels;
    } else {
      var w = this.width, h = this.height;
      var i = 0;
    
      var thresholdAmount = (this.threshold * 100) * 2048.0 / 100.0;
      for(var y = 0; y < h; y++) {
        for(var x = 0; x < w; x++) {
      	  
      	  // bitshift 8-bit values and read as one 16-bit value (that stores an 11-bit number)
      	  // get the abs difference of that value compared to its last state
          var diff = Math.abs(
          	(pixels[i+1] << 8 | pixels[i])-(this._prevFrame[i+1] << 8 | this._prevFrame[i])
          );

          // assign these pixels to the previous frame
          this._prevFrame[i] = pixels[i];
          this._prevFrame[i + 1] = pixels[i + 1];
          this._prevFrame[i + 2] = pixels[i + 2];
          
          var output = 0;
         
          if(diff > thresholdAmount) {
            output = 255;
            total += diff;
          }
          
          pixels[i++] = output;
          pixels[i++] = output;
          pixels[i++] = output;
          i++; // skip alpha
        }
      }
    }
  }
  // need this because sometimes the frames are repeated
  if(total > 0) {
  	  this.motion = BB.MathUtils.map(total, 0, 629145600 /* <-- 2^11*640*480  */, 0.0, 1.0);
      this._imageData.data.set(this._frame);
      this._context.putImageData(this._imageData, 0, 0);
  }

	// copy an array, creating a new array if necessary
	// usage: dst = copyImage(src, dst)
	// taken from Kyle McDonald's P5.js cv-examples repo
	// based on http://jsperf.com/new-array-vs-splice-vs-slice/113
	function copyImage(src, dst) {
	  var n = src.length;
	  if(!dst || dst.length != n) {
	    dst = new src.constructor(n);
	  }
	  while(n--) {
	    dst[n] = src[n];
	  }
	  return dst;
	}
}


