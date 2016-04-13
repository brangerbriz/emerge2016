uniform sampler2D map; // kinect canvas img
uniform float width;
uniform float height;

float zoffset = 2048.0/4.0;

varying vec2 vUv;
varying vec3 vPos;
varying vec3 vColor;
varying float vDepth;

// conolution kernal clean up 
uniform float blr[9];

void main() {

	// pass fragement-shader coords
	vPos = position; 
	// pass fragment-shader vertexColor
	vColor = color;
	// pass fragement-shader uv's ( to be used w/ texture map )
	vUv = uv;


	// use canvas map as z-depth 
	vec4 depth = texture2D( map, uv );
	float d = ( depth.r + depth.g ) / 2.0;
	vDepth = d; // pass to fragment shader
	d = clamp( d, 0.6471, 1.0 );
	float z = (1.0-d) * 2048.0; 

	// float z = ( 1.0 - clamp(depth.r,0.6471,1.0) ) * 2048.0;


	// r channel clamped to mid grey: 0.6471 ( see app.js threshold )
	// float r = clamp( texture2D( map, uv ).r, 0.6471,1.0); 
	// float r = tex,0.6471,1.0)ture2D(map,uv).r;

	// float r1 = texture2D(map, uv + vec2(-1, -1) ).r * blr[0];
	// float r2 = texture2D(map, uv + vec2( 0, -1) ).r * blr[1];
	// float r3 = texture2D(map, uv + vec2( 1, -1) ).r * blr[2];
	// float r4 = texture2D(map, uv + vec2(-1,  0) ).r * blr[3];
	// float r5 = texture2D(map, uv + vec2( 0,  0) ).r * blr[4];
	// float r6 = texture2D(map, uv + vec2( 1,  0) ).r * blr[5];
	// float r7 = texture2D(map, uv + vec2(-1,  1) ).r * blr[6];
	// float r8 = texture2D(map, uv + vec2( 0,  1) ).r * blr[7];
	// float r9 = texture2D(map, uv + vec2( 1,  1) ).r * blr[8]; 


	// // .... convolution maths ....
	// float colorSum = r1 + r2 + r3 + r4 + r5 + r6 + r7 + r8 + r9;
	// float kernelWeight 	= blr[0] + blr[1] + blr[2] + blr[3] + blr[4] + blr[5] + blr[6] + blr[7] + blr[8];			 
	// if (kernelWeight <= 0.0) { kernelWeight = 1.0; }
	// float depth = colorSum / kernelWeight;

	
	vec4 pos = vec4( position.x, position.y, -z+zoffset, 1.0 );
	// vec4 pos = vec4( position.x, position.y, -500.0, 1.0 );
	

	gl_Position = projectionMatrix * modelViewMatrix * pos;
	// gl_Position = vec4(position, 1.0);

}