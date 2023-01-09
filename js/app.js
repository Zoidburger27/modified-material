import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import gsap from "gsap";
// import GUI from 'lil-gui'; 


/*
npm i @parcel/config-default gsap three lil-gui
npx parcel ./index.html
*/ 


//texture paths
import tex1 from "../assets/textures/01_basecolor.jpg"
import tex1Normal from "../assets/textures/01_normal.jpg"
import tex2 from "../assets/textures/02_basecolor.jpg"
import tex2Normal from "../assets/textures/02_normal.jpg"
import alpha1 from "../assets/alphas/1.jpg"
import alpha2 from "../assets/alphas/2.jpg"
import alpha3 from "../assets/alphas/3.jpg"

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(0, 0, 2);

    this.aspect = this.width / this.height;

    this.textureLoader = new THREE.TextureLoader()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;
    this.loadTextures()
    this.addObjects();
    this.addLights();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    // this.gui = new dat.GUI();
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();


  }

  addObjects() {


    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {value: new THREE.Vector2(1, 1)},
        uTexture1 : { value: this.texture1 },
        uTexture2 : { value: this.texture2 },
        uAlpha1 : { value: this.alpha1 },
        uAlpha2 : { value: this.alpha2 },
        uAlpha3 : { value: this.alpha3 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent:true
    });


    //Testing the same functionality from shadermaterial but with a MeshStandardMaterial
    this.modifiedMaterial = new THREE.MeshStandardMaterial({
      // map: this.texture1,
      // normalMap: this.texture1Normal,
      // alphaMap: this.alpha3,
      transparent: true,
    });
    this.modifiedMaterial.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        ...{
          time: { type: "f", value: 0 },
          resolution: { type: "v4", value: new THREE.Vector4() },
          uvRate1: { value: new THREE.Vector2(1, 1) },
          uTexture1: { value: this.texture1 },
          uTexture2: { value: this.texture2 },
          uAlpha1: { value: this.alpha1 },
          uAlpha2: { value: this.alpha2 },
          uAlpha3: { value: this.alpha3 },
        },
      };

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>
        varying vec2 vUv;
      `
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        vUv = uv;
      `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `
        #include <common>

        uniform sampler2D uTexture1;
        uniform sampler2D uTexture2;
        uniform sampler2D uAlpha1;
        uniform sampler2D uAlpha2;
        uniform sampler2D uAlpha3;
        varying vec2 vUv;

        `
      );


      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <transmission_fragment>",
        `
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
      
        // mixing 2 textures based on alphas ( any overlapped area will be overwritten by tex2 the rest of the plane should be invisible-)
        vec4 mixedResult = mix(tex1,tex2,tex2.a);

        totalDiffuse = totalDiffuse * mixedResult.rgb;
        
        `
      )
    }


    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    // this.geometry = new THREE.SphereGeometry(1,36,36);
    this.mesh = new THREE.Mesh(
      this.geometry,
      this.material
      );
    this.scene.add(this.mesh);
  }

  loadTextures(){
    this.texture1 = this.textureLoader.load(tex1)
    this.texture2 = this.textureLoader.load(tex2)
    this.texture1Normal = this.textureLoader.load(tex1Normal)
    this.texture2Normal = this.textureLoader.load(tex2Normal)

    this.alpha1 = this.textureLoader.load(alpha1)
    this.alpha2 = this.textureLoader.load(alpha2)
    this.alpha3 = this.textureLoader.load(alpha3)

    this.texture1.flipY = false
    this.texture2.flipY = false
    this.texture1Normal.flipY = false
    this.texture2Normal.flipY = false
    // this.alpha1.flipY = false
    // this.alpha2.flipY = false
    // this.alpha3.flipY = false

    // this.texture1.encoding = THREE.sRGBEncoding
    // this.texture2.encoding = THREE.sRGBEncoding
    // this.texture1Normal.encoding = THREE.sRGBEncoding
    // this.texture2Normal.encoding = THREE.sRGBEncoding
    // this.alpha1.encoding = THREE.sRGBEncoding
    // this.alpha2.encoding = THREE.sRGBEncoding
    // this.alpha3.encoding = THREE.sRGBEncoding
  }

  

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  addLights(){
    const ambientLight = new THREE.AmbientLight( 0x404040, 0.7 );
    this.scene.add(ambientLight)

    const pointLight = new THREE.PointLight( 0xffffff, 1);
    pointLight.position.set( 15,15,15 );

    this.scene.add(pointLight)
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    // this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});
