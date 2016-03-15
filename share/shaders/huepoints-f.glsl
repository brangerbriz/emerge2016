uniform sampler2D map;
uniform float motion;

uniform float param1;
uniform float param2;
uniform float param3;

varying vec2 vUv;
varying float vDepth;


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

	float threshold = 0.5; // MIGHT NEED TO ADJUST AT VENUE
	
	float d = scale( vDepth, 0.6471, 1.0, 0.0, 1.0 );				

	float alpha;
	if(vDepth <= 0.65 ) alpha = 0.0;
	else alpha = d;
	
	float startAngle = 270.0;
	float endAngle = 360.0;
	if( motion > threshold ) startAngle = startAngle * motion * 10.0;
	float angle = scale( vDepth, 0.6471, 1.0, startAngle, endAngle );
	
	gl_FragColor = vec4( hsv2rgb( angle, 1.0, 1.0 ), alpha );
}