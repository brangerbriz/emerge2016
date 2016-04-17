// -------- a couple helper functions ( used to setup GLSL program, line 66 )

function createShader(str, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  return shader;
}

function createProgram(vstr, fstr) {
  var program = gl.createProgram();
  var vshader = createShader(vstr, gl.VERTEX_SHADER);
  var fshader = createShader(fstr, gl.FRAGMENT_SHADER);
  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);
  gl.linkProgram(program);
  return program;
}

// -------- -------- -------- -------- -------- -------- -------- --------


// setup canvas + webGL context 
var canvas = document.createElement("canvas");
canvas.width = 640;
canvas.height = 480;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl');


// setup a GLSL program
var vertexShader = document.getElementById('vertex-shader').textContent;
var fragmentShader = document.getElementById('fragment-shader').textContent;
var program = createProgram(vertexShader, fragmentShader);
gl.useProgram(program);

// look up where the vertex data needs to go.
var positionLocation = gl.getAttribLocation(program, "position");
var time = gl.getUniformLocation(program, "time");
// var phase = gl.getUniformLocation(program, "phase");

// fill the buffer with the values that define a rectangle ( in this case using triangle strips )
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
  gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

function draw() {
  requestAnimationFrame(draw);

  gl.uniform1f(time, window.performance.now()/1000);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // gl.drawArrays(gl.TRIANGLES, 0, 6);	
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

draw();
