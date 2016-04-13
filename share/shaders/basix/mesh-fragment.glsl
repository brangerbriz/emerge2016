uniform float time;
uniform float leapx;
uniform float leapy;
uniform float width;
uniform float height;
uniform float blur[9];

// texture map
uniform sampler2D map;	  // kinect canvas texture
uniform sampler2D canvTex; // color canvas texture

// uv coords
varying vec2 vUv;

// position
varying vec3 vPos;

// vertexColor
varying vec3 vColor;

// zdepth color
varying float vDepth;

vec3 cm( vec3 c1, vec3 c2 ){
	return vec3(
		(c1.r+c2.r)/2.0,
		(c1.g+c2.g)/2.0,
		(c1.b+c2.b)/2.0
	);
}

void main() {

	vec4 color = texture2D( map, vUv );	// depth-map texture app.js Kinect data canvas
	vec4 c = texture2D( canvTex, vUv ); 	// color-box texture from kinectMesh internal canvas


	// // mix shifting colors w/ vectorColors
	// float r = abs( sin(  vUv.x + time / 5.0 ) );
	// float g = abs( sin(  vUv.y + time / 4.0 ) );
	// float b = abs( sin( -vUv.x + time / 3.0 ) );
	// vec3 clr = vec3(r,g,b);
	// gl_FragColor = vec4( cm(vColor,clr), 1.0 );
	
	// gl_FragColor = vec4( 
	// 	vColor.r,
	// 	vColor.g,
	// 	vColor.b,
	// 	1.0 
	// );
	
	// gl_FragColor = vec4( 
	// 	abs( sin(c.r + leapx)), 
	// 	abs( sin(c.g + leapx)), 
	// 	abs( sin(c.b + leapx)), 
	// 	0.75
	// );
	
	// // crazy rainbow color grid from canvas + leap motion
	// gl_FragColor = vec4( 
	// 	step(0.5,abs( sin(c.r + width/leapx ))),
	// 	step(0.5,abs( sin(c.g + width/leapx ))),
	// 	step(0.5,abs( sin(-c.r + width/leapx ))), 
	// 	1.0
	// );


	// create shifting gradient across entire plane
	float r = abs( sin(  vUv.x + time / 5.0 ) );
	float g = abs( sin(  vUv.y + time / 4.0 ) );
	float b = abs( sin( -vUv.x + time / 3.0 ) );
	gl_FragColor = vec4( r, g, b, 1.0 );
	

	// // vectorColors IF dpeth-texture isn't black
	// vec3 condi = vec3( vColor.r, vColor.g, vColor.b );
	// if( color.r == 0.0 ) condi.r = 1.0;
	// if( color.g == 0.0 ) condi.g = 1.0;
	// if( color.b == 0.0 ) condi.b = 1.0;
	// gl_FragColor = vec4( condi, 1.0 );


	// // crazy rainbow color grid from canvas
	// gl_FragColor = vec4( 
	// 	step(0.5,abs( sin(c.r + time / 5.0 ))),
	// 	step(0.5,abs( sin(c.g + time / 4.0 ))),
	// 	step(0.5,abs( sin(-c.r + time / 3.0 ))), 
	// 	1.0
	// );
	
	// just canvas colrs 
	// gl_FragColor = vec4( c.r, c.g, c.b, 1.0);
	 
	
	// just vectorColors
	// gl_FragColor = vec4( vColor, 1.0 );


	// gl_FragColor = vec4( vDepth, vDepth, vDepth, 1.0 );
	// gl_FragColor = vec4( color.r, color.r, color.r, 1.0 );
}