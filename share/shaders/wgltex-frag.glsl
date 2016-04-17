precision mediump float;
uniform float time;

void main(){
  vec2 st = gl_FragCoord.xy/vec2(640, 480);
    
  float speed = 3.0; // smaller = slower
  float ringAmount = 20.0; // larger = more

  // Make the distance field
  float d = length(st - 0.5);

  gl_FragColor = vec4(vec3(sin((d - time / speed) * ringAmount)), 1.0);
  // gl_FragColor = vec4(vec3(1.0-fract((d - time / speed) * ringAmount/5.0)), 1.0);

}