uniform sampler2D map; // kinect canvas img
uniform float time;
uniform sampler2D diffTex;

float zoffset = 2048.0/4.0;

varying vec2 vUv;
varying vec3 vPos;
varying float vDepth;

float xWave(float t, float val){
	float st = abs( sin(t*0.001)*50.0 ) - 25.0 ;
	float x = ceil(position.x);
	float minSeg = ceil(640.0/50.0*(st-2.0));
	float maxSeg = ceil(640.0/50.0*(st+2.0));
	if( x >= minSeg && x <= maxSeg ) return val;
	else return 0.0;
}

void main() {

	// pass fragement-shader 
	vUv = uv; 
	vPos = position;

	// use canvas map as z-depth 
	vec4 depth = texture2D( map, uv );
	float d = ( depth.r + depth.g ) / 2.0;
	d = clamp( d, 0.6471, 1.0 );
	vDepth = d; // pass to fragment-shader
	float z = (1.0-d) * 2048.0; 
	
	vec4 pos = vec4( position.x, position.y, -z+zoffset, 1.0 );

	gl_Position = projectionMatrix * modelViewMatrix * pos;

}