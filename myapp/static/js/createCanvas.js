import * as THREE from '/static/js/three.js-master/build/three.module.js';
import { OrbitControls } from '/static/js/three.js-master/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/static/js/three.js-master/examples/jsm/loaders/GLTFLoader.js';
import { DragControls } from '/static/js/three.js-master/examples/jsm/controls/DragControls.js';

document.addEventListener("DOMContentLoaded", async function () {
    const createCanvas = document.getElementById("createCanvas");
    if (!createCanvas) {
        console.error("Canvas element not found!");
        return;
    }

    const createScene = new THREE.Scene();
    const createCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const createRenderer = new THREE.WebGLRenderer({
        canvas: createCanvas,
        preserveDrawingBuffer: true
    });

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
    controls.maxDistance = 70;
    controls.minDistance = 10;


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
        checkCollisions();
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

    const ActionType = {
        MOVE: 'move',
        ROTATE: 'rotate',
        RESET: 'reset',
        ADD: 'add',
        DELETE: 'delete',
        SCALE: 'scale',
    }

    function saveScaleAction(object, previousScale, newScale) {
        const action = {
            type: ActionType.SCALE,
            object,
            data: { previousScale, newScale },
        };
        undoStack.push(action);
        redoStack = [];
    }

    function saveMoveAction(object, previousPosition, newPosition) {
        const action = {
            type: ActionType.MOVE,
            object,
            data: {previousPosition, newPosition},
        };
        undoStack.push(action);
        redoStack = [];
    }

    function saveRotateAction(object, previousRotation, newRotation) {
        const action = {
            type: ActionType.ROTATE,
            object,
            data: { previousRotation, newRotation },
        };
        undoStack.push(action);
        redoStack = [];
    }

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

    function saveRoomState() {
        const snapshot = {
            floorMesh: floorMesh ? floorMesh.clone() : null,
            walls: walls.map(wall => wall.clone()),
            draggableObjects: draggableObjects.map(obj => obj.clone()),
            roomGrid: roomGrid ? roomGrid.clone() : null,
            selectedObject: selectedObject ? selectedObject.clone() : null,
            roomCreated: roomCreated,
        };
        return snapshot;
    }

    function resetScene() {
        // Remove the floor mesh if it exists
        if (floorMesh) {
            createScene.remove(floorMesh);
            floorMesh = null;
        }
    
        // Remove all walls
        if (walls.length > 0) {
            walls.forEach(wall => {
                if (wall.parent === createScene) {
                    createScene.remove(wall);
                }
            });
            walls = []; // Clear the walls array
        }
    
        // Remove all draggable objects
        draggableObjects.forEach(obj => {
            createScene.remove(obj);
        });
        draggableObjects = []; // Clear the draggable objects array
    
        // Remove the room grid if it exists
        if (roomGrid) {
            createScene.remove(roomGrid);
            roomGrid = null;
        }
    
        // Deselect and remove highlight from the selected object
        if (selectedObject) {
            selectedObject.traverse(child => {
                if (child.isMesh) {
                    child.material.emissive.set(0x000000); // Remove highlight
                }
            });
            selectedObject = null;
        }
    
        // Reset the roomCreated flag
        roomCreated = false;
    }

    function restoreRoomState(snapshot) {
        // Restore the floor mesh
        if (snapshot.floorMesh) {
            createScene.add(snapshot.floorMesh);
            floorMesh = snapshot.floorMesh;
        }
    
        // Restore the walls
        snapshot.walls.forEach(wall => {
            createScene.add(wall);
        });
        walls = snapshot.walls;
    
        // Restore the draggable objects
        snapshot.draggableObjects.forEach(obj => {
            createScene.add(obj);
        });
        draggableObjects = snapshot.draggableObjects;
        setupDragControls();
    
        // Restore the room grid
        if (snapshot.roomGrid) {
            createScene.add(snapshot.roomGrid);
            roomGrid = snapshot.roomGrid;
        }
    
        // Restore the selected object
        if (snapshot.selectedObject) {
            selectedObject = snapshot.selectedObject;
        }
    
        // Restore the roomCreated flag
        roomCreated = snapshot.roomCreated;
    }

    async function resetRoom() {
        const confirmReset = await showConfirmDialog("Are you sure you want to reset everything? This will remove all objects in the room.");
        if (!confirmReset) return;
        
        const snapshot = saveRoomState();
        undoStack.push({ type: ActionType.RESET, snapshot });
        redoStack = []; // Clear the redo stack

        resetScene();

        console.log("Room reset successfully.");
    }

    function undo() {
        if (undoStack.length === 0) return;
    
        const action = undoStack.pop();
        redoStack.push(action);
    
        switch (action.type) {
            case ActionType.MOVE:
                action.object.position.copy(action.data.previousPosition);
                break;
            case ActionType.ROTATE:
                action.object.rotation.copy(action.data.previousRotation);
                break;
            case ActionType.RESET:
                restoreRoomState(action.snapshot);
                break;
        }
    }
    
    function redo() {
        if (redoStack.length === 0) return;
    
        const action = redoStack.pop();
        undoStack.push(action);
    
        switch (action.type) {
            case ActionType.MOVE:
                action.object.position.copy(action.data.newPosition);
                break;
            case ActionType.ROTATE:
                action.object.rotation.copy(action.data.newRotation);
                break;
            case ActionType.RESET:
                resetScene();
                break;
        }
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

        const length = parseFloat(roomLength.value);
        const breadth = parseFloat(roomBreadth.value);
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
        const scaledLength = roomLength * 2;
        const scaledBreadth = roomBreadth * 2;
    
        let position = { x: 0, y: 0, z: 0 };
        let scale = { x: scaledLength, y: 1, z: scaledBreadth };
    
        floorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshPhongMaterial({ color: floorColorInput.value })
        );
    
        floorMesh.position.set(position.x, position.y, position.z);
        floorMesh.scale.set(scaledLength, scale.y, scaledBreadth);
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        floorMesh.userData.ground = true;
        roomCreated = true;
    
        createWalls(scaledLength, scaledBreadth);
        walls.forEach(wall => createScene.add(wall));
        createRoomGrid(scaledLength, scaledBreadth);
        createScene.add(floorMesh);
    }

    // Function to create walls
    function createWalls(roomLength, roomBreadth) {
        const scaledLength = roomLength * 2;
        const scaledBreadth = roomBreadth * 2;

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

    // Models import
    const loader = new GLTFLoader();
    let draggableObjects = [];
    let dragControls;
    let selectedObject = null;

    async function addFurniture(modelPath, position, rotation = { x: 0, y: 0, z: 0 }, isLoaded = false, scale = null) {
        console.log("addFurniture called with isLoaded:", isLoaded);
    
        if (!roomCreated) {
            await showErrorDialog("Please create a room before adding furniture.");
            return;
        }
    
        loader.load(modelPath, function (gltf) {
            try {
                const model = gltf.scene;
                console.log("Model loaded:", modelPath);
    
                // First ensure all materials are valid
                model.traverse(child => {
                    if (child.isMesh) {
                        // Fix missing or invalid materials
                        if (!child.material || !child.material.isMaterial) {
                            console.warn("Fixing missing material on:", child.name);
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x888888,
                                roughness: 0.7,
                                metalness: 0.3
                            });
                        }
                        
                        // Convert to StandardMaterial if needed
                        if (!child.material.isMeshStandardMaterial) {
                            const newMat = new THREE.MeshStandardMaterial();
                            THREE.Material.prototype.copy.call(newMat, child.material);
                            child.material = newMat;
                        }
                    }
                });
    
                // Apply saved scale if provided
                if (scale) {
                    model.scale.copy(scale);
                } else {
                    // Calculate initial scale
                    const bbox = new THREE.Box3().setFromObject(model);
                    const size = bbox.getSize(new THREE.Vector3());
                    const maxSize = Math.max(size.x, size.y, size.z);
                    let scaleFactor = 4 / maxSize;
                    
                    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
                    // Apply type-specific scaling
                    const scaleMultipliers = {
                        bed: 2.5,
                        wardrobe: 2,
                        chair: 1.2,
                        lamp: 1.5,
                        carpet: 2,
                        sofa: 2.8,
                        pc: 1.5,
                        table: 1.5
                    };
    
                    for (let key in scaleMultipliers) {
                        if (modelPath.toLowerCase().includes(key)) {
                            const multiplier = scaleMultipliers[key];
                            model.scale.multiplyScalar(multiplier);
                            console.log(`Applied ${key} multiplier: ${multiplier}`);
                            break;
                        }
                    }
                }
    
                // Calculate final bounding box
                const scaledBbox = new THREE.Box3().setFromObject(model);
                const scaledSize = scaledBbox.getSize(new THREE.Vector3());
                const center = new THREE.Vector3();
                scaledBbox.getCenter(center);
                console.log("Final model dimensions:", scaledSize);
    
                // Create container (visible during debugging)
                const containerGeometry = new THREE.BoxGeometry(scaledSize.x, scaledSize.y, scaledSize.z);
                const containerMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000, // Default color for all furniture
                    visible: false,
                    wireframe: false,
                    transparent: true,
                    opacity: 0.3
                });
                const containerCube = new THREE.Mesh(containerGeometry, containerMaterial);
                
                // Center model in container
                model.position.sub(center);
                containerCube.add(model);
    
                // Regular furniture placement
                const floorY = 0.5;
                containerCube.position.set(
                    position.x, 
                    floorY + (scaledSize.y / 2), 
                    position.z
                );
                containerCube.rotation.set(rotation.x, rotation.y, rotation.z);
                containerCube.userData.isWallItem = false;
    
                // MATERIAL ADJUSTMENTS
                model.traverse(child => {
                    if (child.isMesh) {
                        // Enable shadows for all
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
    
                // Store object data
                containerCube.userData = {
                    ...containerCube.userData,
                    halfWidth: scaledSize.x / 2,
                    halfDepth: scaledSize.z / 2,
                    halfHeight: scaledSize.y / 2,
                    modelPath: modelPath,
                    draggable: true,
                    originalScale: model.scale.clone() // Store original scale for reference
                };
    
                // Add to scene
                createScene.add(containerCube);
                draggableObjects.push(containerCube);
    
                // Update drag controls
                if (dragControls) {
                    dragControls.dispose();
                }
                setupDragControls();
    
                // Add to undo stack
                undoStack.push({ type: 'add', object: containerCube });
                redoStack = [];
    
            } catch (error) {
                console.error("Error processing model:", error);
                showErrorDialog("Failed to load furniture model. Please try another item.");
            }
    
        }, undefined, function (error) {
            console.error("Error loading model:", error);
            showErrorDialog("Failed to load model file. It may be corrupted or missing.");
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
                "/static/models/furnitures/table3.glb",
            ];
            const defaultPosition = { x: 0, y: 2.5, z: 0 };
            addFurniture(furnitureModels[index], defaultPosition);
        });
    });

    // Updated window implementation with robust error handling
    document.getElementById('window-toggle-btn').addEventListener('click', () => {
        toggleWindows().catch(console.error);
    });

    // Enhanced window configuration
    const WINDOW_CONFIG = {
        scale: 3,
        wallOffset: 0.1,          // Distance from wall surface
        heightFromFloor: 2,        // Vertical position from floor
        defaultWidth: 3,           // Fallback window width
        defaultHeight: 2,          // Fallback window height
        spacingFactor: 0.33        // Controls spacing between windows (0.25-0.4)
    };

    // Global variables
    let windowSystemReady = false;
    let windows = [];

    // Initialize window system
    async function initWindowSystem() {
        try {
            // Try loading GLB model first
            const model = await loadWindowModel();
            model.scale.set(WINDOW_CONFIG.scale, WINDOW_CONFIG.scale, WINDOW_CONFIG.scale);
            model.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Enable proper transparency sorting
                    child.material.transparent = true;
                    child.material.depthWrite = false;
                }
            });
            return model;
        } catch (error) {
            console.warn("Using fallback window:", error);
            return createFallbackWindow();
        }
    }

    // Load GLB model
    function loadWindowModel() {
        return new Promise((resolve, reject) => {
            const loader = new GLTFLoader();
            loader.load(
                '/static/models/furnitures/window.glb',
                gltf => resolve(gltf.scene),
                undefined,
                error => {
                    console.error("Window model loading failed:", error);
                    reject(error);
                }
            );
        });
    }

    // Create simple window geometry
    function createFallbackWindow() {
        const group = new THREE.Group();
        
        // Frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(WINDOW_CONFIG.defaultWidth, WINDOW_CONFIG.defaultHeight, 0.2),
            new THREE.MeshStandardMaterial({ 
                color: 0x654321,
                roughness: 0.7,
                metalness: 0.3
            })
        );
        group.add(frame);
        
        // Glass
        const glass = new THREE.Mesh(
            new THREE.PlaneGeometry(WINDOW_CONFIG.defaultWidth - 0.2, WINDOW_CONFIG.defaultHeight - 0.2),
            new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7,
                roughness: 0.1,
                metalness: 0.9
            })
        );
        glass.position.z = -0.11;
        group.add(glass);
        
        return group;
    }

    // Main toggle function
    async function toggleWindows() {
        if (!roomCreated) {
            showErrorDialog("Please create a room first.");
            return;
        }

        if (!windowSystemReady) {
            try {
                window.windowModel = await initWindowSystem();
                windowSystemReady = true;
            } catch (error) {
                showErrorDialog("Failed to initialize window system.");
                return;
            }
        }

        if (windows.length > 0) {
            removeWindows();
        } else {
            placeWindowsOnAllWalls();
        }
    }

    // Place windows on all walls
    function placeWindowsOnAllWalls() {
        const roomDepth = parseFloat(roomBreadth.value);
        const roomWidth = parseFloat(roomLength.value);
        
        // Positions for all walls [x, y, z, rotationY]
        const positions = [
            // Back wall (2 windows)
            { x: -roomWidth * WINDOW_CONFIG.spacingFactor, y: WINDOW_CONFIG.heightFromFloor, z: -roomDepth - WINDOW_CONFIG.wallOffset, rotationY: 0 },
            { x: roomWidth * WINDOW_CONFIG.spacingFactor, y: WINDOW_CONFIG.heightFromFloor, z: -roomDepth - WINDOW_CONFIG.wallOffset, rotationY: 0 },
            
            // Left wall (2 windows, rotated 90 degrees)
            { x: -roomWidth - WINDOW_CONFIG.wallOffset, y: WINDOW_CONFIG.heightFromFloor, z: -roomDepth * WINDOW_CONFIG.spacingFactor, rotationY: Math.PI/2 },
            { x: -roomWidth - WINDOW_CONFIG.wallOffset, y: WINDOW_CONFIG.heightFromFloor, z: roomDepth * WINDOW_CONFIG.spacingFactor, rotationY: Math.PI/2 },
            
            // Right wall (2 windows, rotated -90 degrees)
            { x: roomWidth + WINDOW_CONFIG.wallOffset, y: WINDOW_CONFIG.heightFromFloor, z: -roomDepth * WINDOW_CONFIG.spacingFactor, rotationY: -Math.PI/2 },
            { x: roomWidth + WINDOW_CONFIG.wallOffset, y: WINDOW_CONFIG.heightFromFloor, z: roomDepth * WINDOW_CONFIG.spacingFactor, rotationY: -Math.PI/2 }
        ];

        // Clear existing windows first
        removeWindows();

        // Create new windows
        positions.forEach(pos => {
            try {
                const windowInstance = window.windowModel.clone();
                windowInstance.position.set(pos.x, pos.y, pos.z);
                windowInstance.rotation.y = pos.rotationY;
                
                // Add to scene
                createScene.add(windowInstance);
                windows.push(windowInstance);
            } catch (error) {
                console.error("Error placing window:", error);
            }
        });
    }

    // Cleanup function
    function removeWindows() {
        windows.forEach(window => {
            try {
                createScene.remove(window);
            } catch (error) {
                console.warn("Error removing window:", error);
            }
        });
        windows = [];
    }

    // Initialize on DOM ready
    document.addEventListener("DOMContentLoaded", () => {
        // Initialize window system after scene is ready
        setTimeout(() => initWindowSystem().catch(console.error), 1000);
    });

    function checkCollisions() {
        let collisionDetected = false;
        
        // Reset all object colors first
        draggableObjects.forEach(obj => {
            obj.traverse(child => {
                if (child.isMesh && child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    child.userData.isColliding = false;
                }
            });
        });

        // Check each pair of objects
        for (let i = 0; i < draggableObjects.length; i++) {
            for (let j = i + 1; j < draggableObjects.length; j++) {
                const obj1 = draggableObjects[i];
                const obj2 = draggableObjects[j];
                
                if (obj1.userData.isWallItem || obj2.userData.isWallItem) continue;
                
                const box1 = new THREE.Box3().setFromObject(obj1);
                const box2 = new THREE.Box3().setFromObject(obj2);
                
                if (box1.intersectsBox(box2)) {
                    collisionDetected = true;
                    
                    // Store original material if not already stored
                    obj1.traverse(child => {
                        if (child.isMesh && !child.userData.originalMaterial) {
                            child.userData.originalMaterial = child.material.clone();
                        }
                    });
                    
                    obj2.traverse(child => {
                        if (child.isMesh && !child.userData.originalMaterial) {
                            child.userData.originalMaterial = child.material.clone();
                        }
                    });
                    
                    // Change to red material
                    const redMaterial = new THREE.MeshStandardMaterial({ 
                        color: 0xff0000,
                        roughness: 0.7,
                        metalness: 0.3
                    });
                    
                    obj1.traverse(child => {
                        if (child.isMesh) {
                            child.material = redMaterial;
                            child.userData.isColliding = true;
                        }
                    });
                    
                    obj2.traverse(child => {
                        if (child.isMesh) {
                            child.material = redMaterial;
                            child.userData.isColliding = true;
                        }
                    });
                }
            }
        }
        
        return collisionDetected;
    }

    function hasCollisions() {
        return draggableObjects.some(obj => {
            let colliding = false;
            obj.traverse(child => {
                if (child.userData.isColliding) colliding = true;
            });
            return colliding;
        });
    }

    function setupDragControls() {
        if (dragControls) {
            dragControls.dispose();
        }
    
        dragControls = new DragControls(draggableObjects, createCamera, createRenderer.domElement);
    
        dragControls.addEventListener("dragstart", (event) => {
            controls.enabled = false;
            const object = event.object;
            object.userData.previousPosition = object.position.clone();
    
            // Add outline effect
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x00ff00); // Green highlight
                }
            });
        });
    
        dragControls.addEventListener("drag", (event) => {
            const object = event.object;
            const halfRoomLength = parseFloat(roomLength.value);
            const halfRoomBreadth = parseFloat(roomBreadth.value);
            const padding = 0.3;
    
            // Recalculate bounding box
            const bbox = new THREE.Box3().setFromObject(object);
            const size = bbox.getSize(new THREE.Vector3());
            
            // Update dimensions
            object.userData.halfWidth = size.x / 2;
            object.userData.halfHeight = size.y / 2;
            object.userData.halfDepth = size.z / 2;
    
            // Apply X and Z constraints (same for all objects)
            object.position.x = Math.max(
                -halfRoomLength + padding + object.userData.halfWidth,
                Math.min(halfRoomLength - padding - object.userData.halfWidth, object.position.x)
            );
    
            object.position.z = Math.max(
                -halfRoomBreadth + padding + object.userData.halfDepth,
                Math.min(halfRoomBreadth - padding - object.userData.halfDepth, object.position.z)
            );
    
            // Apply Y constraints (different for windows vs furniture)
            if (object.userData.isWindow) {
                // Window-specific Y constraints (height)
                const minHeight = 0.5 + object.userData.halfHeight; // Just above floor
                const maxHeight = roomHeight - object.userData.halfHeight - 0.5; // Just below ceiling
                object.position.y = Math.max(minHeight, Math.min(maxHeight, object.position.y));
            } else {
                // Furniture Y position (fixed to floor)
                const floorY = 0.5;
                object.position.y = floorY + object.userData.halfHeight;
            }
        });
    
        dragControls.addEventListener("dragend", (event) => {
            controls.enabled = true;
            const object = event.object;
            
            // No special window alignment needed since they move freely in X/Z
            saveMoveAction(object, object.userData.previousPosition, object.position.clone());
    
            // Remove outline effect
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material.emissive = new THREE.Color(0x000000);
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
        draggableObjects = draggableObjects.filter(obj => {
            return !(
                obj.userData.modelPath === object.userData.modelPath &&
                obj.position.x === object.position.x &&
                obj.position.z === object.position.z
            );
        });
        undoStack.push({ type: 'remove', object: object });
        redoStack = [];

        console.log("Furniture removed:", object);
    }

    const stepSize = Math.PI / 8;

    function snapRotation(object) {
        let currentRotation = object.rotation.y;
        let snappedRotation = Math.round(currentRotation / (Math.PI / 2)) * (Math.PI / 2);
        
        if (Math.abs(currentRotation - snappedRotation) < stepSize / 2) {
            object.rotation.y = snappedRotation;
        }
    }

    window.addEventListener("keydown", (event) => {
        if (!selectedObject) return;

        const previousRotation = selectedObject.rotation.clone();
        const previousScale = selectedObject.scale.clone();

        switch (event.key) {
            case "ArrowLeft":
                selectedObject.rotation.y -= stepSize;
                break;
            case "ArrowRight":
                selectedObject.rotation.y += stepSize;
                break;
            case "ArrowUp":
                selectedObject.scale.multiplyScalar(1.1);
                saveScaleAction(selectedObject, previousScale, selectedObject.scale.clone());
                break;
            case "ArrowDown":
                selectedObject.scale.multiplyScalar(0.9);
                saveScaleAction(selectedObject, previousScale, selectedObject.scale.clone());
                break;
            case "Delete":
                removeFurniture(selectedObject);
                return;
            default:
                return;

            snapRotation(selectedObject);
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

        saveRotateAction(selectedObject, previousRotation, selectedObject.rotation.clone());

    });

    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");

    undoBtn.addEventListener("click", undo);
    redoBtn.addEventListener("click", redo);

    animateCreate();

    document.getElementById('save').addEventListener('click', async function () {
        if (hasCollisions()) {
            showErrorDialog("Cannot save! There are furniture items that are colliding!");
            return;
        }

        const projNameElement = document.getElementById('proj-name');
        if (!projNameElement) {
            console.error("Element with id 'proj-name' not found!");
            return;
        }
        
        const roomData ={
            title: document.getElementById('proj-name').value,
            length:  parseFloat(roomLength.value),
            breadth: parseFloat(roomBreadth.value),
            floor_color: floorColorInput.value,
            wall_color: wallColorInput.value,
            data: {
                furniture: draggableObjects.map(obj => ({
                    model: obj.userData.modelPath,
                    position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
                    rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
                    scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
                })),
            },
        };

        const roomIdElement = document.getElementById('room-id');
        if (!roomIdElement) {
            console.error("Element with id 'room-id' not found!");
            return;
        }
        const roomId = roomIdElement.value;

        try {
            // Send the data to the backend
            const response = await fetch(`/save-room-design/${roomId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for Django
                },
                body: JSON.stringify(roomData),
            });

            const result = await response.json();
            if (result.status === 'success') {
                // Close the save popup
                const savePopup = document.getElementById('save-popup');
                if (savePopup) {
                    savePopup.style.display = 'none';
                }

                const successDialog = document.getElementById('success-dialog');
                if (successDialog) {
                    successDialog.style.display = 'flex';

                    setTimeout(() => {
                        successDialog.style.display = 'none';
                    }, 5000);
                }
            } else {
                console.error('Error:', result.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Helper function to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    async function loadRoomDesign(roomId) {
        try {
            const response = await fetch(`/get-room-design/${roomId}/`);
            const result = await response.json();
    
            if (result.status === 'success') {
                const roomData = result.data;
    
                // Validate room dimensions
                if (typeof roomData.length !== 'number' || typeof roomData.breadth !== 'number' || roomData.length <= 0 || roomData.breadth <= 0) {
                    console.error("Invalid room dimensions from backend:", roomData.length, roomData.breadth);
                    return;
                }
    
                // Update the UI
                document.getElementById('proj-name').value = roomData.title || "My Room";
                roomLength.value = roomData.length;
                roomBreadth.value = roomData.breadth;
                floorColorInput.value = roomData.floor_color || "#ffffff";
                wallColorInput.value = roomData.wall_color || "#ffffff";
                draggableObjects.forEach(obj => createScene.remove(obj));
    
                // Recreate the room design
                createFloor(roomData.length, roomData.breadth);
    
                // Recreate the furniture
                if (roomData.furniture && Array.isArray(roomData.furniture)) {
                    roomData.furniture.forEach(item => {
                        if (item.model && typeof item.model === 'string') {
                            const rotation = item.rotation && typeof item.rotation === 'object'
                            ? item.rotation
                            : { x: 0, y: 0, z: 0 };
                            addFurniture(item.model, item.position, item.rotation, true);
                        } else {
                            console.error("Invalid furniture item:", item);
                        }
                    });
                }
            } else {
                console.error('Error:', result.message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const roomIdElement = document.getElementById('room-id');
    if (!roomIdElement) {
        console.error("Element with id 'room-id' not found!");
        return;
    }
    const roomId = roomIdElement.value;
    console.log("Room ID:", roomId);

    if (roomId) {
        console.log("Loading saved room with ID:", roomId);
        await loadRoomDesign(roomId);
    } else {
        console.log("No room ID found, skipping automatic loading");
    }

    document.querySelectorAll('.button').forEach(button => {
        button.addEventListener('click', function(event) {
            const templateId = event.target.getAttribute('data-template-id');
            loadNewProjectUsingTemplate(templateId);
        });
    });

    async function loadNewProjectUsingTemplate(templateId) {
        try {
            // Fetch the templates.json from the correct URL
            const response = await fetch('/static/data/templates.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const templates = await response.json();
    
            // Find the template based on the templateId
            const templateData = templates.find(template => template.id === templateId);
    
            if (!templateData) {
                console.error("Template not found:", templateId);
                return;
            }
    
            // Validate the room dimensions
            if (typeof templateData.length !== 'number' || typeof templateData.breadth !== 'number' || templateData.length <= 0 || templateData.breadth <= 0) {
                console.error("Invalid room dimensions in template:", templateData.length, templateData.breadth);
                return;
            }
    
            // Initialize the UI for the new project (based on the template)
            document.getElementById('proj-name').value = templateData.title || "My Room";
            roomLength.value = templateData.length;
            roomBreadth.value = templateData.breadth;
            floorColorInput.value = templateData.floor_color || "#ffffff";
            wallColorInput.value = templateData.wall_color || "#ffffff";
    
            // Reset the scene for the new project
            draggableObjects.forEach(obj => createScene.remove(obj));
    
            // Recreate the floor
            createFloor(templateData.length, templateData.breadth);
    
            // Recreate the furniture
            if (templateData.furniture && Array.isArray(templateData.furniture)) {
                templateData.furniture.forEach(item => {
                    if (item.model && typeof item.model === 'string') {
                        const rotation = item.rotation && typeof item.rotation === 'object'
                            ? item.rotation
                            : { x: 0, y: 0, z: 0 };
                        addFurniture(item.model, item.position, rotation, true);
                    } else {
                        console.error("Invalid furniture item in template:", item);
                    }
                });
            }
    
            // Optionally, you can set additional fields for the template (like description)
            document.getElementById('room-description').innerText = templateData.description || "No description available.";
    
            // Initialize the project as a new template-based project
            templateIdInput.value = templateData.id || "1"; // Set template ID to track the template used
        } catch (error) {
            console.error('Error loading new project using template:', error);
        }
    }
    
    function saveCanvasAsImage() {
        const originalSize = {
            width: createRenderer.domElement.width,
            height: createRenderer.domElement.height
        };
        
        const scaleFactor = window.devicePixelRatio;
        createRenderer.setSize(
            originalSize.width * scaleFactor,
            originalSize.height * scaleFactor,
            false
        );
        
        createRenderer.render(createScene, createCamera);
        
        createRenderer.domElement.toBlob(async (blob) => {
            try {
                createRenderer.setSize(originalSize.width, originalSize.height);
                createRenderer.render(createScene, createCamera);
    
                const roomId = document.getElementById('room-id').value;
                const response = await fetch(`/check-screenshot/${roomId}/`);
                const result = await response.json();
    
                if (result.has_screenshot) {
                    const confirmDelete = confirm("A screenshot already exists. Do you want to replace it?");
                    if (!confirmDelete) {
                        showNotification('Screenshot upload canceled.', 'info');
                        return;
                    }
                }
    
                const formData = new FormData();
                formData.append('screenshot', blob, `design_${Date.now()}.png`);
                
                const uploadResponse = await fetch(`/save-screenshot/${roomId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: formData,
                });
    
                const uploadResult = await uploadResponse.json();
                
                if (uploadResult.status === 'success') {
                    showNotification('Screenshot saved successfully!', 'success');
                    
                    const screenshotPreview = document.getElementById('screenshot-preview');
                    if (screenshotPreview && uploadResult.url) {
                        screenshotPreview.src = uploadResult.url;
                        screenshotPreview.style.display = 'block';
                        setTimeout(() => {
                            screenshotPreview.style.display = 'none';
                        }, 3500);
                    }
                } else {
                    showNotification(uploadResult.message || 'Failed to save screenshot', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error saving screenshot', 'error');
            }
        }, 'image/png');
    }
    
    // Helper function for notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.background = type === 'error' ? '#dc3545' : '#28a745';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        document.body.appendChild(notification);
    
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    document.getElementById('photo-btn').addEventListener('click', saveCanvasAsImage);

    

});

