

uniform sampler2D map; // kinect canvas img

float zoffset = 2048.0/4.0;

varying vec2 vUv;
varying vec3 vPos;
varying float vDepth;


void main() {

	// pass fragement-shader 
	vUv = uv; 
	vPos = position;

	// use kinect canvas map as z-depth 
	vec4 depth = texture2D( map, uv );
	float d = ( depth.r + depth.g ) / 2.0;
	d = clamp( d, 0.6471, 1.0 );
	vDepth = d; // pass to fragment-shader
	float z = (1.0-d) * 2048.0; 
	
	vec4 pos = vec4( position.x, position.y, -z+zoffset, 1.0 );

	gl_Position = projectionMatrix * modelViewMatrix * pos;

}