/**
 * generates a three.js mesh from depth data ( Uint8Array ), presumably from a Kinect or the like
 * @class DepthFromKinect
 * @constructor
 * @param {Number} [width] optional canvas width ( default 640 like Kinect )
 * @param {Number} [height] optional canvas height ( default 480 like Kinect )
 * @param {Uint8Array} [initDepth] optional initial depth data ( to use before first update runs )
 */

function DepthFromKinect( width, height, initDepth ){

	if(typeof BB === 'undefined') throw new Error('MeshFromDepth: requires the liBB library');

	this.data = null; // set on first update

	if( typeof width === "undefined" ){
		this.width = 640;
	} else {
		if( typeof width !== "number" ) throw new Error('DepthFromKinect: width should be a number');
		else this.width = width;
	}
	if( typeof height === "undefined" ){
		this.height = 480;
	} else {
		if( typeof height !== "number" ) throw new Error('DepthFromKinect: height should be a number');
		else this.height = height;
	}
	
	// make canvas used to pass depth data MeshFromDepth ~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.
	this.canvas = document.createElement('canvas');
	this.canvas.width = this.width;		
	this.canvas.height = this.height;
	this.ctx = this.canvas.getContext('2d');
	this.imageData = this.ctx.createImageData( this.width, this.height );

	

	// for cross-fading / tweening ~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.~`~._.
	this.prevCanvasData = null;
	this.newCanvasData = ( typeof initDepth !== "undefined" ) ? initDepth : null;
	this.fadeCnt = 0;
	this.steps = 30;
	if(typeof initDepth !== "undefined") this.crossFadeCanvasData( initDepth );

	
}


/**
 * updates internal canvas data via depth data being sent from kinect ( or similar device )
 * @method updateCanvasData
 * @param {Array} depth Uint8Array containing 16bit values ( integers, 0 - 2048 )
 */
DepthFromKinect.prototype.updateCanvasData = function( depth ) {

	this.data = depth;
	
	var data = this.imageData.data;
	var j = 0;
	var val1, val2;

	for (var i = 0; i < depth.length; i += 2) {

		var total = depth[i+1] << 8 | depth[i]; // YEA!!! IT WORX :D BITSHIFTER!!!

		if( total > 1024 ){
			val1 = 0; 
			val2 = BB.MathUtils.map( (2048-total), 0, 1024, 255, 0);
		
		} else {
			val1 = BB.MathUtils.map( total, 0, 1024, 255, 0);
			val2 = 255;
		}

		data[j] = val1;
		data[j + 1] = val2;
		data[j + 2] = val2;
		data[j + 3] = 255;

		j += 4;
	}

	this.ctx.putImageData(this.imageData, 0, 0);
	
};


/**
 * fades new canvas image from older canvas image ( via depth data being sent from kinect or similar device ) 
 * @method crossFadeCanvasData
 * @param {Array} depth Uint8Array containing 16bit values ( integers, 0 - 2048 )
 * @param {Number} [duration] number in milliseconds of the transition ( default 500ms )
 */
