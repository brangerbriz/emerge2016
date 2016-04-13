uniform sampler2D map;
uniform float pointsize;

varying float vDepth;

float zoffset = 2048.0/4.0; 

void main() {
	
	vec4 depth = texture2D( map, uv );
	float d = ( depth.r + depth.g ) / 2.0;
	vDepth = d; 
	float cd = clamp( d, 0.6471, 1.0 );
	float z = (1.0-cd) * 2048.0; 

	vec4 pos = vec4( position.x, position.y, -z+zoffset, 1.0 );
	gl_PointSize = pointsize;
	gl_Position = projectionMatrix * modelViewMatrix * pos;
}