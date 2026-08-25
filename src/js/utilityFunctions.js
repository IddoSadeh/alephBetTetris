
import { updateCanvasColorAdjustments, updateCanvasOpacity, updateCanvasSize } from './canvasModule.js';
import * as vars from './variables.js';
import { requestThreeRender, scene } from './threeSetup.js';
import * as THREE from 'three';

let populateOperationId = 0;
const textureLoader = new THREE.TextureLoader();
const blockMaterialPromises = new Map();
const cubeGeometries = new Map();

function isCurrentPopulateOperation(operationId) {
    return operationId === populateOperationId;
}

function getCubeGeometry(blockWidth) {
    const key = blockWidth.toFixed(6);
    if (!cubeGeometries.has(key)) {
        cubeGeometries.set(key, new THREE.BoxGeometry(blockWidth, blockWidth, blockWidth));
    }
    return cubeGeometries.get(key);
}

function getBlockMaterial(block) {
    if (!blockMaterialPromises.has(block.svgUrl)) {
        blockMaterialPromises.set(block.svgUrl, new Promise((resolve, reject) => {
            textureLoader.load(
                block.svgUrl,
                texture => {
                    const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
                    material.name = block.id;
                    resolve(material);
                },
                undefined,
                reject
            );
        }));
    }
    return blockMaterialPromises.get(block.svgUrl);
}

export function isValidText(input) {
  return input.trim().length > 0;
}

// Helper: load a font by URL via opentype.js
function loadFont(url) {
  return new Promise((resolve, reject) =>
    opentype.load(url, (err, font) => (err ? reject(err) : resolve(font)))
  );
}

const MAX_TEXT_LINES = 3;
const LONG_WORD_WRAP_THRESHOLD = 16;
const TEXT_PADDING_RATIO = 0.08;

function findBalancedLines(units, joiner, lineCount, measureWidth) {
  const memo = new Map();

  function visit(start, linesLeft) {
    const key = `${start}:${linesLeft}`;
    if (memo.has(key)) return memo.get(key);

    if (linesLeft === 1) {
      const line = units.slice(start).join(joiner);
      const result = { widestLine: measureWidth(line), lines: [line] };
      memo.set(key, result);
      return result;
    }

    let best = null;
    const lastBreak = units.length - linesLeft + 1;
    for (let end = start + 1; end <= lastBreak; end++) {
      const line = units.slice(start, end).join(joiner);
      const remainder = visit(end, linesLeft - 1);
      const candidate = {
        widestLine: Math.max(measureWidth(line), remainder.widestLine),
        lines: [line, ...remainder.lines]
      };
      if (!best || candidate.widestLine < best.widestLine) best = candidate;
    }

    memo.set(key, best);
    return best;
  }

  return visit(0, lineCount).lines;
}

function createLineLayouts(text, measureWidth) {
  const normalizedText = text.trim().replace(/\s+/gu, ' ');
  const words = normalizedText.split(' ');
  const characters = Array.from(normalizedText);
  const splitLongWord = words.length === 1 && characters.length > LONG_WORD_WRAP_THRESHOLD;
  const units = splitLongWord ? characters : words;
  const joiner = splitLongWord ? '' : ' ';
  const layoutCount = Math.min(MAX_TEXT_LINES, units.length);

  return Array.from({ length: layoutCount }, (_, index) =>
    findBalancedLines(units, joiner, index + 1, measureWidth)
  );
}

function chooseLargestLayout(layouts, getBounds, width, height) {
  const innerWidth = width * (1 - TEXT_PADDING_RATIO * 2);
  const innerHeight = height * (1 - TEXT_PADDING_RATIO * 2);
  let best = null;

  for (const lines of layouts) {
    let low = 1;
    let high = width;
    let fittingSize = 1;

    while (low <= high) {
      const size = Math.floor((low + high) / 2);
      const bounds = lines.map(line => getBounds(line, size));
      const widestLine = Math.max(...bounds.map(bound => bound.width));
      const tallestGlyph = Math.max(...bounds.map(bound => bound.height));
      const lineHeight = Math.max(size * 1.15, tallestGlyph);
      const totalHeight = lineHeight * lines.length;
      const fits = widestLine <= innerWidth && totalHeight <= innerHeight;

      if (fits) {
        fittingSize = size;
        low = size + 1;
      } else {
        high = size - 1;
      }
    }

    if (!best || fittingSize > best.fontSize) {
      const tallestGlyph = Math.max(...lines.map(line => getBounds(line, fittingSize).height));
      best = {
        lines,
        fontSize: fittingSize,
        lineHeight: Math.max(fittingSize * 1.15, tallestGlyph)
      };
    }
  }

  return best;
}