DepthFromKinect.prototype.crossFadeCanvasData = function( depth, duration ) {

	this.data = depth;

	var self = this;

	if (typeof duration !== "undefined") this.steps = duration * 0.06;


	if( this.newCanvasData === null ){

		this.newCanvasData = depth;
		this.crossFadeCanvasData( this.newCanvasData );

	} else {

		if( this.fadeCnt === 0 ) {
			this.prevCanvasData = this.newCanvasData;
			this.newCanvasData = depth;
		}

	    var data = this.imageData.data;
		var j = 0;
		var prev1, prev2, new1, new2;
		var newFade = this.fadeCnt / this.steps;
		var prevFade = (1 - this.fadeCnt / this.steps);

		for (var i = 0; i < this.prevCanvasData.length; i += 2) {

			var prevTotal = this.prevCanvasData[i+1] << 8 | this.prevCanvasData[i];
			if( prevTotal > 1024 ){
				prev1 = 0; 
				prev2 = BB.MathUtils.map( (2048-prevTotal), 0, 1024, 255, 0);
			
			} else {
				prev1 = BB.MathUtils.map( prevTotal, 0, 1024, 255, 0);
				prev2 = 255;
			}

			var newTotal = this.newCanvasData[i+1] << 8 | this.newCanvasData[i];
			if( newTotal > 1024 ){
				new1 = 0; 
				new2 = BB.MathUtils.map( (2048-newTotal), 0, 1024, 255, 0);
			
			} else {
				new1 = BB.MathUtils.map( newTotal, 0, 1024, 255, 0);
				new2 = 255;
			}


			data[j] 	= (prev1*prevFade) + (new1*newFade);
			data[j + 1] = (prev2*prevFade) + (new2*newFade);
			data[j + 2] = (prev2*prevFade) + (new2*newFade);
			data[j + 3] = 255;

			j += 4;
		}

		this.ctx.putImageData(this.imageData, 0, 0);

		this.fadeCnt++;

		if (this.fadeCnt > this.steps) {
			this.fadeCnt = 0;
	        return;
	    } else {
	    	requestAnimationFrame(function(){
	    		self.crossFadeCanvasData();
	    	});
	    }

	}

};




/**
 * wipe fades new canvas image from older canvas image ( via depth data being sent from kinect or similar device ) 
 * @method wipeFadeCanvasData
 * @param {Array} depth Uint8Array containing 16bit values ( integers, 0 - 2048 )
 * @param {Number} [duration] number in milliseconds of the transition ( default 500ms )
 */
DepthFromKinect.prototype.wipeFadeCanvasData = function( depth, duration ) {

	this.data = depth;

	var self = this;

	if (typeof duration !== "undefined") this.steps = duration * 0.06;

	if( this.newCanvasData === null ){

		this.newCanvasData = depth;
		this.wipeFadeCanvasData( this.newCanvasData );

	} else {

		if( this.fadeCnt === 0 ) {
			this.prevCanvasData = this.newCanvasData;
			this.newCanvasData = depth;
		}

	    var data = this.imageData.data;
		var j = 0;
		var prev1, prev2, new1, new2;
		var newFade = this.fadeCnt / this.steps;
		var prevFade = (1 - this.fadeCnt / this.steps);


		for (var i = 0; i < this.prevCanvasData.length; i += 2) {

			var prevTotal = this.prevCanvasData[i+1] << 8 | this.prevCanvasData[i];
			if( prevTotal > 1024 ){
				prev1 = 0; 
				prev2 = BB.MathUtils.map( (2048-prevTotal), 0, 1024, 255, 0);
			
			} else {
				prev1 = BB.MathUtils.map( prevTotal, 0, 1024, 255, 0);
				prev2 = 255;
			}

			var newTotal = this.newCanvasData[i+1] << 8 | this.newCanvasData[i];
			if( newTotal > 1024 ){
				new1 = 0; 
				new2 = BB.MathUtils.map( (2048-newTotal), 0, 1024, 255, 0);
			
			} else {
				new1 = BB.MathUtils.map( newTotal, 0, 1024, 255, 0);
				new2 = 255;
			}				



			if( i/this.prevCanvasData.length > prevFade ){

				data[j] 	= (prev1*prevFade) + (new1*newFade);
				data[j + 1] = (prev2*prevFade) + (new2*newFade);
				data[j + 2] = (prev2*prevFade) + (new2*newFade);
				data[j + 3] = 255;

			} else {
				
				data[j] 	= (prev1*prevFade) + (prev1*newFade);
				data[j + 1] = (prev2*prevFade) + (prev2*newFade);
				data[j + 2] = (prev2*prevFade) + (prev2*newFade);
				data[j + 3] = 255;
			}

			j += 4;
		}

		this.ctx.putImageData(this.imageData, 0, 0);

		this.fadeCnt++;

		if (this.fadeCnt > this.steps) {
			this.fadeCnt = 0;
	        return;
	    } else {
	    	requestAnimationFrame(function(){
	    		self.wipeFadeCanvasData();
	    	});
	    }

	}

};