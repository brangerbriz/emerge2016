attribute vec2 position; // receive vertex data as "attribute" ( line 90 )

// runs once per each vertex( ie. 6, see gl.drawArrays below )
// see: http://webglfundamentals.org/webgl/lessons/resources/vertex-shader-anim.gif
void main() {
  gl_Position = vec4(position, 0, 1);
}