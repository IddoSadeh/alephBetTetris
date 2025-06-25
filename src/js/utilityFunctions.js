
import { updateCanvasColorAdjustments, updateCanvasOpacity, updateCanvasSize } from './canvasModule.js';
import * as vars from './variables.js';
import { scene } from './threeSetup.js';
import * as THREE from 'three';

export function drawCube(block, x, y, z = 0) {
    // Scale down the block width
    const blockWidth = vars.state.blockWidth * 0.001;
    const geometry = new THREE.BoxGeometry(blockWidth, blockWidth, blockWidth);
    const loader = new THREE.TextureLoader();

    loader.load(block.svgUrl, (texture) => {
        const materials = [
            new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff }),
            new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff }),
            new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff }),
            new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff }),
            new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff }),
            new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff })
        ];

        const cube = new THREE.Mesh(geometry, materials);

        // Calculate the center position of the grid
        const gridCenterX = (vars.state.gridWidth * blockWidth) / 2;
        const gridCenterY = (vars.state.gridHeight * blockWidth) / 2;

        // Set cube position relative to the center of the grid
        cube.position.set(
            (x * blockWidth) - gridCenterX + (blockWidth / 2),
            -(y * blockWidth) + gridCenterY - (blockWidth / 2),
            z
        );

        scene.add(cube);
        cube.userData.isTetrisCube = true; // Tag to identify Tetris cubes
    });
}

export function clearCubes() {
    return new Promise((resolve) => {
        const objectsToRemove = [];
        scene.traverse((object) => {
            if (object.isMesh && object.userData.isTetrisCube) {
                objectsToRemove.push(object);
            }
        });
        objectsToRemove.forEach((object) => {
            scene.remove(object);
        });
        resolve();
    });
}

export function placeCube(block, x, y) {
    const layers = parseInt(vars.layerSlider.value, 10); // Get the number of layers from the slider
    for (let layer = 0; layer < layers; layer++) {
        for (let i = 0; i < block.matrix.length; i++) {
            for (let j = 0; j < block.matrix[i].length; j++) {
                if (block.matrix[i][j] === 1) {
                    vars.state.grid[y + i][x + j] = 1;
                    vars.state.allowedAreas[y + i][x + j] = 0;
                    drawCube(block, x + j, y + i, layer * vars.state.blockWidth*0.001);
                }
            }
        }
    }
}


export function updateThreeJSColorAdjustments() {
    const saturationValue = vars.saturationInput.value;
    const hueValue = vars.hueInput.value;
    const luminanceValue = vars.luminanceInput.value;

    const filterValue = `
        saturate(${saturationValue}%)
        hue-rotate(${hueValue}deg)
        brightness(${luminanceValue}%)
    `;

    const canvas = document.getElementById('three-canvas');
    canvas.style.filter = filterValue;
}




