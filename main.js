import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Scene, camera, renderer setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 0.5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Add background
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('/360.jpg'); // Zorg dat het pad klopt
scene.background = backgroundTexture;

// Load textures for materials
const textures = {
  leather: textureLoader.load('/leather/textures/leather.png'),
  rubber: textureLoader.load('/rubber/textures/rubber.jpg'),
  denim: textureLoader.load('/denim/textures/denim.jpg'),
};

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

// Raycaster for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let model;
let hoveredPart = null;
let selectedPart = null;

// Load 3D model
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  '/shoes/shoe.gltf',
  (gltf) => {
    model = gltf.scene;

    // Zorg ervoor dat elke mesh een uniek materiaal krijgt
    model.traverse((child, index) => {
      if (child.isMesh) {
        child.userData.originalMaterial = child.material;
        child.material = child.material.clone(); // Clone materiaal om individuele aanpassingen mogelijk te maken
        if (!child.name) {
          child.name = `Part ${index}`; // Dynamische naamgeving indien niet aanwezig
        }
      }
    });

    scene.add(model);

    // Reset texture option
    function resetTextureOption() {
      document.getElementById('texture-picker').value = 'none'; // Reset textuur naar "none"
    }

    // Reset image upload option
    function resetImageUploadOption() {
      const imagePicker = document.getElementById('image-picker');
      imagePicker.value = ''; // Reset bestand naar standaard (geen geselecteerd bestand)
    }

    // Mouse move to hover
    window.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(model.children);

      if (intersects.length > 0) {
        if (hoveredPart !== intersects[0].object) {
          resetTextureOption(); // Reset alleen de textuur naar "none"
          if (hoveredPart && hoveredPart !== selectedPart) {
            hoveredPart.material.emissive.setHex(0x000000); // Reset hover
          }
          hoveredPart = intersects[0].object;
          if (hoveredPart !== selectedPart) {
            hoveredPart.material.emissive.setHex(0x555555); // Highlight hover
          }
        }
      } else if (hoveredPart && hoveredPart !== selectedPart) {
        hoveredPart.material.emissive.setHex(0x000000); // Reset hover
        hoveredPart = null;
      }
    });

    // Mouse click to select part
    window.addEventListener('click', () => {
      if (hoveredPart) {
        if (selectedPart) {
          selectedPart.material.emissive.setHex(0x000000); // Reset previous selection
        }
        selectedPart = hoveredPart;
        selectedPart.material.emissive.setHex(0x999999); // Highlight selected part

        // Reset texture and image upload options
        resetTextureOption(); // Reset textuur naar "none"
        resetImageUploadOption(); // Reset afbeelding-upload naar "No file chosen"

        // Update UI with selected part name
        const partName = selectedPart.name || "Unnamed part";
        document.getElementById('selected-part-name').textContent = partName;
        document.getElementById('config-options').style.display = 'block';

        // Toon afbeelding uploadopties
        document.getElementById('image-upload').style.display = 'block';
      }
    });

    // Color picker to change part color
    document.getElementById('color-picker').addEventListener('input', (event) => {
      if (selectedPart) {
        const color = event.target.value;
        selectedPart.material.color.set(color); // Direct de nieuwe kleur toepassen
        selectedPart.material.emissive.setHex(0x000000); // Reset emissive voor een schone kleurweergave
        selectedPart.material.needsUpdate = true; // Renderer waarschuwen
      }
    });

    // Texture picker to change part texture
    document.getElementById('texture-picker').addEventListener('change', (event) => {
      if (selectedPart) {
        const textureKey = event.target.value;

        if (textureKey === "none") {
          selectedPart.material.map = null; // Verwijder textuur
        } else {
          selectedPart.material.map = textures[textureKey]; // Pas textuur toe
        }

        selectedPart.material.needsUpdate = true; // Renderer waarschuwen
      }
    });

    // Image picker to upload and apply an image as texture
    document.getElementById('image-picker').addEventListener('change', (event) => {
      if (selectedPart) {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const uploadedTexture = new THREE.TextureLoader().load(e.target.result);

            // Toepassen van de afbeelding als textuur
            selectedPart.material.map = uploadedTexture;
            selectedPart.material.needsUpdate = true; // Renderer waarschuwen
          };
          reader.readAsDataURL(file);
        }
      } else {
        alert('Please select a part of the shoe first.');
      }
    });
  },
  undefined,
  (error) => {
    console.error('An error occurred while loading the GLTF model:', error);
  }
);

const placeOrderButton = document.getElementById('place-order');
placeOrderButton.addEventListener('click', () => {
  alert('Your custom shoe has been successfully ordered!');
});

// Animation loop
function animate() {
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);