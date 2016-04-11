function WebGLTexture( config ){

	// setup canvas + webGL context 
	this.canvas = document.createElement("canvas");
	this.canvas.width = config.width;
	this.canvas.height = config.height;
	this.gl = this.canvas.getContext('webgl');

	// document.body.appendChild(this.canvas);
	// this.canvas.style.position = "absolute";
	// this.canvas.style.left = "10px";
	// this.canvas.style.top = "10px";
	// this.canvas.style.zIndex = 9999999;

	// setup a GLSL program
	// var vertexShader = document.getElementById( config.vertexShader ).textContent;
	// var fragmentShader = document.getElementById(config.fragmentShader).textContent;
	this._loadFile( "vertex-shader", config.vertexShader );
	this._loadFile( "fragment-shader", config.fragmentShader );

	// for use w/three.js texture
	this.texture = new THREE.Texture( this.canvas );
	this.texture.minFilter = THREE.NearestFilter;
	this.texture.needsUpdate = true;

	this._init();
}

WebGLTexture.prototype._createShader = function(str, type) {
	var shader = this.gl.createShader(type);
	this.gl.shaderSource(shader, str);
	this.gl.compileShader(shader);
	return shader;
};

WebGLTexture.prototype._createProgram = function(vstr, fstr) {
	var program = this.gl.createProgram();
	var vshader = this._createShader(vstr, this.gl.VERTEX_SHADER);
	var fshader = this._createShader(fstr, this.gl.FRAGMENT_SHADER);
	this.gl.attachShader(program, vshader);
	this.gl.attachShader(program, fshader);
	this.gl.linkProgram(program);
	return program;
};

WebGLTexture.prototype._loadFile = function( type, path) {
	var self = this;
	var req = new XMLHttpRequest();
	req.open("GET", path, true);
	req.addEventListener("load", function() {
		if(type=="fragment-shader")		self.fragmentShader = req.responseText;
		else if(type=="vertex-shader") 	self.vertexShader = req.responseText;
	});
	req.send(null);
};

WebGLTexture.prototype._init = function(str, type) {
	var self = this;

	if(typeof this.fragmentShader !== "undefined" && typeof this.vertexShader !== "undefined"  ){

		var program = this._createProgram( this.vertexShader, this.fragmentShader);
		this.gl.useProgram( program );

		// define uniforms
		// var floatUniforms = config.floatUniforms;
		// this.uniforms = [];
		// for (var i = 0; i < floatUniforms.length; i++) {
		// 	// floatUniforms[i]
		// 	// var time = gl.getUniformLocation(program, "time");
		// 	// var phase = gl.getUniformLocation(program, "phase");
		// };
		this.time = this.gl.getUniformLocation( program, "time" );

		// look up where the vertex data needs to go.
		var positionLocation = this.gl.getAttribLocation( program, "position");

		// fill the buffer with the values that define a rectangle ( in this case using triangle strips )
		var buffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			this.gl.STATIC_DRAW
		);
		this.gl.enableVertexAttribArray( positionLocation );
		this.gl.vertexAttribPointer( positionLocation, 2, this.gl.FLOAT, false, 0, 0);


	} else {
		setTimeout(function(){  self._init();  }, 100 );
	}
	
};


WebGLTexture.prototype.getTexture = function() {
	return this.texture;
};

WebGLTexture.prototype.update = function( timer ) {

	if(typeof this.fragmentShader !== "undefined" && typeof this.vertexShader !== "undefined"  ){

		this.gl.uniform1f( this.time, timer );
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

		this.texture.needsUpdate = true;
	}
};