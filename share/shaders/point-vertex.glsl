uniform sampler2D map;
uniform float width;
uniform float height;
uniform float pointsize;
// uniform int depth[307200];

// IDEA: pass depth data directly as texture
// uniform sampler2D depthdata;


// float near = 20.0;	// should these be const?
// float far  = 100.0; // should these be const? 
float zoffset = 2048.0/4.0;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vColor;
varying float vDepth;

void main() {

	// pass fragement-shader coords
	vPos = position; 
	// pass fragment-shader vertexColor
	vColor = color;
	// pass fragement-shader uv's ( to be used w/ texture map )
	vUv = uv;


	// // use color from canvas as z-depth 
	// vec4 depth = texture2D( map, uv );
	// depth = clamp( depth, 0.6471, 1.0 );
	// float z = (1.0-depth.r) * 2048.0; 


	// use color from canvas as z-depth 
	vec4 depth = texture2D( map, uv );
	float d = ( depth.r + depth.g ) / 2.0;
	vDepth = d; // pass to fragment shader
	d = clamp( d, 0.6471, 1.0 );
	float z = (1.0-d) * 2048.0; 


	// int i = ( uv.y * width ) + uv.x;
	// float = z (1.0 - depth[i]) * 2048.0;

	// // IDEA: pass depth data directly as texture
	// vec4 test = texture2D( depthdata, uv );
	// depth = clamp( depth, 0.6471, 1.0 );
	// float z = (1.0-depth.r) * 2048.0; 
	
	
	vec4 pos = vec4( position.x, position.y, -z+zoffset, 1.0 );
	
	gl_PointSize = pointsize;
	gl_Position = projectionMatrix * modelViewMatrix * pos;
	// gl_Position = vec4(position, 1.0); // flat screen essentially 

}
