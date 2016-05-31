precision mediump float;

uniform float time;
// uniform float motion;
uniform float smoothMotion;
uniform float motionFade;
uniform int motionGate;
// uniform sampler2D map; // kinect canvas
// uniform sampler2D diffTex;	// frame diff canvas

varying vec2 vUv;
varying float vDepth;
varying float pSize;


float scale( float val, float in_min, float in_max, float out_min, float out_max ){
	return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

vec3 hsv2rgb( float h, float s, float v ){

	h = mod( h, 360.0 );
	h /= 60.0;

	float r = 0.0;
	float g = 0.0;
	float b = 0.0;

	float i = floor( h );
	float f = h - i;
	float p = v * ( 1.0 - s );
	float q = v * ( 1.0 - s * f );
	float t = v * ( 1.0 - s * (1.0 - f) );

	 	 if(i==0.0){ r = v; g = t; b = p; }
	else if(i==1.0){ r = q; g = v; b = p; }
	else if(i==2.0){ r = p; g = v; b = t; }
	else if(i==3.0){ r = p; g = q; b = v; }
	else if(i==4.0){ r = t; g = p; b = v; }
	 		  else { r = v; g = p; b = q; }

	return vec3( r, g, b );
}

void main() {
	
	float d = scale( vDepth, 0.6471, 1.0, 0.0, 0.75 );				

	float alpha;
	if(vDepth <= 0.648 ) alpha = 0.0;
	else alpha = d;
	
	float maxDeg = 360.0 * smoothMotion * 2500.0;// the larger, the tighter the rainbow
	float dHue = scale( vDepth, 0.6471, 1.0, 0.0, maxDeg );	
	float angle;
		
	if( motionGate < 2 ){
		// vec4 purple = vec4( hsv2rgb( scale( vDepth, 0.6471, 1.0, 270.0, 360.0), 1.0, 1.0 ), alpha );
		vec4 blue = vec4( hsv2rgb( scale( vDepth, 0.5388, 1.0, 190.0, 200.0), 0.99, 0.80 ), alpha );
		vec4 rainbow = vec4( hsv2rgb( dHue, 0.85, 1.0 ), alpha );
		vec4 mixClr = mix( blue, rainbow, vec4(motionFade) );		
		gl_FragColor = mixClr;
	}
	else {
		if( pSize > 3.0 ){
			// rainbow
			angle = dHue;// + (time*0.25);
			gl_FragColor = vec4( hsv2rgb( angle, 1.0, 1.0 ), alpha );
		}
		else  { gl_FragColor = vec4( 1.0, 1.0, 1.0, alpha ); }		
	}
	 					
}