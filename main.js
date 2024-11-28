import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';

// Scene, camera, renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 0.5;



const renderer = new THREE.WebGLRenderer(
    {antialias: true}
  );

renderer.setSize(window.innerWidth - 200, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
document.body.appendChild(renderer.domElement);



// Resize event listener
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth - 300, window.innerHeight);
    camera.aspect = (window.innerWidth - 300) / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Load environment map
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
    '/Standardd-Cube-Map/nx.png',
    '/Standardd-Cube-Map/px.png',
    '/Standardd-Cube-Map/ny.png',
    '/Standardd-Cube-Map/py.png',
    '/Standardd-Cube-Map/nz.png',
    '/Standardd-Cube-Map/pz.png',
]);
scene.background = environmentMap;
scene.environment = environmentMap;




// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Point light
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(0, 2, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// dat.GUI setup
const gui = new dat.GUI();
const settings = {
    lightIntensity: 1,
    modelRotation: 0,
    cameraZoom: 0.5,
};

// GUI settings
gui.add(settings, 'lightIntensity', 0, 2).name('Light Intensity').onChange((value) => {
  ambientLight.intensity = value;
});
gui.add(settings, 'modelRotation', 0, Math.PI * 2).name('Model Rotation');
gui.add(settings, 'cameraZoom', 0.1, 2).name('Camera Zoom').onChange((value) => {
  camera.position.z = value;
});


// OrbitControls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

// Add a large sphere for the panorama
const textureLoader = new THREE.TextureLoader();
textureLoader.load('/360.jpg', (texture) => {
    const sphereGeometry = new THREE.SphereGeometry(100, 64, 64);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
});

// Load the 3D model
const gltfLoader = new GLTFLoader();
let model; // Store model for rotation

gltfLoader.load(
    '/shoes/shoe.gltf',
    (gltf) => {
        model = gltf.scene;

        // Apply shadow settings to the model
        model.traverse((child) => {
          if (child.isMesh) {
            child.userData.originalMaterial = child.material; // Store original material
            child.material = new THREE.MeshStandardMaterial({
              map: child.material.map,
              envMap: environmentMap,
              roughness: 0.4,
              metalness: 0.2,
            }); // Set environment map for reflections
            child.material.needsUpdate = true; // Ensure the material is updated
          }
        });

        scene.add(model);
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the GLTF model:', error);
    }
);

// Handle part selection and color change
let selectedPart = null;
document.querySelectorAll('#part-list li').forEach((item) => {
    item.addEventListener('click', (event) => {
        document.querySelectorAll('#part-list li').forEach((li) => li.classList.remove('selected'));
        event.target.classList.add('selected');

        selectedPart = event.target.getAttribute('data-part');
    });
});

document.getElementById('color-picker').addEventListener('input', (event) => {
    const color = event.target.value;
    if (selectedPart) {
        scene.traverse((child) => {
            if (child.name === selectedPart) {
                child.material = new THREE.MeshStandardMaterial({ color: color });
                document.querySelector(`#part-list li[data-part="${selectedPart}"] .color-indicator`).style.backgroundColor = color;
            }
        });
    }
});



// Animation loop
function animate() {
  if (model) {
      model.rotation.y = settings.modelRotation; // Apply rotation setting
  }
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);