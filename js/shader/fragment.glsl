uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uAlpha1;
uniform sampler2D uAlpha2;
uniform sampler2D uAlpha3;
varying vec2 vUv;
void main()	{


	// textures
	vec4 tex1 = texture2D(uTexture1,vUv);
	vec4 tex2 = texture2D(uTexture2,vUv);
	vec4 alpha1 = texture2D(uAlpha1,vUv);
	vec4 alpha2 = texture2D(uAlpha2,vUv);
	vec4 alpha3 = texture2D(uAlpha3,vUv);

	// make a new alpha map by adding 2 alphas (  )
	vec4 newAlpha1 = clamp(alpha1 + alpha2, 0., 1.);
	vec4 newAlpha2 = clamp(alpha1 + alpha3, 0., 1.);


	//resassign texture with the new alphas ()
	tex1 = vec4(tex1.rgb,newAlpha1.x);
	tex2 = vec4(tex2.rgb,newAlpha2.x);

	// mixing 2 textures based on alphas ( any overlapped area will be overwritten by tex2 - this is expected result)
	// I need this result in modified MeshStandard or MeshBasic material, but I require the normal map too.
	vec4 mixedResult = mix(tex1,tex2,tex2.a);



	vec4 finalResult = mixedResult;

	gl_FragColor = finalResult;
}