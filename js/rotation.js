import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TWEEN } from "./tween.module.min.js";

const scene = new THREE.Scene();

const texture = new THREE.TextureLoader().load(
  "../models/low-angle-shot-mesmerizing-starry-sky.jpg"
);
scene.background = 0x1c2e4a;

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 16;

const canvas = document.getElementById("canvas");

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setPixelRatio(devicePixelRatio);
//renderer.setClearColor(0x1c2e4a,1)
renderer.setClearColor(0x000000, 0);
const size = 20;
const divisions = 20;

const gridHelper = new THREE.GridHelper(size, divisions);
//scene.add( gridHelper );

const loadingManager = new THREE.LoadingManager();

const progressContainer = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");

loadingManager.onProgress = function (url, loaded, total) {
  progressBar.style.width = (loaded / total) * 100 + "%";
};
loadingManager.onLoad = function (url, loaded, total) {
  progressContainer.style.display = "none";
  document.getElementById("start-button").style.display = "block";
};

document.getElementById("start-button").onclick = function () {
  document.getElementById("loadingscreen").classList.add("hidden");

  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: 0.5, z: 10 }, 1000) //{ x: 0, y:3, z:16 }
    .easing(TWEEN.Easing.Cubic.Out)
    .start();
};

const controls = new OrbitControls(camera, canvas);
controls.minPolarAngle = Math.PI / 2.3;
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.enablePan = false;
//controls.target.set(0,0,0);
//camera.position.z = 10
controls.rotateSpeed = 0.5;
controls.minDistance = 3;
controls.maxDistance = 17;
//controls.update();

const light = new THREE.AmbientLight(0xffffff, 0.9, 20);
scene.add(light);

const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set = (0, 0, 0);
scene.add(mesh);
mesh.position.set = (0, 0, 0);
scene.add(mesh);

const loader = new GLTFLoader(loadingManager);
let globe;
loader.load("./models/gardanah_fictional/scene.gltf", function (gltf) {
  var model = gltf.scene;
  //model.rotation.z = 0.28//for plant_saturn_fantasy
  gltf.scene.scale.set(0.003, 0.003, 0.003);
  //gltf.scene.scale.set(1,1,1)
  gltf.scene.position.set(0, -0.7, 0);
  scene.add(model);
  globe = model;
});

//let icon;

//loader.load("../models/tech_icon.glb", function (gltf) {
 // var model = gltf.scene;
  //model.rotation.z = 0.28//for plant_saturn_fantasy
 // model.rotation.x = Math.PI;
 // gltf.scene.scale.set(2.5, 2.5, 2.5);
  //gltf.scene.scale.set(1,1,1)
 // gltf.scene.position.set(-1, 1.5, 7);
 // scene.add(model);
//  icon = model;
//  icon.visible = false;
//});

let mixer;
let action;
let runner;
loader.load("./models/runner/scene.gltf", function (gltf) {
  var model = gltf.scene;
  model.position.set(0, -0.7, 0);
  gltf.scene.scale.set(0.35, 0.35, 0.35);
  scene.add(model);
  mixer = new THREE.AnimationMixer(model);
  action = mixer.clipAction(gltf.animations[0]);
  //action.setLoop( THREE.LoopOnce);
  //action.clampWhenFinished = true;
  action.timeScale = 0;
  action.enable = true;
  action.play();
  runner = model;
  gltf.scene.traverse(function (node) {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
});

var clock = new THREE.Clock();
let azimuthalAngle;
let orbitCircumference = 0;

controls.addEventListener("change", function () {
  azimuthalAngle = controls.getAzimuthalAngle();
});

let rotateSpeed = (function () {
  let lastPos, newPos, delta;

  function clear() {
    lastPos = null;
    delta = 0;
  }

  clear();

  return function () {
    newPos = controls.getAzimuthalAngle();
    if (lastPos != null) {
      delta = newPos - lastPos;
    }
    if (delta == 1 || delta == -1) delta = 0;
    if (delta < -1) {
      delta = -delta;
    }

    if (action) action.timeScale = delta * 100;

    lastPos = newPos;
  };
})();

let popups = document.getElementsByClassName("popup");

function movearound() {
  azimuthalAngle = controls.getAzimuthalAngle();
  orbitCircumference = azimuthalAngle / (Math.PI * 2);
  // console.log("azimuthal",azimuthalAngle)
  if (orbitCircumference < 0) {
    orbitCircumference = 0.5 + (0.5 + orbitCircumference);
  }

  if (azimuthalAngle >= 0.1 || azimuthalAngle < -0.1) {
    document.getElementById("instruction").classList.add("hidden");
  }

  for (let i = 0; i < popups.length; i++) {
    if (
      orbitCircumference >= 0.025 + i / popups.length &&
      orbitCircumference < 0.18 + i / popups.length
    ) {
      popups[i].classList.remove("hidden");
      popups[i].classList.add("visible");
    } else {
      popups[i].classList.add("hidden");
      popups[i].classList.remove("visible");
    }
  }

  if (runner) {
    runner.position.x = Math.sin(azimuthalAngle) * 6; //5 for plant_saturn_fictional
    runner.position.z = Math.cos(azimuthalAngle) * 6; //5 for plant_saturn_fictional
    runner.rotation.y = azimuthalAngle + Math.PI / 2;
  }

  rotateSpeed();
  window.requestAnimationFrame(movearound);
  renderer.render(scene, camera);
  controls.update();
  TWEEN.update();
  const delta = clock.getDelta();

  if (mixer /*!== undefined*/) {
    mixer.update(delta);
  }
}
movearound();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  renderer.render(scene, camera);

  window.requestAnimationFrame(animate);

  controls.update();
}

//animate()
