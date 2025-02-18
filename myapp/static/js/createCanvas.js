import * as THREE from '/static/js/three.js-master/build/three.module.js';
import { OrbitControls } from '/static/js/three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/static/js/three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from '/static/js/three.js-master/examples/jsm/controls/DragControls.js';

document.addEventListener("DOMContentLoaded", function() {
    const createCanvas = document.getElementById("createCanvas");

    if (!createCanvas) {
        console.error("Canvas element not found!");
        return;
    }

    const createScene = new THREE.Scene();
    const createCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const createRenderer = new THREE.WebGLRenderer({ canvas: createCanvas });

    // fog
    createScene.fog = new THREE.FogExp2(0x040c24, 0.008); 

    createRenderer.setSize(window.innerWidth, window.innerHeight);
    createRenderer.setClearColor(0x040c24, 0.1);
    createRenderer.setClearAlpha(1.0);
    createRenderer.sortObjects = false;

    // orbitcontrols
    const controls = new OrbitControls(createCamera, createRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minPolarAngle = Math.PI / 4;

    // background grid
    const gridSize = 1000;
    const gridSegments = 100;
    function createGrid(size, segments) {
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.35,
            transparent: true,  
            depthTest: true,
            depthWrite: false
        });

        const gridGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const step = size / segments;

        for (let i = -size / 2; i <= size / 2; i += step) {
            vertices.push(i, 0, -size / 2, i, 0, size / 2);
            vertices.push(-size / 2, 0, i, size / 2, 0, i);
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
        createScene.add(gridLines);
    }
    createGrid(gridSize, gridSegments);

    // lightings
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    createScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(0, 17, -40);
    directionalLight.castShadows = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -70;
    directionalLight.shadow.camera.right = 70;
    directionalLight.shadow.camera.top = 70;
    directionalLight.shadow.camera.bottom = -70;
    createScene.add(directionalLight);

    // camera position
    createCamera.position.set(0, 30, 60);
    createCamera.lookAt(0, 10, 0);

    // rendering loop
    function animateCreate() {
        requestAnimationFrame(animateCreate);
        controls.update();
        createRenderer.render(createScene, createCamera);
    }

    // window resize handling
    window.addEventListener("resize", () => {
        createCamera.aspect = window.innerWidth / window.innerHeight;
        createCamera.updateProjectionMatrix();
        createRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    const createBtn = document.getElementById("create-btn");
    const roomLength = document.getElementById("room-length");
    const roomBreadth = document.getElementById("room-breadth");
    const roomHeight = 15;

    // Create button functionality
    createBtn.addEventListener("click", event => {
        const length = parseFloat(roomLength.value);
        const breadth = parseFloat(roomBreadth.value);

        console.log("Creating floor with:", length, breadth);
        createFloor(length, breadth);
    });

    // Creating floor
    let floorMesh;
    const floorColorInput = document.getElementById("floor-color");

    function createFloor (roomLength, roomBreadth) {
        let position = { x: 0, y: 2, z: 0 };
        let scale = { x: roomLength, y: 1, z: roomBreadth};

        floorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1,1,1),
            new THREE.MeshPhongMaterial({ color: floorColorInput.value })
        );
        floorMesh.position.set(position.x, position.y, position.z);
        floorMesh.scale.set(scale.x, scale.y, scale.z);
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        createRoomGrid(roomLength, roomBreadth);
        createScene.add(floorMesh);
    }

    floorColorInput.addEventListener("input", () => {
        if(floorMesh) {
            floorMesh.material.color.set(floorColorInput.value);
        }
    })

    // Grid above floor
    let roomGrid = null; // global for toggling
    function createRoomGrid(roomSizeX, roomSizeZ) {
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.6,
            transparent: true,
        });

        const gridGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const positionY = 2.51;
        
        const cells = 10;

        const stepX = roomSizeX / cells;
        const stepZ = roomSizeZ / cells;

        // Vertical lines (along X-axis)
        for (let i = -roomSizeX / 2; i <= roomSizeX / 2; i += stepX) {
            vertices.push(i, positionY, -roomSizeZ / 2, i, positionY, roomSizeZ / 2);
        }

        // Horizontal lines (along Z-axis)
        for (let i = -roomSizeZ / 2; i <= roomSizeZ / 2; i += stepZ) {
            vertices.push(-roomSizeX / 2, positionY, i, roomSizeX / 2, positionY, i);
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roomGrid = new THREE.LineSegments(gridGeometry, gridMaterial);
        createScene.add(roomGrid);
        console.log("Room grid created with 10x10 cells");
    }

    const gridToggle = document.getElementById("grid-toggle");
    const gridStatus = document.getElementById("grid-status");

    gridToggle.addEventListener("change", function () {
        if (!roomGrid) {
            console.warn("No room grid to toggle.");
            return;
        }

        if (gridToggle.checked) {
            gridStatus.textContent = "Turn off the grid";
            createScene.add(roomGrid);
            console.log("Grid ON");
        } else {
            gridStatus.textContent = "Turn on the grid";
            createScene.remove(roomGrid);
            console.log("Grid OFF");
        }
    });

    // Models import
    const loader = new GLTFLoader();
    const draggableObjects = [];

    function addFurniture(modelPath, position) {
        loader.load(modelPath, function (gltf) {
            const furniture = gltf.scene;
            console.log("Model loaded:", modelPath);

            // Compute the bounding box
            const bbox = new THREE.Box3().setFromObject(furniture);
            const size = bbox.getSize(new THREE.Vector3());

            // Normalize size to a uniform scale
            const maxSize = Math.max(size.x, size.y, size.z);
            const scaleFactor = 4 / maxSize; // Normalize to 1 unit

            furniture.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Apply additional scaling based on furniture type
            if (modelPath.includes("bed")) {
                furniture.scale.multiplyScalar(2.5); // Beds should be bigger
            } else if (modelPath.includes("wardrobe")) {
                furniture.scale.multiplyScalar(2); // Wardrobes should be large
            } else if (modelPath.includes("chair")) {
                furniture.scale.multiplyScalar(1.2); // Chairs should be standard size
            } else if (modelPath.includes("lamp")) {
                furniture.scale.multiplyScalar(1.5); // Lamps slightly bigger
            } else if (modelPath.includes("carpet")) {
                furniture.scale.multiplyScalar(3); // Carpets should be wider
            } else {
                furniture.scale.multiplyScalar(1.5); // Default scale
            }

            // Set position
            furniture.position.set(position.x, position.y, position.z);
            furniture.name = modelPath;

            furniture.traverse((child) => {
                if(child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })

            createScene.add(furniture);
            draggableObjects.push(furniture);
            
        }, undefined, function (error) {
            console.error("Error loading model:", error);
        });
    }

    document.querySelectorAll(".furniture-icons").forEach((button, index) => {
        button.addEventListener("click", () => {
            const furnitureModels = [
                "/static/models/furnitures/chair1.glb",
                "/static/models/furnitures/chair2.glb",
                "/static/models/furnitures/bed.glb",
                "/static/models/furnitures/wardrobe.glb",
                "/static/models/furnitures/lamp.glb",
                "/static/models/furnitures/carpet1.glb",
                "/static/models/furnitures/carpet2.glb"
            ];

            const positions = [
                { x: 0, y: 2, z: 0 },
                { x: 2, y: 2, z: 0 },
                { x: -3, y: 2, z: 0 },
                { x: 4, y: 2, z: 0 },
                { x: -4, y: 2, z: 0 },
                { x: 1, y: 2, z: -2 },
                { x: -1, y: 2, z: -2 }
            ];

            addFurniture(furnitureModels[index], positions[index]);
        });
    });
    
    // Drag controls
    let floorBounds = {
        minX: -roomLength / 2,
        maxX: roomLength / 2,
        minZ: -roomBreadth / 2,
        maxZ: roomBreadth / 2
    };

    const dragControls = new DragControls(draggableObjects, createCamera, createRenderer.domElement);

    dragControls.addEventListener('drag', function (event) {
        const object = event.object;

        // Constrain the object within the room boundaries (X and Z)
        object.position.x = Math.max(floorBounds.minX, Math.min(floorBounds.maxX, object.position.x));
        object.position.z = Math.max(floorBounds.minZ, Math.min(floorBounds.maxZ, object.position.z));

        // Optional: Snap the object to the floor (Y axis remains fixed)
        object.position.y = 2.6; // or whatever height you want the furniture to be at
    });

    animateCreate();
});
