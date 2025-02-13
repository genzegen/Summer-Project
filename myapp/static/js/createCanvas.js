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

    let roomGrid = null; // global for toggling
    function createRoomGrid(roomSizeX, roomSizeZ) {
        const gridMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            opacity: 0.6,
            transparent: true,
        });

        const gridGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const positionY = 2.1;
        const step = 4; // Grid line every 2 units

        // Vertical lines (along X-axis)
        for (let i = -roomSizeX / 2; i <= roomSizeX / 2; i += step) {
            vertices.push(i, positionY, -roomSizeZ / 2, i, positionY, roomSizeZ / 2);
        }

        // Horizontal lines (along Z-axis)
        for (let i = -roomSizeZ / 2; i <= roomSizeZ / 2; i += step) {
            vertices.push(-roomSizeX / 2, positionY, i, roomSizeX / 2, positionY, i);
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roomGrid = new THREE.LineSegments(gridGeometry, gridMaterial);
        createScene.add(roomGrid);
    }

    // ROOM block

    document.getElementById("create-btn").addEventListener("click", createRoom);

    const lengthInput = document.getElementById("room-length");
    const breadthInput = document.getElementById("room-breadth");
    const floorColorInput = document.getElementById("floor-color");
    const wallColorInput = document.getElementById("wall-color");

    let roomGroup = null; // Holds the room to prevent multiple creations

    function createRoom() {
        // saveState();

        let length = parseFloat(lengthInput.value);
        let breadth = parseFloat(breadthInput.value);
        let height = 16;

        if (!length || !breadth || length <= 0 || breadth <= 0) {
            alert("Please enter valid length and breadth.");
            return;
        }

        if (roomGroup) {
            createScene.remove(roomGroup);
        }

        roomGroup = new THREE.Group();

        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(length, 1, breadth),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(floorColorInput.value) })
        );
        floor.position.set(0, 1.5, 0);
        floor.name = "floor";

        const wallMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(wallColorInput.value) });

        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(length, height, 1), wallMaterial),  // Back Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, height, breadth), wallMaterial), // Left Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, height, breadth), wallMaterial)  // Right Wall
        ];

        walls[0].position.set(0, height / 2 + 1, -breadth / 2);  // Back wall
        walls[1].position.set(-length / 2 - 0.5, height / 2 + 1, 0); // Left wall
        walls[2].position.set(length / 2 + 0.5, height / 2 + 1, 0);  // Right wall

        walls[0].name = "wall-back";
        walls[1].name = "wall-left";
        walls[2].name = "wall-right";

        roomGroup.add(floor, ...walls);

        createScene.add(roomGroup);
        createRoomGrid(length, breadth);
        console.log(`Room of ${length} x ${breadth} created!`);
    }

    function updateColors() {
        if (!roomGroup) return;

        const newFloorColor = new THREE.Color(floorColorInput.value);
        const newWallColor = new THREE.Color(wallColorInput.value);

        roomGroup.children.forEach((object) => {
            if (object.isMesh && object.material && object.material.color) {
                if (object.name.includes("floor")) {
                    object.material.color.set(newFloorColor);
                }
                if (object.name.includes("wall")) {
                    object.material.color.set(newWallColor);
                }
            }
        });
    }

    floorColorInput.addEventListener("input", updateColors);
    wallColorInput.addEventListener("input", updateColors);

    // MODELS import

    const loader = new GLTFLoader();

    function addFurniture(modelPath, position) {
        loader.load(modelPath, function (gltf) {
            const furniture = gltf.scene;

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

            draggableObjects.push(furniture);
            createScene.add(furniture);

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

    // MODELS dragging and moving

    let selectedObject = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const draggableObjects = [];

    window.addEventListener("click", (event) => {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerHeight) * 2 - 1;
        mouse.y = (event.clientY / window.innerWidth) * 2 + 1;

        raycaster.setFromCamera(mouse, createCamera);

        const intersects = raycaster.intersectObjects(draggableObjects, true);

        if (intersects.length > 0) {
            selectedObject = intersects[0].object.parent;
            console.log("Selected: ", selectedObject.name);
        } else {
            selectedObject = null;
        }
    });

    const dragControls = new DragControls(draggableObjects, createCamera, createRenderer.domElement);

    dragControls.addEventListener('dragstart', function (event) {
        selectedObject = event.object;
        controls.enabled = false;
        console.log("Dragging:", selectedObject.name);
    });

    dragControls.addEventListener('drag', function (event) {
        if (event.object) {
            event.object.position.y = 2;
        }
    });

    dragControls.addEventListener('dragend', function () {
        selectedObject = null;
        controls.enabled = true;
    });

    // MODELS dragging and moving end
    
    const gridToggle = document.getElementById("grid-toggle");
    const gridStatus = document.getElementById("grid-status");

    // Ensure the grid is toggled correctly
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

    // **Lighting**
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    createScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(-13, 18, -40);
    createScene.add(directionalLight);

    // **Set Camera Position**
    createCamera.position.set(0, 30, 60);
    createCamera.lookAt(0, 10, 0);

    // **Render Loop**
    function animateCreate() {
        requestAnimationFrame(animateCreate);
        controls.update();
        createRenderer.render(createScene, createCamera);
    }
    animateCreate();

    // **Resize Handling**
    window.addEventListener("resize", () => {
        createCamera.aspect = window.innerWidth / window.innerHeight;
        createCamera.updateProjectionMatrix();
        createRenderer.setSize(window.innerWidth, window.innerHeight);
    });

});


