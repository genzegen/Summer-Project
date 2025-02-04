import * as THREE from '/static/js/three.js-master/build/three.module.js';
import { GLTFLoader } from '/static/js/three.js-master/examples/jsm/loaders/GLTFLoader.js';

// Get the canvas element
const modelCanvas = document.getElementById('modelCanvas');

// Scene and Renderer setup
const modelScene = new THREE.Scene();
modelScene.background = null;

const modelCamera = new THREE.PerspectiveCamera(75, modelCanvas.clientWidth / modelCanvas.clientHeight, 0.1, 1000);
const modelRenderer = new THREE.WebGLRenderer({ canvas: modelCanvas, antialias: true, alpha: true });
modelRenderer.setClearColor(0x000000, 0);
modelRenderer.setSize(modelCanvas.clientWidth, modelCanvas.clientHeight);
modelRenderer.setPixelRatio(window.devicePixelRatio);

// Lighting
const directionalLight1 = new THREE.DirectionalLight(0xD9EAFD, 1);
directionalLight1.position.set(3, 5, 5);
modelScene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xD9EAFD, 1.5);
directionalLight2.position.set(10, 5, 5);
modelScene.add(directionalLight2);

// Load 3D model
const loader = new GLTFLoader();
let model;
loader.load(
    '/static/models/low_poly_room.glb',
    (gltf) => {
        model = gltf.scene;
        model.name = 'MyModel';
        modelScene.add(model);
        model.scale.set(0.01, 0.01, 0.01);
        model.position.set(0, -1, 0);
    },
    null,
    (error) => {
        console.error('Model loading failed:', error);
    }
);

// Set initial camera position
modelCamera.position.set(3, 1, 3);
modelCamera.lookAt(0, 0, 0);

// Animation variables
let rotateDirection = 1;
let isSpinning = false;
let spinStartTime = 0;
const spinDuration = 1500; // 1.5 second spin time
const redirectURL = '/getStarted';

// Start spinning when the button is clicked
document.querySelector('.button-18').addEventListener('click', () => {
    if (!isSpinning) {
        isSpinning = true;
        spinStartTime = Date.now();
    }
});

function animateBoyRoom() {
    requestAnimationFrame(animateBoyRoom);

    if (model) {
        if (isSpinning) {
            model.rotation.y += 0.2; // Fast spin

            if (Date.now() - spinStartTime > spinDuration) {
                isSpinning = false;
                setTimeout(() => {
                    window.location.href = redirectURL; // Redirect after spin
                }, 5);
            }
        } else {
            model.rotation.y += 0.01 * rotateDirection;

            if (model.rotation.y >= Math.PI / 4) {
                rotateDirection = -1;
            } else if (model.rotation.y <= -Math.PI / 4) {
                rotateDirection = 1;
            }
        }
    }

    modelRenderer.render(modelScene, modelCamera);
}
animateBoyRoom();

// Handle window resize
window.addEventListener('resize', () => {
    const width = modelCanvas.clientWidth;
    const height = modelCanvas.clientHeight;

    modelRenderer.setSize(width, height);
    modelCamera.aspect = width / height;
    modelCamera.updateProjectionMatrix();
});
