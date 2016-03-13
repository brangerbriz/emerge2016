uniform sampler2D map;
varying vec2 vUv;
varying float vDepth;

float scale( float val, float in_min, float in_max, float out_min, float out_max ){
	return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

void main() {
	
	float d = scale( vDepth, 0.6471, 1.0, 0.2, 1.0 );				

	float alpha;
	if(vDepth <= 0.6471 ) alpha = 1.0;
	else alpha = 1.0;

	gl_FragColor = vec4( d-0.25, d-(d*2.0), d, 1.0 );

}