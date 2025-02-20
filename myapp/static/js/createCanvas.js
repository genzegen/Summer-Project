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


    // creating room
    const createBtn = document.getElementById("create-btn");
    const roomLength = document.getElementById("room-length");
    const roomBreadth = document.getElementById("room-breadth");
    const roomHeight = 15;

    const templates = {
        standard: {length: 12, breadth: 10},
        master: { length: 16, breadth: 14 },
        living: { length: 20, breadth: 15 }
    };

    document.querySelectorAll(".room-template-btn").forEach(button => {
        button.addEventListener("click", function () {

            document.querySelectorAll(".room-template-btn").forEach(btn => btn.classList.remove('active'));
    
            this.classList.add('active');
    
            const templateId = this.id;
    
            if (templates[templateId]) {
                roomLength.value = templates[templateId].length;
                roomBreadth.value = templates[templateId].breadth;
            }
        });
    });
    

    // Creating floor
    let floorMesh;
    let walls = [];
    let roomCreated = false;

    // Create button functionality
    createBtn.addEventListener("click", event => {
        if (roomCreated) {
            showErrorDialog("A room has already been created. Please reset to create a new one.");
            return;
        }

        const length = parseFloat(roomLength.value) * 2;
        const breadth = parseFloat(roomBreadth.value) * 2;

        console.log("Creating floor with:", length, breadth);
        createFloor(length, breadth);
    });

    function showErrorDialog(message) {
        alert(message);
    }

    const floorColorInput = document.getElementById("floor-color");
    const wallColorInput = document.getElementById("wall-color");

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
        floorMesh.userData.ground = true;
        roomCreated = true;

        createWalls(roomLength, roomBreadth);
        walls.forEach(wall => createScene.add(wall));

        createRoomGrid(roomLength, roomBreadth);
        createScene.add(floorMesh);
    }

    // Function to create walls
    function createWalls(roomLength, roomBreadth) {
        const wallMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(wallColorInput.value) });
    
        // Create walls for the room
        walls = [
            new THREE.Mesh(new THREE.BoxGeometry(roomLength, roomHeight, 1), wallMaterial),  // Back Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, roomBreadth), wallMaterial),  // Left Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, roomBreadth), wallMaterial)   // Right Wall
        ];
    
        // Positioning the walls
        walls[0].position.set(0, roomHeight / 2 + 2, -roomBreadth / 2 - 0.5); // Back wall
        walls[1].position.set(-roomLength / 2 - 0.5, roomHeight / 2 + 2, 0); // Left wall
        walls[2].position.set(roomLength / 2 + 0.5, roomHeight / 2 + 2, 0);  // Right wall
    
        // Name the walls for easy identification
        walls[0].name = "wall-back";
        walls[1].name = "wall-left";
        walls[2].name = "wall-right";
    
        // Add floor and walls to the scene
        createScene.add(floorMesh, ...walls);

        console.log('Room with walls created!');
    }
    

    floorColorInput.addEventListener("input", () => {
        if(floorMesh) {
            floorMesh.material.color.set(floorColorInput.value);
        }
    })

    wallColorInput.addEventListener("input", () => {
        const newColor = wallColorInput.value;
        walls.forEach(wall => {
            wall.material.color.set(newColor);
        });
    });

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

    const resetBtn = document.getElementById("clear-btn");
    resetBtn.addEventListener("click", (event) => {
        resetRoom();
    })

    function resetRoom() {
        if (floorMesh) {
            // Remove and dispose of the floor
            createScene.remove(floorMesh);
            floorMesh.geometry.dispose();
            floorMesh.material.dispose();
            floorMesh = null;
            console.log("floor removed");
        }
    
        // Remove and dispose of the walls
        walls.forEach(wall => {
            createScene.remove(wall);
            wall.geometry.dispose();
            wall.material.dispose();
            console.log("walls removed");
        });
    
        // Clear the walls array
        walls = [];
    
        // Remove the room grid if it exists
        if (roomGrid) {
            createScene.remove(roomGrid);
            roomGrid.geometry.dispose();
            roomGrid.material.dispose();
            roomGrid = null;
            console.log("grid removed");
        }
    
        // Reset roomCreated flag
        roomCreated = false;
    }

    // Models import

    const loader = new GLTFLoader();

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
            furniture.position.set(position.x, 2.52, position.z);
            furniture.name = modelPath;

            furniture.traverse((child) => {
                if(child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            })

            createScene.add(furniture);
            draggableObjects.push(furniture);
            furniture.userData.draggable = true;
            
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
                { x: 0, y: 3, z: 0 },
                { x: 2, y: 3, z: 0 },
                { x: -3, y: 3, z: 0 },
                { x: 4, y: 3, z: 0 },
                { x: -4, y: 3, z: 0 },
                { x: 1, y: 3, z: -2 },
                { x: -1, y: 3, z: -2 }
            ];

            addFurniture(furnitureModels[index], positions[index]);
        });
    });
    

    document.getElementById("box").addEventListener("click", event => {
        createBox();
    })

    function createBox() {
        let scale = { x: 3, y: 3, z: 3 };
        let pos = { x: 0, y: 4, z:0 };

        let box = new THREE.Mesh(new THREE.BoxGeometry(),
            new THREE.MeshPhongMaterial({ color: 0xDC145C }));
        box.position.set(pos.x, pos.y, pos.z);
        box.scale.set(scale.x, scale.y, scale.z);

        box.userData.draggable = true;
        box.userData.name = "BOX";
        draggableObjects.push(box);
        createScene.add(box)
    }

    // dragging

    const draggableObjects = [];
    let dragControls;

    function setupDragControls() {
        dragControls = new DragControls(draggableObjects, createCamera, createRenderer.domElement);
    
        dragControls.addEventListener('dragstart', (event) => {
            controls.enabled = false;
        });
    
        dragControls.addEventListener('drag', (event) => {
            let object = event.object;

            // Get the half dimensions of the room
            const halfRoomLength = (parseFloat(roomLength.value) * 2) / 2;
            const halfRoomBreadth = (parseFloat(roomBreadth.value) * 2) / 2;

            const padding = 1.6;

            // Constrain X and Z positions within room boundaries
            object.position.x = Math.max(-halfRoomLength + padding, Math.min(halfRoomLength - padding, object.position.x));
            object.position.z = Math.max(-halfRoomBreadth + padding, Math.min(halfRoomBreadth - padding, object.position.z));

            // Keep the box at a fixed height
            object.position.y = 4;
        });
    
        dragControls.addEventListener('dragend', (event) => {
            controls.enabled = true;
        });
    }

    setupDragControls();

    animateCreate();
});
