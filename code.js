// assumption is blocks are longer than they are wide, 
// for blocks taller than wide, flip 90 degrees left (based on svg)

document.addEventListener("DOMContentLoaded", function () {
    const gridContainer = document.getElementById('tetris-grid');
    const sizeInput = document.getElementById('size');
    const opacityInput = document.getElementById('opacity');
    const createBtn = document.getElementById('create');
    let gridWidth = 12;  // Changed from const to let
    let gridHeight = 12; // Changed from const to let
    let blockWidth = 50; // Default block width
    let grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
    let allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1)); // Example allowed areas
    

    function populateGridCells() {
        gridContainer.innerHTML = ''; // Clear existing cells
        for (let i = 0; i < gridWidth * gridHeight; i++) {
            let cell = document.createElement('div');
            cell.classList.add('grid-cell'); // Apply the border styling
            gridContainer.appendChild(cell);
        }
    }

    function updateGridSize() {
        gridWidth = parseInt(sizeInput.value);
        gridHeight = parseInt(sizeInput.value);
        blockWidth = 600 / gridWidth; // Adjust block width to fit new grid size
        gridContainer.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${gridHeight}, 1fr)`;

        populateGridCells();
    }




    function updateGridOpacity() {
        let cells = document.querySelectorAll('.grid-cell');
        let opacity = opacityInput.value / 10;

        cells.forEach(cell => {
            cell.style.borderColor = `rgba(255, 255, 255, ${opacity})`; // Adjust border color opacity
        });
    }



    function resetGridAndAreas() {
        grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
        allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));
        
    }


    function getSelectedBlocks() {
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
            if (document.getElementById(block.id).checked) {
                selectedBlocks.push(block);
            }
        });

        // If no blocks are selected, use all blocks
        return selectedBlocks.length > 0 ? selectedBlocks : allBlocks;
    }


    function rotateMatrix(matrix) {
        return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse());
    }

    function canPlaceBlock(block, x, y) {
        let onTopOfBlock = false;
        console.log(JSON.parse(JSON.stringify(allowedAreas)));
        
        for (let i = 0; i < block.matrix.length; i++) {
            for (let j = 0; j < block.matrix[i].length; j++) {
                if (block.matrix[i][j] === 1) {
                    let newY = y + i;
                    let newX = x + j;
                    
                    if (newX >= gridWidth || newY >= gridHeight || newX < 0 || newY < 0 ||
                        grid[newY][newX] === 1 || allowedAreas[newY][newX] !== 1) {
                        return false;
                    }
                    if (newY === 0 || grid[newY - 1][newX] === 1) {
                        onTopOfBlock = true;
                    }
                }
            }
        }
        return onTopOfBlock;
    }


    function tryToPlaceBlock(block, startX, startY) {
        let rotationApplied = 0;
        for (let rotation = 0; rotation < 4; rotation++) {
            if (canPlaceBlock(block, startX, startY)) {
                placeBlock(block, startX, startY, rotationApplied);
                return true;
            }
            block.matrix = rotateMatrix(block.matrix);
            rotationApplied++;
        }
        return false;
    }

    function placeBlock(block, x, y, rotation) {
        
        for (let i = 0; i < block.matrix.length; i++) {
            for (let j = 0; j < block.matrix[i].length; j++) {
                if (block.matrix[i][j] === 1) {
                    grid[y + i][x + j] = 1;
                   
                    allowedAreas[y + i][x + j] = 0; // Update allowed areas to reflect the placement

                    // Create and position a new SVG block
                    const blockSvg = document.createElement('img');  // Use an <img> or <div> with background image
                    blockSvg.src = block.svgUrl;  // Path to the single block SVG

                    blockSvg.classList.add(block.id);  // Add color class
                    blockSvg.style.position = 'absolute';
                    blockSvg.style.left = `${(x + j) * blockWidth}px`;  // Calculate the left position
                    blockSvg.style.top = `${(gridHeight - (y + i) - 1) * blockWidth}px`;  // Calculate the top position, adjusted for bottom-up grid
                    blockSvg.style.width = `${blockWidth}px`;  // Assuming each grid cell is 50px
                    blockSvg.style.height = `${blockWidth}px`;

                    gridContainer.appendChild(blockSvg);
                }
            }
        }
    }
    function checkSelectedBlocks(blocks) {
        // Check if only blue and yellow are selected
        if (blocks.length === 2 && blocks.some(block => block.id === "blue") && blocks.some(block => block.id === "yellow")) {
            return true;
        }
        return false;
    }


    function downscaleArray(originalArray, targetWidth, targetHeight) {
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
                downscaledArray[y][x] = average > 0.5 ? 1 : 0; // Threshold of 0.5
            }
        }

        return downscaledArray;
    }

    function rasterize(text, fontUrl) {
        return new Promise((resolve, reject) => {
            if (text != "") {
                opentype.load(fontUrl, function (err, font) {
                    if (err) {
                        alert('Font could not be loaded: ' + err);
                        reject(err);
                    } else {
                        const canvas = document.getElementById('canvas');
                        canvas.style.display = 'block';
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        const fontSize = 1050;  // Appropriate font size
                        ctx.font = `${fontSize}px ${font.familyName}`;
                        ctx.textBaseline = "alphabetic";
                        ctx.fillText(text, 0, 600);
    
                        setTimeout(() => {
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const binaryArray = [];
    
                            for (let y = 0; y < canvas.height; y++) {
                                let row = [];
                                for (let x = 0; x < canvas.width; x++) {
                                    const index = (y * canvas.width + x) * 4;
                                    const alpha = imageData.data[index + 3];  // Check alpha channel
                                    row.push(alpha > 128 ? 1 : 0);
                                }
                                binaryArray.push(row);
                            }
                            canvas.style.display = 'none';
                            allowedAreas = downscaleArray(binaryArray, gridWidth, gridHeight);
                        
                            resolve();
                        }, 500); // Delay to ensure the text is fully drawn
                    }
                });
            } else {
                allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));
                resolve();
            }
        });
    }
    


    function populateGrid() {
        const letterInput = document.getElementById('text').value.trim();
        const fontUrl = document.getElementById('font-select').value;
    
        updateGridSize();
        updateGridOpacity();
        resetGridAndAreas();
        let blocks = getSelectedBlocks();
    
        if (checkSelectedBlocks(blocks)) {
            alert("acab תבחר צבעים אחרים יא מכביסט הומו");
            return;
        }
    
        rasterize(letterInput, fontUrl).then(() => {
            
            let placementsPossible;
            do {
                placementsPossible = false;
                for (let y = gridHeight - 1; y >= 0; y--) {
                    for (let x = 0; x < gridWidth; x++) {
                        if (grid[y][x] === 0 && allowedAreas[y][x] === 1) {
                            const block = blocks[Math.floor(Math.random() * blocks.length)];
                            if (tryToPlaceBlock({ ...block }, x, y)) {
                                
                                placementsPossible = true;
                            }
                        }
                    }
                }
            } while (placementsPossible);
        }).catch(error => {
            console.error('Failed to rasterize:', error);
        });
    }
    



    sizeInput.addEventListener('input', updateGridSize);
    opacityInput.addEventListener('input', updateGridOpacity);
    createBtn.addEventListener('click', populateGrid);


});
