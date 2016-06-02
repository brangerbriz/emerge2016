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

	// LiveWorx colors -------------------------
	// vec3 red = vec3(0.905, 0.270, 0.004);
	// vec3 teal = vec3(0.258, 0.745, 0.674);
	// vec3 blue = vec3(0.0, 0.592, 0.804);
	// vec3 yellow = vec3(1.0, 0.772, 0.184);
	
	// float gd = scale(vDepth, 0.6471, 1.0, 0.0, 1.0);
	// float gmix = sin( smoothMotion ) * 500.0;
	// float gx = scale(gmix, 0.5, 1.0, -0.5, 0.5);

	// vec3 color1 = mix( red, teal, gd*1.936 );
	// vec3 color2 = mix( yellow, blue, (gd*2.152)-1.156 );
	// vec3 color = mix( color1, color2, gx );
	// vec4 liveworx = vec4(color, alpha);
	// ------------------------------------------

	// ram barf + saw tooth + clr to nudge colors twards brand
	vec3 clr = vec3(0.970,0.475,0.569);
	float l = length(vUv*2.0-1.0);
	float s = sin(smoothMotion) * 4000.0 - 3.0;;
	vec3 color = vec3( fract(l*s) );
	vec3 glitch; // ram barf
	vec4 liveworx = vec4( clr.r, color.g, glitch.b, alpha);
	
		
	if( motionGate < 2 ){
		vec4 blue = vec4( hsv2rgb( scale( vDepth, 0.5388, 1.0, 190.0, 200.0), 0.99, 0.80 ), alpha );
		vec4 mixClr = mix( blue, liveworx, vec4(motionFade) );		
		gl_FragColor = mixClr;
	}
	else {
		if( pSize > 3.0 ){
			gl_FragColor = vec4( liveworx );
		}
		else  { gl_FragColor = vec4( 1.0, 1.0, 1.0, alpha ); }		
	}
	 					
}