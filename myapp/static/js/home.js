import * as THREE from '/static/js/three.js-master/build/three.module.js';

// Targeting the specific canvas for particles
const particleCanvas = document.getElementById('particleCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: particleCanvas, alpha: true }); // Use the existing canvas
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0); // Transparent background

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Particle system setup
const particleCount = 800;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

// Screen bounds
const screenWidth = window.innerWidth / 100;
const screenHeight = window.innerHeight / 100;

// Initialize particle positions and velocities
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * screenWidth * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * screenHeight * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
}

particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Particle material
const material = new THREE.PointsMaterial({
    color: 0xffd2d2,
    size: 0.05,
    transparent: true,
    opacity: 0.8
});

// Create the particle system
const particleSystem = new THREE.Points(particles, material);
scene.add(particleSystem);

// Mouse interaction
const mouse = new THREE.Vector2(0, 0);
const maxRepulsionDistance = 4;
const repulsionStrength = 0.035;

// Track mouse movement
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation loop
function animateBackground() {
    requestAnimationFrame(animateBackground);

    const positions = particleSystem.geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        const px = positions[i3];
        const py = positions[i3 + 1];

        const dx = mouse.x * screenWidth - px;
        const dy = mouse.y * screenHeight - py;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const repulsionFactor = Math.max(0, (maxRepulsionDistance - distance) / maxRepulsionDistance);
        positions[i3] -= dx * repulsionStrength * repulsionFactor;
        positions[i3 + 1] -= dy * repulsionStrength * repulsionFactor;

        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];

        if (positions[i3] > screenWidth || positions[i3] < -screenWidth) velocities[i3] *= -1;
        if (positions[i3 + 1] > screenHeight || positions[i3 + 1] < -screenHeight) velocities[i3 + 1] *= -1;
        if (positions[i3 + 2] > 2 || positions[i3 + 2] < -2) velocities[i3 + 2] *= -1;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

animateBackground();

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
