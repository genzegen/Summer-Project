import * as THREE from '/static/js/three.js-master/build/three.module.js';
import { FontLoader } from '/static/js/three.js-master/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from '/static/js/three.js-master/examples/jsm/geometries/TextGeometry.js';

const canvas = document.getElementById('spinCubeCanvas');

// Set scene, camera, and renderer
const cubescene = new THREE.Scene();
const cubecamera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);    

// Initialize renderer and bind it to the canvas
const cuberenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
cuberenderer.setSize(canvas.clientWidth, canvas.clientHeight);
cuberenderer.setClearColor(0x000000, 0);  // Set the background color

// Lighting
// Add a stronger directional light to illuminate the cube
const directionalLight1 = new THREE.DirectionalLight(0xffffff, 3);  
directionalLight1.position.set(2, 2, 2);
cubescene.add(directionalLight1);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);  
directionalLight2.position.set(-3, -2, 0);
cubescene.add(directionalLight2);

// Optionally, you can add a point light for better lighting
const pointLight = new THREE.PointLight(0xffffff, 2, 6);
pointLight.position.set(2, 2, 2);
cubescene.add(pointLight);

// Create the cube
const cubegeometry = new THREE.BoxGeometry();
const cubematerial = new THREE.MeshStandardMaterial({
    color: 0x00d0ff,      // Cube color
    metalness: 0.9,         // Set to a higher value for shininess
    roughness: 0.35,       // Set low for a shiny surface
});
const cube = new THREE.Mesh(cubegeometry, cubematerial);
cubescene.add(cube);

// Cube borders
// const edgeGeometry = new THREE.EdgesGeometry(cubegeometry); // Create geometry for edges
// const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xdcdcdc });  // Color of the border
// const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);  // Line segments for edges
// cube.add(edges);

// Text on each face of the cube
const loader = new FontLoader();
loader.load("/static/fonts/gothicfont.json", function (font) {
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xdcdcdc });

    const positions = [
        { x: 0, y: 0, z: 0.5 },   // Front face
        { x: 0, y: 0, z: -0.5 },  // Back face
        { x: 0.5, y: 0, z: 0 },   // Right face
        { x: -0.5, y: 0, z: 0 },  // Left face
        { x: 0, y: 0.5, z: 0 },   // Top face
        { x: 0, y: -0.5, z: 0 },  // Bottom face
    ];

    const rotations = [
        { x: 0, y: 0, z: 0 },           // Front face
        { x: Math.PI, y: 0, z: 0 },     // Back face
        { x: 0, y: Math.PI / 2, z: 0 }, // Right face
        { x: 0, y: -Math.PI / 2, z: 0 },// Left face
        { x: -Math.PI / 2, y: 0, z: 0 },// Top face
        { x: Math.PI / 2, y: 0, z: 0 }, // Bottom face
    ];

    const textGeometry = new TextGeometry('Visualize', {
        font: font,
        size: 0.2,
        depth: 0.01,
    });

    // Center the text in the middle of the cube face
    textGeometry.computeBoundingBox();
    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

    positions.forEach((position, index) => {
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(position.x, position.y, position.z);
        textMesh.rotation.set(rotations[index].x, rotations[index].y, rotations[index].z);

        // Adjust the position to ensure the text is centered
        if (index === 0 || index === 1) {
            // Front and Back face (text aligned along Z axis)
            textMesh.position.x -= textWidth / 2;
            textMesh.position.y -= textHeight / 2;

            if (index === 1){
                textMesh.position.y += 0.15
            }
        
        } else if (index === 2 || index === 3) {
            // Right and Left face (text aligned along X axis)
            textMesh.position.y -= textHeight / 2;
            textMesh.position.z -= textWidth / 2;

            if (index === 2) {
                textMesh.position.z += 0.65;
            }

        } else if (index === 4 || index === 5) {
            // Top and Bottom face (text aligned along Y axis)
            textMesh.position.x -= textWidth / 2;
            textMesh.position.z -= textHeight / 2;

            if (index === 4){
                textMesh.position.z += 0.2;
            }
        }

        cube.add(textMesh);
    });
});

// Camera setup
cubecamera.position.z = 1.5;

// // Orbit Controls
// const controls = new THREE.OrbitControls(cubecamera, cuberenderer.domElement);

// Animation loop
function animateCube() {
    requestAnimationFrame(animateCube);

    // Rotate the cube on its X and Y axis
    cube.rotation.x += 0.008;
    cube.rotation.y -= 0.01;

    // Update controls
    // controls.update(); 

    // Render the scene from the perspective of the camera
    cuberenderer.render(cubescene, cubecamera);
}

// Start the animation loop
animateCube();

// Handle window resize (keep the canvas responsive)
window.addEventListener('resize', () => {
    cuberenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    cubecamera.aspect = canvas.clientWidth / canvas.clientHeight;
    cubecamera.updateProjectionMatrix();
});