function drawOpenTypePath(ctx, path, xOffset, yOffset) {
  ctx.beginPath();
  for (const command of path.commands) {
    switch (command.type) {
      case 'M': ctx.moveTo(command.x + xOffset, command.y + yOffset); break;
      case 'L': ctx.lineTo(command.x + xOffset, command.y + yOffset); break;
      case 'C':
        ctx.bezierCurveTo(
          command.x1 + xOffset, command.y1 + yOffset,
          command.x2 + xOffset, command.y2 + yOffset,
          command.x + xOffset, command.y + yOffset
        );
        break;
      case 'Q':
        ctx.quadraticCurveTo(
          command.x1 + xOffset, command.y1 + yOffset,
          command.x + xOffset, command.y + yOffset
        );
        break;
      case 'Z': ctx.closePath(); break;
    }
  }
  ctx.fill();
}


export function drawCube(block, x, y, z = 0, operationId = populateOperationId) {
    // Scale down the block width
    const blockWidth = vars.state.blockWidth * 0.001;
    const geometry = getCubeGeometry(blockWidth);

    getBlockMaterial(block).then(material => {
        if (!isCurrentPopulateOperation(operationId)) {
            return;
        }

        const cube = new THREE.Mesh(geometry, material);

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
        requestThreeRender();
    }).catch(error => {
        console.error(`Failed to load block texture: ${block.svgUrl}`, error);
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
        requestThreeRender();
        resolve();
    });
}