export function isValidHebrewCharacter(input) {
    // Regular expression for Hebrew letters, numbers, and common punctuation/special characters on a Hebrew keyboard
    return /^[\u0590-\u05FF0-9\s\.,!?;:'"\(\)\[\]{}<>@#\$%\^&\*\-_=+\|\\\/~`]$/.test(input);
}


export function getSelectedBlocks() {
    const selectedBlocks = [];
    const allBlocks = [
        { id: "blue", matrix: [[1, 0, 0], [1, 1, 1]], svgUrl: 'images/blue_block.svg' },
        { id: "green", matrix: [[1, 0], [1, 1], [0, 1]], svgUrl: 'images/green_block.svg' },
        { id: "orange", matrix: [[0, 0, 1], [1, 1, 1]], svgUrl: 'images/orange_block.svg' },
        { id: "pink", matrix: [[1, 0], [1, 1], [1, 0]], svgUrl: 'images/pink_block.svg' },
        { id: "red", matrix: [[0, 1], [1, 1], [1, 0]], svgUrl: 'images/red_block.svg' },
        { id: "turqoise", matrix: [[1, 1, 1, 1]], svgUrl: 'images/turqoise_block.svg' },
        { id: "yellow", matrix: [[1, 1], [1, 1]], svgUrl: 'images/yellow_block.svg' }
    ];

    allBlocks.forEach(block => {
        const element = document.getElementById(block.id);
        if (element && element.checked) {
            selectedBlocks.push(block);
        }
    });

    return selectedBlocks.length > 0 ? selectedBlocks : allBlocks;
}

export function resetGridAndAreas() {
    clearCubes();
    vars.state.grid = Array.from(Array(vars.state.gridHeight), () => new Array(vars.state.gridWidth).fill(0));
    vars.state.allowedAreas = Array.from(Array(vars.state.gridHeight), () => new Array(vars.state.gridWidth).fill(1));
    return Promise.resolve();
}

export function drawBlock(block, x, y) {
    const img = new Image();
    img.src = block.svgUrl;
    img.onload = () => {
        vars.ctx.drawImage(img, x * vars.state.blockWidth, y * vars.state.blockWidth, vars.state.blockWidth, vars.state.blockWidth);
        updateCanvasColorAdjustments();
    };
}

export function placeBlock(block, x, y) {
    for (let i = 0; i < block.matrix.length; i++) {
        for (let j = 0; j < block.matrix[i].length; j++) {
            if (block.matrix[i][j] === 1) {
                vars.state.grid[y + i][x + j] = 1;
                vars.state.allowedAreas[y + i][x + j] = 0;
                drawBlock(block, x + j, y + i);
            }
        }
    }
}

export function tryToPlaceBlock(block, startX, startY) {
    let rotationApplied = 0;
    for (let rotation = 0; rotation < 4; rotation++) {
        if (canPlaceBlock(block, startX, startY)) {
            placeBlock(block, startX, startY, rotationApplied);
            placeCube(block,startX,startY)
            return true;
        }
        block.matrix = rotateMatrix(block.matrix);
        rotationApplied++;
    }
    return false;
}

export function canPlaceBlock(block, x, y) {
    for (let i = 0; i < block.matrix.length; i++) {
        for (let j = 0; j < block.matrix[i].length; j++) {
            if (block.matrix[i][j] === 1) {
                let newY = y + i;
                let newX = x + j;

                if (newX >= vars.state.gridWidth || newY >= vars.state.gridHeight || newX < 0 || newY < 0) {
                    return false;
                }

                if (vars.state.grid[newY][newX] === 1) {
                    return false;
                }

                if (vars.state.allowedAreas[newY][newX] !== 1) {
                    return false;
                }
            }
        }
    }
    return true;
}

export function downscaleArray(originalArray, targetWidth, targetHeight) {
    const originalHeight = originalArray.length;
    const originalWidth = originalArray[0].length;

    const xBlock = Math.floor(originalWidth / targetWidth);
    const yBlock = Math.floor(originalHeight / targetHeight);

    const downscaledArray = Array.from({ length: targetHeight }, () => new Array(targetWidth).fill(0));

    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            let sum = 0;
            let count = 0;
            for (let by = 0; by < yBlock; by++) {
                for (let bx = 0; bx < xBlock; bx++) {
                    sum += originalArray[y * yBlock + by][x * xBlock + bx];
                    count++;
                }
            }
            let average = sum / count;
            downscaledArray[y][x] = average > 0.1 ? 1 : 0;
        }
    }

    return downscaledArray;
}

export function rasterize(text, fontUrl) {
    return new Promise((resolve, reject) => {
        if (text !== "") {
            opentype.load(fontUrl, function (err, font) {
                if (err) {
                    alert('Font could not be loaded: ' + err);
                    reject(err);
                } else {
                    const canvas = document.getElementById('canvas');

                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const blockSize = 600 / vars.state.gridWidth;
                    let fontSize = 600;

                    const doesTextFit = (fontSize) => {
                        const textPath = font.getPath(text, 0, 0, fontSize);
                        const box = textPath.getBoundingBox();
                        return (box.x2 - box.x1 <= canvas.width) && (box.y2 - box.y1 <= canvas.height);
                    };

                    while (fontSize > 0 && !doesTextFit(fontSize)) {
                        fontSize -= 1;
                    }

                    const textPath = font.getPath(text, 0, 0, fontSize);
                    const box = textPath.getBoundingBox();

                    const xOffset = (canvas.width - (box.x2 - box.x1)) / 2 - box.x1;
                    const yOffset = (canvas.height - (box.y2 - box.y1)) / 2 - box.y1;

                    ctx.beginPath();
                    textPath.commands.forEach(function (cmd) {
                        if (cmd.type === 'M') {
                            ctx.moveTo(cmd.x + xOffset, cmd.y + yOffset);
                        } else if (cmd.type === 'L') {
                            ctx.lineTo(cmd.x + xOffset, cmd.y + yOffset);
                        } else if (cmd.type === 'C') {
                            ctx.bezierCurveTo(cmd.x1 + xOffset, cmd.y1 + yOffset, cmd.x2 + xOffset, cmd.y2 + yOffset, cmd.x + xOffset, cmd.y + yOffset);
                        } else if (cmd.type === 'Q') {
                            ctx.quadraticCurveTo(cmd.x1 + xOffset, cmd.y1 + yOffset, cmd.x + xOffset, cmd.y + yOffset);
                        } else if (cmd.type === 'Z') {
                            ctx.closePath();
                        }
                    });
                    ctx.fill();

                    setTimeout(() => {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const binaryArray = [];

                        for (let y = 0; y < canvas.height; y++) {
                            let row = [];
                            for (let x = 0; x < canvas.width; x++) {
                                const index = (y * canvas.width + x) * 4;
                                const alpha = imageData.data[index + 3];
                                row.push(alpha > 128 ? 1 : 0);
                            }
                            binaryArray.push(row);
                        }

                        canvas.style.display = 'none';
                        vars.state.allowedAreas = moveContentToBottom(downscaleArray(binaryArray, vars.state.gridWidth, vars.state.gridHeight));

                        resolve();
                    }, 500);
                }
            });
        } else {
            vars.state.allowedAreas = Array.from(Array(vars.state.gridHeight), () => new Array(vars.state.gridWidth).fill(1));
            resolve();
        }
    });
}

