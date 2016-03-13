uniform float time;

varying vec2 vUv;
varying vec3 vPos;
varying float vDepth;

float wirespeed = 0.0005;
float wirerange = 150.0;
float wiresize = 20.0;

float xWave(float t, float val){
	float st = abs( sin(t*wirespeed) * wirerange) - wirerange/2.0 ;
	float x = ceil(vPos.x);
	float minSeg = ceil(640.0/50.0*(st-wiresize/2.0));
	float maxSeg = ceil(640.0/50.0*(st+wiresize/2.0));
	if( x >= minSeg && x <= maxSeg && vDepth > 0.6471 ) return val;
	else return 0.0;
}

void main() {

	float r = abs( sin(  vUv.x + sin(time*0.01) / 5.0 ) );
	float g = abs( sin(  vUv.y + sin(time*0.01) / 4.0 ) );
	float b = abs( sin( -vUv.x + sin(time*0.01) / 3.0 ) );
	gl_FragColor = vec4( r, g, b, xWave(time,1.0) );
	
}