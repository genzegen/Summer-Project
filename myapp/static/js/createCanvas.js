import * as THREE from '/static/js/three.js-master/build/three.module.js';
import { OrbitControls } from '/static/js/three.js-master/examples/jsm/controls/OrbitControls.js';

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
    document.addEventListener("DOMContentLoaded", function() {
        const gridToggle = document.getElementById("grid-toggle");
        const gridStatus = document.getElementById("grid-status");

        gridToggle.checked = !gridToggle.checked;
        gridToggle.addEventListener ("change", function () {
            if (gridToggle.checked) {
                gridStatus.textContent = "Turn ON the grid";
            } else {
                gridStatus.textContent = "Turn OFF the grid";
            }
        })
    });

    // square or rectangle room
    const squareBtn = document.getElementById('square-btn');
    const rectBtn = document.getElementById('rect-btn');
    const createBtn = document.getElementById('create-btn');

    let selectedRoom = null;

    function toggleRoomSelection(button) {
        if (button === squareBtn) {
            selectedRoom = 'square';
            squareBtn.classList.add('selected');
            rectBtn.classList.remove('selected');
        } else if (button === rectBtn) {
            selectedRoom = 'rectangle';
            rectBtn.classList.add('selected');
            squareBtn.classList.remove('selected');
        }
    }

    squareBtn.addEventListener('click', function() { toggleRoomSelection(squareBtn); });
    rectBtn.addEventListener('click', function() { toggleRoomSelection(rectBtn); });

    createBtn.addEventListener('click', function() {
        if (selectedRoom) {
            if (selectedRoom === 'square') {
                createSquareRoom();
            } else if (selectedRoom === 'rectangle') {
                createRectangleRoom();
            }
        } else {
            alert('Please select a room dimension!');
        }
    });

    // square room
    function createSquareRoom() {
        const roomSize = 30;
        const roomHeight = 16;

        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(roomSize, 1, roomSize),
            new THREE.MeshBasicMaterial({ color: 0x998970 })
        );
        floor.position.set(0, 1.5, 0);

        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xe7cfb4 });

        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(roomSize, roomHeight, 1), wallMaterial),  // Back Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, roomSize), wallMaterial),  // Left Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, roomSize), wallMaterial)   // Right Wall
        ];

        walls[0].position.set(0, roomHeight / 2 + 1, -roomSize / 2); // Back wall
        walls[1].position.set(-roomSize / 2 - .5, roomHeight / 2 + 1, 0); // Left wall
        walls[2].position.set(roomSize / 2 + .5, roomHeight / 2 + 1, 0);  // Right wall

        createScene.add(floor, ...walls);
        createRoomGrid(roomSize, roomSize);
        console.log('Square room created!');
    }

    // rectangle
    function createRectangleRoom() {
        const length = 40;
        const width = 25;
        const roomHeight = 16;

        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(length, 1, width),
            new THREE.MeshBasicMaterial({ color: 0x998970 })
        );
        floor.position.set(0, 1.5, 0);

        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xe7cfb4 });

        const walls = [
            new THREE.Mesh(new THREE.BoxGeometry(length, roomHeight, 1), wallMaterial),  // Back Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, width), wallMaterial),  // Left Wall
            new THREE.Mesh(new THREE.BoxGeometry(1, roomHeight, width), wallMaterial)   // Right Wall
        ];

        walls[0].position.set(0, roomHeight / 2 + 1, -width / 2); // Back wall
        walls[1].position.set(-length / 2 - .5, roomHeight / 2 + 1, 0); // Left wall
        walls[2].position.set(length / 2 + .5, roomHeight / 2 + 1, 0);  // Right wall

        createScene.add(floor, ...walls);
        createRoomGrid(length, width);
        console.log('Rectangle room created!');
    }

    // **Lighting**
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    createScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(-13, 15, -40);
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