export function moveContentToBottom(array) {
    const height = array.length;
    const width = array[0].length;

    let firstRowWithContentFromBottom = -1;
    for (let y = height - 1; y >= 0; y--) {
        if (array[y].some(cell => cell === 1)) {
            firstRowWithContentFromBottom = y;
            break;
        }
    }

    const rowsToShift = height - 1 - firstRowWithContentFromBottom;

    const newArray = Array.from({ length: height }, () => new Array(width).fill(0));

    for (let y = 0; y < height; y++) {
        if (y + rowsToShift < height) {
            newArray[y + rowsToShift] = array[y];
        }
    }

    return newArray;
}

export function populateCanvas() {
    const letterInput = vars.textInput.value.trim();
    const fontUrl = vars.fontSelect.value;
    let blocks = getSelectedBlocks();

    updateCanvasSize()
        .then(() => updateCanvasOpacity())
        .then(() => clearCubes()) 
        .then(() => resetGridAndAreas())
        .then(() => rasterize(letterInput, fontUrl))
        .then(() => {
            let placementsPossible;
            do {
                placementsPossible = false;
                for (let y = 0; y < vars.state.gridHeight; y++) {
                    for (let x = 0; x < vars.state.gridWidth; x++) {
                        if (vars.state.grid[y][x] === 0 && vars.state.allowedAreas[y][x] === 1) {
                            const block = blocks[Math.floor(Math.random() * blocks.length)];
                            if (tryToPlaceBlock({ ...block }, x, y)) {
                                placementsPossible = true;
                            }
                        }
                    }
                }
            } while (placementsPossible);
        })
        .catch(error => {
            console.error('Failed to populate grid:', error);
        });
}

export function rotateMatrix(matrix) {
    return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse());
}
// Add these functions to your existing src/js/utilityFunctions.js file

export function getResponsiveCanvasSize() {
    const container = document.getElementById('tetris-grid-container');
    if (window.innerWidth <= 768) {
        // Mobile: use the grid container size
        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height, window.innerWidth - 40, window.innerHeight - 200);
        return Math.max(300, size); // Minimum size of 300px
    } else {
        // Desktop: use fixed 600px
        return 600;
    }
}

export function updateCanvasForMobile() {
    const canvas = document.getElementById('tetris-canvas');
    const threeContainer = document.getElementById('three-container');
    const size = getResponsiveCanvasSize();
    
    // Update 2D canvas
    if (canvas) {
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
    }
    
    // Update Three.js container
    if (threeContainer) {
        threeContainer.style.width = size + 'px';
        threeContainer.style.height = size + 'px';
    }
    
    return size;
}

export function handleMobileResize() {
    // Only adjust for mobile screens
    if (window.innerWidth <= 768) {
        const container = document.getElementById('tetris-grid-container');
        const canvas = document.getElementById('tetris-canvas');
        const threeContainer = document.getElementById('three-container');
        
        if (container) {
            const size = getResponsiveCanvasSize();
            
            // Update 2D canvas
            if (canvas) {
                canvas.width = size;
                canvas.height = size;
                canvas.style.width = size + 'px';
                canvas.style.height = size + 'px';
            }
            
            // Update Three.js container and renderer
            if (threeContainer) {
                threeContainer.style.width = size + 'px';
                threeContainer.style.height = size + 'px';
                
                // Update Three.js renderer if it exists and three container is visible
                if (window.renderer && threeContainer.style.display === 'block') {
                    window.renderer.setSize(size, size, true);
                    
                    if (window.camera) {
                        window.camera.aspect = 1;
                        window.camera.updateProjectionMatrix();
                    }
                    
                    // Force a render
                    if (window.scene) {
                        window.renderer.render(window.scene, window.camera);
                    }
                }
            }
            
            // Update state if it exists
            if (window.state || vars.state) {
                const state = window.state || vars.state;
                state.blockWidth = size / state.gridWidth;
            }
        }
    }
}