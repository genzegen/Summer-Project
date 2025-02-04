// const canvas = document.getElementById('boy-roomCanvas');
// const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
// renderer.setSize(canvas.clientWidth, canvas.clientHeight);
// renderer.setPixelRatio(window.devicePixelRatio);

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
// camera.position.set(0, 2, 5);
// camera.lookAt(0, 0, 0);

// const ambientLight = new THREE.AmbientLight(0xffffff, 1);
// scene.add(ambientLight);

// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
// directionalLight.position.set(5, 10, 5);
// scene.add(directionalLight);

// const loader = new GLTFLoader();
// loader.load(
//     "{% static 'models/boyroom.glb' %}", 
//     (gltf) => {
//         console.log('Model loaded successfully:', gltf);
//         const model = gltf.scene;
//         scene.add(model);

//         model.position.set(0, 0, 0);
//         model.scale.set(1, 1, 1);

//         model.traverse((node) => {
//             if (node.isMesh) {
//                 node.material.transparent = false;
//                 node.material.opacity = 1;
//                 node.material.needsUpdate = true;
//             }
//         });

//         const animate = () => {
//             requestAnimationFrame(animate);
//             model.rotation.y += 0.01;
//             renderer.render(scene, camera);
//         };
//         animate();
//     },
//     undefined,
//     (error) => {
//         console.error('Error loading model:', error);
//     }
// );

// const handleResize = () => {
//     renderer.setSize(canvas.clientWidth, canvas.clientHeight);
//     camera.aspect = canvas.clientWidth / canvas.clientHeight;
//     camera.updateProjectionMatrix();
// };

// window.addEventListener('resize', handleResize);
// handleResize();
