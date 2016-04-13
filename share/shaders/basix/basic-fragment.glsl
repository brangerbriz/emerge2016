varying float vDepth;

void main() {
	
	float d = (vDepth - 0.6471) / 0.3529; 
	gl_FragColor = vec4( d, d, d, 1.0 );
}