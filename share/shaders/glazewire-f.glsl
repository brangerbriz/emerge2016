precision mediump float;

uniform float time;
uniform int motionGate;

varying vec2 vUv;
varying vec3 vPos;
varying float vDepth;


float xWave(float t, float speed, float range, float size ){
	float st = abs( sin(t*speed) * range) - range/2.0 ;
	float x = ceil(vPos.x);
	float minSeg = ceil(640.0/50.0*(st-size/2.0));
	float maxSeg = ceil(640.0/50.0*(st+size/2.0));
	if( x >= minSeg && x <= maxSeg && vDepth > 0.6471 ) return 1.0;
	else return 0.3;
}

void main() {

	// float r = abs( sin(  vUv.x + sin(time*0.01) / 5.0 ) );
	// float g = abs( sin(  vUv.y + sin(time*0.01) / 4.0 ) );
	// float b = abs( sin( -vUv.x + sin(time*0.01) / 3.0 ) );

	// LiveWorx colors normalized
	vec3 red = vec3(0.905, 0.270, 0.004);
	vec3 teal = vec3(0.258, 0.745, 0.674);
	vec3 blue = vec3(0.0, 0.592, 0.804);
	vec3 yellow = vec3(1.0, 0.772, 0.184);
	
	// vec3 colorX = mix(teal, red, vUv.x);
	// vec3 colorY = mix(yellow, blue, vUv.y);
	// vec3 color = mix(colorX, colorY, abs(sin(time) + 	(sin(time) * 0.3)));
	// vec3 color = mix(colorX, colorY, sin(time)*0.05 );		

	vec3 color1 = mix( red, teal, vUv.x*2.096 );
	vec3 color2 = mix( yellow, blue, (vUv.x*2.0)-1.212 );
	vec3 color = mix( color1, color2, vUv.x );
	    
	// float r = abs( sin(color.r+sin(time)/5.0));
	// float g = abs( sin(color.g+sin(time)/4.0));
	// float b = abs( sin(color.b+sin(time)/3.0));  

	
	float alpha = xWave( time, 0.0005, 150.0, 20.0 );

	if( motionGate<=1 )	alpha = alpha;
	else if( motionGate==2 )	alpha = (vDepth<=0.6471) ? 0.0 : 1.0;

	// gl_FragColor = vec4( r, g, b, alpha );
	gl_FragColor = vec4(color, alpha);
		
}