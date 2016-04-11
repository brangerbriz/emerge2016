precision mediump float;

uniform float time;
uniform float motion;
uniform float smoothMotion;
uniform int motionGate;
uniform sampler2D map;		// kinect canvas
uniform sampler2D diffTex;	// frame diff canvas
uniform sampler2D webglTex;

// uniform float width;
// uniform float height;
uniform float pointsize;

float zoffset = 2048.0/4.0;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vColor;
varying float vDepth;
varying float pSize;


float scale( float val, float in_min, float in_max, float out_min, float out_max ){
	return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float resYPsize( float rt, float val ){
	if( ceil(position.y) == ceil(480.0/50.0*rt) )return val;
	else return 0.0;
}

float resXPsize( float rt, float val ){
	if( ceil(position.x) == ceil(640.0/50.0*rt) ) return val;
	else return 0.0;
}

float resX1Psize(float rt, float val){
	if( mod( abs(ceil(position.x)), rt ) == 0.0 ) return val;
	else return 0.0;
}

float xWave(float t, float val){
	float st = abs( sin(t*0.001)*50.0 ) - 25.0 ;
	float x = ceil(position.x);
	float minSeg = ceil(640.0/50.0*(st-2.0));
	float maxSeg = ceil(640.0/50.0*(st+2.0));
	if( x >= minSeg && x <= maxSeg ) return val;
	else return 0.0;
}


void main() {
	// pass fragement-shader coords
	vPos = position; 
	// pass fragment-shader vertexColor
	vColor = color;
	// pass fragement-shader uv's ( to be used w/ texture map )
	vUv = uv;

	// use color from canvas as z-depth 
	vec4 depth = texture2D( map, uv );
	float d = ( depth.r + depth.g ) / 2.0;
	d = clamp( d, 0.6471, 1.0 );
	vDepth = d; // pass to fragment shader
	float z = (1.0-d) * 2048.0; 
	
	
	float ripple;
	if( motionGate >= 1){
		vec4 rippleTex = texture2D( webglTex, uv );
		ripple = rippleTex.r*( smoothMotion * 15000.0 );
	} else {
		ripple = 0.0;
	}
	
	

	vec4 pos = vec4( position.x, position.y, -z+zoffset + ripple, 1.0 );
	
	if(  motionGate>=1 && texture2D(diffTex, vUv).r == 1.0 )
		gl_PointSize = pointsize * (motion*2000.0);
	else
		gl_PointSize = pointsize;

	pSize = gl_PointSize;

	gl_Position = projectionMatrix * modelViewMatrix * pos;
}