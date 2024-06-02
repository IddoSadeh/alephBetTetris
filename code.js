    // assumption is blocks are longer than they are wide, 
    // for blocks taller than wide, flip 90 degrees left (based on svg)

    document.addEventListener("DOMContentLoaded", function() {
        const gridContainer = document.getElementById('tetris-grid');
        const createBtn = document.getElementById('create');
        const gridWidth = 12;
        const gridHeight = 12;
        let grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
        let allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1)); // Example allowed areas
       
    
        function createAlephPattern() {
            let pattern = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));

              // Define the thick diagonal
              let grid = [
                [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
                [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
                [0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
                [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
                [0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
                [1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
            ];
            
            return grid;
        }
        
        function createVavPattern() {
            let pattern = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
        
            // Define the vertical line for Vav
            const vavWidth = 2;  // Vav width of 2 blocks
            const startX = Math.floor(gridWidth / 2) - 1;  // Center the Vav in the grid
            for (let i = 0; i < gridHeight - 1; i++) {  // Leave some space at top and bottom
                for (let j = 0; j < vavWidth; j++) {
                    pattern[i][startX + j] = 1;
                }
            }
        
            return pattern;
        }



        function clearGridContainer() {
            gridContainer.innerHTML = ''; // This removes all child elements from the grid container
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
                        blockSvg.style.left = `${(x + j) * 50}px`;  // Calculate the left position
                        blockSvg.style.top = `${(gridHeight - (y + i) - 1) * 50}px`;  // Calculate the top position, adjusted for bottom-up grid
                        blockSvg.style.width = '50px';  // Assuming each grid cell is 50px
                        blockSvg.style.height = '50px';
  
                        gridContainer.appendChild(blockSvg);
                    }
                }
            }
        }
        
        function populateGrid() {
            clearGridContainer();  // Clear all previous SVG blocks
            resetGridAndAreas();   // Reset grid and allowed areas to initial state
        
            const letterInput = document.getElementById('text').value.trim();
            if (letterInput === 'א') {
                allowedAreas = createAlephPattern();
            }else if(letterInput === 'ו'){
                allowedAreas = createVavPattern();
            }
             else {
                // Optional: Handle other letters or default pattern
                allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));
            }
            
            let blocks = getSelectedBlocks();  // Get the selected blocks based on checkbox states
            let placementsPossible;
            do {
                placementsPossible = false;
                for (let y = gridHeight - 1; y >= 0; y--) {
                    for (let x = 0; x < gridWidth; x++) {
                        if (grid[y][x] === 0 && allowedAreas[y][x] === 1) {
                            const block = blocks[Math.floor(Math.random() * blocks.length)];
                            if (tryToPlaceBlock({...block}, x, y)) {
                                placementsPossible = true;
                            }
                        }
                    }
                }
            } while (placementsPossible);
        }
        
        createBtn.addEventListener('click', populateGrid);
        
        
        
        

        createBtn.addEventListener('click', populateGrid);
    });
