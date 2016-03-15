// texture from canvas to be used as a uniform sampler2D
function CanvTex( polycount ){
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
