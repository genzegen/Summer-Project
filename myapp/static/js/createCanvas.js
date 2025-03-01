import * as THREE from '/static/js/three.js-master/build/three.module.js';
import { OrbitControls } from '/static/js/three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/static/js/three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from '/static/js/three.js-master/examples/jsm/controls/DragControls.js';

document.addEventListener("DOMContentLoaded", function () {
    const createCanvas = document.getElementById("createCanvas");
    if (!createCanvas) {
        console.error("Canvas element not found!");
        return;
    }

    const createScene = new THREE.Scene();
    const createCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const createRenderer = new THREE.WebGLRenderer({ canvas: createCanvas });

    // Fog
    createScene.fog = new THREE.FogExp2(0x040c24, 0.008);
    createRenderer.setSize(window.innerWidth, window.innerHeight);
    createRenderer.setClearColor(0x040c24, 0.1);
    createRenderer.setClearAlpha(1.0);
    createRenderer.sortObjects = false;

    // OrbitControls
    const controls = new OrbitControls(createCamera, createRenderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minPolarAngle = Math.PI / 8;

    // Background grid
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
            vertices.push(i, -1, -size / 2, i, 0, size / 2);
            vertices.push(-size / 2, -1, i, size / 2, 0, i);
        }

        gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
        createScene.add(gridLines);
    }

    createGrid(gridSize, gridSegments);

    // Lightings
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

    // Camera position
    createCamera.position.set(0, 30, 60);
    createCamera.lookAt(0, 12, 0);

    // Rendering loop
    function animateCreate() {
        requestAnimationFrame(animateCreate);
        controls.update();
        createRenderer.render(createScene, createCamera);
    }

    // Window resize handling
    window.addEventListener("resize", () => {
        createCamera.aspect = window.innerWidth / window.innerHeight;
        createCamera.updateProjectionMatrix();
        createRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    let undoStack = [];
    let redoStack = [];
    function undo() {

    }
    function redo() {
        
    }

    // Creating room
    const createBtn = document.getElementById("create-btn");
    const roomLength = document.getElementById("room-length");
    const roomBreadth = document.getElementById("room-breadth");
    const roomHeight = 15;

    const templates = {
        standard: { length: 12, breadth: 10 },
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
        const errorContainer = document.querySelector(".error-container");
        const errorContent = document.querySelector(".error-content");
        errorContent.textContent = message;
        errorContainer.style.display = "flex";
        setTimeout(function () {
            errorContainer.style.display = "none";
        }, 2500);
    }

    const floorColorInput = document.getElementById("floor-color");
    const wallColorInput = document.getElementById("wall-color");

    function createFloor(roomLength, roomBreadth) {
        let position = { x: 0, y: 0, z: 0 };
        let scale = { x: roomLength, y: 1, z: roomBreadth };

        floorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
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
        const baseWallColor = new THREE.Color(wallColorInput.value);
        const leftWallColor = baseWallColor.clone();
        leftWallColor.multiplyScalar(0.7);
        const backWallColor = baseWallColor.clone();
        backWallColor.multiplyScalar(0.9);

        // Create walls for the room
        walls = [
            new THREE.Mesh(new THREE.BoxGeometry(roomLength, roomHeight, 1),
                new THREE.MeshBasicMaterial({ color: backWallColor })
            ),  // Back Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, roomBreadth),
                new THREE.MeshBasicMaterial({ color: leftWallColor })
            ),  // Left Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, roomBreadth),
                new THREE.MeshBasicMaterial({ color: baseWallColor })
            )   // Right Wall
        ];

        // Positioning the walls
        walls[0].position.set(0, roomHeight / 2 - 0.5, -roomBreadth / 2 - 0.5); // Back wall
        walls[1].position.set(-roomLength / 2 - 0.5, roomHeight / 2 - 0.5, 0); // Left wall
        walls[2].position.set(roomLength / 2 + 0.5, roomHeight / 2 - 0.5, 0);  // Right wall

        // Name the walls for easy identification
        walls[0].name = "wall-back";
        walls[1].name = "wall-left";
        walls[2].name = "wall-right";

        // Add floor and walls to the scene
        createScene.add(floorMesh, ...walls);
        undoStack.push({
            type: 'add',
            objects: [floorMesh, ...walls] // Group the objects
        });
        redoStack = [];

        console.log('Room with walls created!');
    }

    floorColorInput.addEventListener("input", () => {
        if (floorMesh) {
            floorMesh.material.color.set(floorColorInput.value);
        }
    });

    wallColorInput.addEventListener("input", () => {
        const newColor = new THREE.Color(wallColorInput.value);
        const baseWallColor = new THREE.Color(newColor);
        const leftWallColor = baseWallColor.clone().multiplyScalar(0.7);
        const backWallColor = baseWallColor.clone().multiplyScalar(0.9);
        walls[0].material.color.set(backWallColor);
        walls[1].material.color.set(leftWallColor);
        walls[2].material.color.set(baseWallColor);
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
        const positionY = 0.51;

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
    });

    function showConfirmDialog(message) {
        return new Promise((resolve) => {
            const confirmContainer = document.querySelector(".confirm-container");
            const confirmMessage = document.querySelector(".confirm-content");
            const confirmYes = document.getElementById("confirmYes");
            const confirmCancel = document.getElementById("confirmCancel");

            confirmMessage.textContent = message;
            confirmContainer.style.display = "flex";

            confirmYes.onclick = () => {
                confirmContainer.style.display = "none";
                resolve(true);
            };

            confirmCancel.onclick = () => {
                confirmContainer.style.display = "none";
                resolve(false);
            };
        });
    }

    async function resetRoom() {
        // Confirm reset with the user
        const confirmReset = await showConfirmDialog("Are you sure you want to reset everything? This will remove all objects in the room.");
        if (!confirmReset) return; // Exit if the user does not confirm the reset

        // Save the current state of the scene for undo
        const snapshot = {
            type: 'reset',
            floorMesh: floorMesh ? {
                geometry: floorMesh.geometry.clone(),
                material: floorMesh.material.clone(),
                position: floorMesh.position.clone(),
            } : null,
            walls: walls.map(wall => ({
                geometry: wall.geometry.clone(),
                material: wall.material.clone(),
                position: wall.position.clone(),
                rotation: wall.rotation.clone(),
            })),
            draggableObjects: draggableObjects.map(obj => ({
                geometry: obj.geometry.clone(),
                material: obj.material.clone(),
                position: obj.position.clone(),
                rotation: obj.rotation.clone(),
            })),
            roomGrid: roomGrid ? {
                geometry: roomGrid.geometry.clone(),
                material: roomGrid.material.clone(),
                position: roomGrid.position.clone(),
            } : null,
        };

        // Remove the floor, if it exists
        if (floorMesh) {
            createScene.remove(floorMesh);
            floorMesh = null;
        }

        // Remove draggable objects
        draggableObjects.forEach(obj => {
            createScene.remove(obj);
        });
        draggableObjects = [];

        // Remove walls
        walls.forEach(wall => {
            createScene.remove(wall);
        });
        walls = [];

        // Remove room grid
        if (roomGrid) {
            createScene.remove(roomGrid);
            roomGrid = null;
        }

        // Push the snapshot to the undo stack
        undoStack.push(snapshot);
        redoStack = []; // Clear the redo stack

        roomCreated = false;
        console.log("Room reset successfully.");
    }

    // Models import
    const loader = new GLTFLoader();
    let draggableObjects = [];
    let dragControls;
    let selectedObject = null;

    async function addFurniture(modelPath, position) {
        if (!roomCreated) {
            await showErrorDialog("Please create a room before adding furniture.");
            return;
        }

        loader.load(modelPath, function (gltf) {
            const model = gltf.scene;
            console.log("Model loaded:", modelPath);

            const bbox = new THREE.Box3().setFromObject(model);
            const size = bbox.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scaleFactor = 4 / maxSize;
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);

            const scaleMultipliers = {
                bed: 2.5,
                wardrobe: 2,
                chair: 1.2,
                lamp: 1.5,
                carpet: 2,
                sofa: 2.5,
                pc: 1.5,
                table: 1.5
            };

            for (let key in scaleMultipliers) {
                if (modelPath.includes(key)) {
                    model.scale.multiplyScalar(scaleMultipliers[key]);
                    break;
                }
            }

            const scaledBbox = new THREE.Box3().setFromObject(model);
            const scaledSize = scaledBbox.getSize(new THREE.Vector3());
            const center = new THREE.Vector3();
            scaledBbox.getCenter(center);

            const minY = scaledBbox.min.y; // Get lowest point of model
            model.position.sub(center); // Center the model
            model.position.y -= minY; // Align bottom to y = 0 in container

            const containerGeometry = new THREE.BoxGeometry(scaledSize.x, scaledSize.y, scaledSize.z);
            const containerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, visible: false });
            const containerCube = new THREE.Mesh(containerGeometry, containerMaterial);

            containerCube.add(model);

            const floorY = 2.5; // Top surface of your floor
            containerCube.position.set(position.x, floorY + (scaledSize.y / 2), position.z); // Correct Y-position

            containerCube.userData.halfWidth = scaledSize.x / 2;
            containerCube.userData.halfDepth = scaledSize.z / 2;

            containerCube.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // saveSnapshot();
            createScene.add(containerCube);
            draggableObjects.push(containerCube);

            undoStack.push({ type: 'add', object: containerCube });
            redoStack = [];

            containerCube.userData.draggable = true;
            containerCube.userData.name = "furniture";
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
                "/static/models/furnitures/lamp.glb",
                "/static/models/furnitures/wardrobe.glb",
                "/static/models/furnitures/wardrobe2.glb",
                "/static/models/furnitures/carpet1.glb",
                "/static/models/furnitures/carpet2.glb",
                "/static/models/furnitures/sofa1.glb",
                "/static/models/furnitures/sofa2.glb",
                "/static/models/furnitures/pc.glb",
                "/static/models/furnitures/table1.glb",
                "/static/models/furnitures/table2.glb",
            ];
            const defaultPosition = { x: 0, y: 5, z: 0 };
            addFurniture(furnitureModels[index], defaultPosition);
        });
    });

    // Dragging setup with highlight effect
    function setupDragControls() {
        dragControls = new DragControls(draggableObjects, createCamera, createRenderer.domElement);

        dragControls.addEventListener("dragstart", (event) => {
            controls.enabled = false;
            const object = event.object;

            // Add outline effect
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x00ff00); // Green highlight
                }
            });

        });

        dragControls.addEventListener("drag", (event) => {
            let object = event.object;

            // Get the half dimensions of the room
            const halfRoomLength = parseFloat(roomLength.value);
            const halfRoomBreadth = parseFloat(roomBreadth.value);
            const padding = 0.3;

            // Recalculate bounding box dynamically
            const bbox = new THREE.Box3().setFromObject(object);
            const size = bbox.getSize(new THREE.Vector3());

            const halfWidth = size.x / 2;
            const halfDepth = size.z / 2;
            const halfHeight = size.y / 2;

            // Update userData for consistent constraints
            object.userData.halfWidth = halfWidth;
            object.userData.halfDepth = halfDepth;
            object.userData.halfHeight = halfHeight;

            // Constrain movement within room boundaries
            object.position.x = Math.max(
                -halfRoomLength + padding + halfWidth,
                Math.min(halfRoomLength - padding - halfWidth, object.position.x)
            );

            object.position.z = Math.max(
                -halfRoomBreadth + padding + halfDepth,
                Math.min(halfRoomBreadth - padding - halfDepth, object.position.z)
            );

            // Ensure furniture stays on top of the floor
            const floorY = 0.5; // Adjust if needed
            object.position.y = floorY + halfHeight;
        });

        dragControls.addEventListener("dragend", (event) => {
            controls.enabled = true;
            const object = event.object;

            // Remove outline effect
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x000000); // Reset to normal
                }
            });
        });
    }

    setupDragControls();

    createRenderer.domElement.addEventListener("click", onClick, false);

    function onClick(event) {
        event.preventDefault();

        // Calculate normalized device coordinates
        const rect = createRenderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, createCamera);

        // Intersect with draggable objects (check children as well)
        const intersects = raycaster.intersectObjects(draggableObjects, true);

        if (intersects.length > 0) {
            // Traverse up to the parent that has the draggable flag
            let object = intersects[0].object;
            while (object.parent && !object.userData.draggable) {
                object = object.parent;
            }

            if (selectedObject && selectedObject !== object) {
                selectedObject.traverse(child => {
                    if (child.isMesh) {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                });
            }

            selectedObject = object;

            // Highlight selected object
            selectedObject.traverse(child => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x00ff00);
                }
            });
        } else {
            if (selectedObject) {
                selectedObject.traverse(child => {
                    if (child.isMesh) {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                });
                selectedObject = null;
            }
        }
    }

    function removeFurniture(object) {
        createScene.remove(object);
        undoStack.push({ type: 'remove', object: object });
        redoStack = [];

        console.log("Furniture removed:", object);
    }

    window.addEventListener("keydown", (event) => {
        if (!selectedObject) return;

        switch (event.key) {
            case "ArrowLeft":
                selectedObject.rotation.y -= 0.1;
                break;
            case "ArrowRight":
                selectedObject.rotation.y += 0.1;
                break;
            case "Delete":
                removeFurniture(selectedObject);
                return;
            default:
                return;
        }

        // Recalculate bounding box after rotation
        const bbox = new THREE.Box3().setFromObject(selectedObject);
        const size = bbox.getSize(new THREE.Vector3());

        selectedObject.userData.halfWidth = size.x / 2;
        selectedObject.userData.halfDepth = size.z / 2;
        selectedObject.userData.halfHeight = size.y / 2;

        // Ensure it stays inside boundaries after rotating
        const halfRoomLength = parseFloat(roomLength.value);
        const halfRoomBreadth = parseFloat(roomBreadth.value);
        const padding = 0.3;

        selectedObject.position.x = Math.max(
            -halfRoomLength + padding + selectedObject.userData.halfWidth,
            Math.min(halfRoomLength - padding - selectedObject.userData.halfWidth, selectedObject.position.x)
        );

        selectedObject.position.z = Math.max(
            -halfRoomBreadth + padding + selectedObject.userData.halfDepth,
            Math.min(halfRoomBreadth - padding - selectedObject.userData.halfDepth, selectedObject.position.z)
        );
    });

    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");

    undoBtn.addEventListener("click", undo);
    redoBtn.addEventListener("click", redo);

    animateCreate();
});