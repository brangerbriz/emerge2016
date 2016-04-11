// texture from canvas to be used as a uniform sampler2D
function CanvTex( polycount ){
	// // ~~~~~~~ load custom image file as texture ~~~~~~~
	// var clrBox = new THREE.TextureLoader().load( 'images/colorbox.jpg' );
	// clrBox.wrapS = THREE.RepeatWrapping;
	// clrBox.wrapT = THREE.RepeatWrapping;
	// clrBox.repeat.set( 4, 4 );
	
	// ~~~~~~~ create a random color grid based on polycount via canvas ~~~~~~~
	this.canvas = document.createElement('canvas');
		this.canvas.width = 640;
		this.canvas.height = 480;
	var dx = this.canvas.width/polycount;
	var dy = this.canvas.height/polycount;
	this.ctx = this.canvas.getContext( '2d' );
	this.polycount = polycount;
	
	// squares
	for (var y = 0; y < polycount; y++) {
		for (var x = 0; x < polycount; x++) {
			this.ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
			this.ctx.fillRect(x*dx,y*dy,dx,dy);
		};
	};
	
	// // triangles
	// for (var y = 0; y < polycount; y++) {
	// 	for (var x = 0; x < polycount; x++) {
	// 		ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
	// 		var X = x*dx;
	// 		var Y = y*dy;
	// 		ctx.beginPath();
	// 		ctx.moveTo( X, Y );
	// 		ctx.lineTo( X+dx, Y );
	// 		ctx.lineTo( X, Y+dy );
	// 		ctx.closePath();
	// 		ctx.fill();

	// 		ctx.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16);
	// 		ctx.beginPath();
	// 		ctx.moveTo( X+dx, Y );
	// 		ctx.lineTo( X+dx, Y+dy );
	// 		ctx.lineTo( X, Y+dy );
	// 		ctx.closePath();
	// 		ctx.fill();
	// 	};
	// };	

	this.texture = new THREE.Texture( this.canvas );
	this.texture.minFilter = THREE.NearestFilter;
	this.texture.needsUpdate = true;

	//return this.texture;
}

CanvTex.prototype.getTexture = function(){
	return this.texture;
}

CanvTex.prototype.refresh = function(){
	// squares
	var dx = this.canvas.width/this.polycount;
	var dy = this.canvas.height/this.polycount;
	for (var y = 0; y < this.polycount; y++) {
		for (var x = 0; x < this.polycount; x++) {
			this.ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
			this.ctx.fillRect(x*dx,y*dy,dx,dy);
		};
	};
	this.texture.needsUpdate = true;
}