export function placeCube(block, x, y, operationId = populateOperationId) {
    const layers = parseInt(vars.layerSlider.value, 10); // Get the number of layers from the slider
    for (let layer = 0; layer < layers; layer++) {
        for (let i = 0; i < block.matrix.length; i++) {
            for (let j = 0; j < block.matrix[i].length; j++) {
                if (block.matrix[i][j] === 1) {
                    vars.state.grid[y + i][x + j] = 1;
                    vars.state.allowedAreas[y + i][x + j] = 0;
                    drawCube(block, x + j, y + i, layer * vars.state.blockWidth*0.001, operationId);
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
        { id: "blue", matrix: [[1, 0, 0], [1, 1, 1]], svgUrl: './public/images/blue_block.svg' },
        { id: "green", matrix: [[1, 0], [1, 1], [0, 1]], svgUrl: './public/images/green_block.svg' },
        { id: "orange", matrix: [[0, 0, 1], [1, 1, 1]], svgUrl: './public/images/orange_block.svg' },
        { id: "pink", matrix: [[1, 0], [1, 1], [1, 0]], svgUrl: './public/images/pink_block.svg' },
        { id: "red", matrix: [[0, 1], [1, 1], [1, 0]], svgUrl: './public/images/red_block.svg' },
        { id: "turqoise", matrix: [[1, 1, 1, 1]], svgUrl: './public/images/turqoise_block.svg' },
        { id: "yellow", matrix: [[1, 1], [1, 1]], svgUrl: './public/images/yellow_block.svg' }
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

export function drawBlock(block, x, y, operationId = populateOperationId) {
    const img = new Image();
    img.src = block.svgUrl;
    img.onload = () => {
        if (!isCurrentPopulateOperation(operationId)) return;

        vars.ctx.drawImage(img, x * vars.state.blockWidth, y * vars.state.blockWidth, vars.state.blockWidth, vars.state.blockWidth);
        updateCanvasColorAdjustments();
    };
}

export function placeBlock(block, x, y, operationId = populateOperationId) {
    for (let i = 0; i < block.matrix.length; i++) {
        for (let j = 0; j < block.matrix[i].length; j++) {
            if (block.matrix[i][j] === 1) {
                vars.state.grid[y + i][x + j] = 1;
                vars.state.allowedAreas[y + i][x + j] = 0;
                drawBlock(block, x + j, y + i, operationId);
            }
        }
    }
}

export function tryToPlaceBlock(block, startX, startY, operationId = populateOperationId) {
    let rotationApplied = 0;
    for (let rotation = 0; rotation < 4; rotation++) {
        if (canPlaceBlock(block, startX, startY)) {
            placeBlock(block, startX, startY, operationId);
            placeCube(block, startX, startY, operationId);
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

export async function rasterize(text, fontUrl, operationId = populateOperationId) {
  const canvasEl = document.getElementById('canvas');
  const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
  const W = canvasEl.width, H = canvasEl.height;

  // 0) Empty case: clear grid
  if (!text) {
    vars.state.allowedAreas = Array.from(
      Array(vars.state.gridHeight),
      () => new Array(vars.state.gridWidth).fill(1)
    );
    return;
  }

  // 1) Try loading & testing the OpenType font
  let font, useNativeFallback = false;
  try {
    font = await loadFont(fontUrl);
    // A glyph index of zero means “.notdef” → at least one character is missing.
    const visibleCharacters = Array.from(text).filter(character => !/\s/u.test(character));
    if (visibleCharacters.some(character => font.charToGlyphIndex(character) === 0)) {
      throw new Error('missing-glyph');
    }
  } catch (err) {
    console.warn(
      `Could not use uploaded font for “${text}” → falling back to system font.`
    );
    useNativeFallback = true;
  }

  if (!isCurrentPopulateOperation(operationId)) return false;

  // 2) Clear canvas
  ctx.clearRect(0, 0, W, H);

  if (useNativeFallback) {
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const fontFamily = `"${vars.state.uploadedFontName}", sans-serif`;
    const getNativeBounds = (line, size) => {
      ctx.font = `${size}px ${fontFamily}`;
      const metrics = ctx.measureText(line);
      return {
        width: metrics.width,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      };
    };
    const layouts = createLineLayouts(text, line => getNativeBounds(line, 100).width);
    const layout = chooseLargestLayout(layouts, getNativeBounds, W, H);
    ctx.font = `${layout.fontSize}px ${fontFamily}`;

    layout.lines.forEach((line, index) => {
      const lineCenterY = H / 2 + (index - (layout.lines.length - 1) / 2) * layout.lineHeight;
      ctx.fillText(line, W / 2, lineCenterY);
    });

  } else {
    const getOpenTypeBounds = (line, size) => {
      const bounds = font.getPath(line, 0, 0, size).getBoundingBox();
      return {
        width: bounds.x2 - bounds.x1,
        height: bounds.y2 - bounds.y1
      };
    };
    const layouts = createLineLayouts(text, line => getOpenTypeBounds(line, 100).width);
    const layout = chooseLargestLayout(layouts, getOpenTypeBounds, W, H);

    layout.lines.forEach((line, index) => {
      const path = font.getPath(line, 0, 0, layout.fontSize);
      const bounds = path.getBoundingBox();
      const lineCenterY = H / 2 + (index - (layout.lines.length - 1) / 2) * layout.lineHeight;
      const xOffset = (W - (bounds.x2 - bounds.x1)) / 2 - bounds.x1;
      const yOffset = lineCenterY - (bounds.y1 + bounds.y2) / 2;
      drawOpenTypePath(ctx, path, xOffset, yOffset);
    });
  }

  // 3) Rasterize the canvas pixels into a binary grid
  const img = ctx.getImageData(0, 0, W, H).data;
  const binary = [];
  for (let y = 0; y < H; y++) {
    const row = [];
    for (let x = 0; x < W; x++) {
      const alpha = img[(y * W + x) * 4 + 3];
      row.push(alpha > 128 ? 1 : 0);
    }
    binary.push(row);
  }

  // 4) Downscale + bottom-align into your state
  canvasEl.style.display = 'none';
  vars.state.allowedAreas = moveContentToBottom(
    downscaleArray(binary, vars.state.gridWidth, vars.state.gridHeight)
  );

  return true;
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
    const operationId = ++populateOperationId;
    const letterInput = vars.textInput.value.trim();
    const fontUrl = vars.fontSelect.value;
    let blocks = getSelectedBlocks();

    return updateCanvasSize()
        .then(() => updateCanvasOpacity())
        .then(() => clearCubes()) 
        .then(() => resetGridAndAreas())
        .then(() => rasterize(letterInput, fontUrl, operationId))
        .then((didRasterize) => {
            if (!didRasterize || !isCurrentPopulateOperation(operationId)) return;

            let placementsPossible;
            do {
                placementsPossible = false;
                for (let y = 0; y < vars.state.gridHeight; y++) {
                    for (let x = 0; x < vars.state.gridWidth; x++) {
                        if (vars.state.grid[y][x] === 0 && vars.state.allowedAreas[y][x] === 1) {
                            const block = blocks[Math.floor(Math.random() * blocks.length)];
                            if (tryToPlaceBlock({ ...block }, x, y, operationId)) {
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
    const rect = container.getBoundingClientRect();
    return Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
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
