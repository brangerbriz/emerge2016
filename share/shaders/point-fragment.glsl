uniform sampler2D map;
varying vec2 vUv;
varying float vDepth;

float scale( float val, float in_min, float in_max, float out_min, float out_max ){
	return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

void main() {
	
	//float d = (vDepth - 0.6471) / 0.3529; // scale it
	float d = scale( vDepth, 0.6471, 0.75, 0.0, 1.0 );
	

	gl_FragColor = vec4( d, d, d, 1.0 );
	// gl_FragColor = vec4( 1.0 );

}