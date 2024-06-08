document.addEventListener("DOMContentLoaded", function () {
    const gridContainer = document.getElementById('tetris-grid');
    const sizeInput = document.getElementById('size');
    const opacityInput = document.getElementById('opacity');
    const createBtn = document.getElementById('create');
    const saveBtn = document.getElementById('save'); // Save button
    const fontUpload = document.getElementById('font-upload'); // Font upload input
    let gridWidth = 12;
    let gridHeight = 12;
    let blockWidth = 50;
    let grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
    let allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));

    function populateGridCells() {
        gridContainer.innerHTML = '';
        for (let i = 0; i < gridWidth * gridHeight; i++) {
            let cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gridContainer.appendChild(cell);
        }
    }

    function updateGridSize() {
        gridWidth = parseInt(sizeInput.value);
        gridHeight = parseInt(sizeInput.value);
        blockWidth = 600 / gridWidth;
        gridContainer.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${gridHeight}, 1fr)`;

        return new Promise(resolve => {
            populateGridCells();
            resolve();
        });
    }

    function updateGridOpacity() {
        let cells = document.querySelectorAll('.grid-cell');
        let opacity = opacityInput.value / 10;

        return new Promise(resolve => {
            cells.forEach(cell => {
                cell.style.borderColor = `rgba(255, 255, 255, ${opacity})`;
            });
            resolve();
        });
    }

    function resetGridAndAreas() {
        grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
        allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));

        return Promise.resolve();
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
            const element = document.getElementById(block.id);
            if (element && element.checked) {
                selectedBlocks.push(block);
            }
        });

        return selectedBlocks.length > 0 ? selectedBlocks : allBlocks;
    }

    function rotateMatrix(matrix) {
        return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse());
    }

    function canPlaceBlock(block, x, y) {
        for (let i = 0; i < block.matrix.length; i++) {
            for (let j = 0; j < block.matrix[i].length; j++) {
                if (block.matrix[i][j] === 1) {
                    let newY = y + i;
                    let newX = x + j;

                    // Check if the block is within grid boundaries
                    if (newX >= gridWidth || newY >= gridHeight || newX < 0 || newY < 0) {
                        return false;
                    }

                    // Check if the block overlaps with existing blocks
                    if (grid[newY][newX] === 1) {
                        return false;
                    }

                    // Check if the block is in allowed areas
                    if (allowedAreas[newY][newX] !== 1) {
                        return false;
                    }
                }
            }
        }
        return true;
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
                    allowedAreas[y + i][x + j] = 0;

                    const blockSvg = document.createElement('img');
                    blockSvg.src = block.svgUrl;
                    blockSvg.classList.add(block.id);
                    blockSvg.style.position = 'absolute';
                    blockSvg.style.left = `${(x + j) * blockWidth}px`;
                    blockSvg.style.top = `${(y + i) * blockWidth}px`; // Adjusted to match visual representation
                    blockSvg.style.width = `${blockWidth}px`;
                    blockSvg.style.height = `${blockWidth}px`;

                    gridContainer.appendChild(blockSvg);
                }
            }
        }
    }

    function checkSelectedBlocks(blocks) {
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
                downscaledArray[y][x] = average > 0.1 ? 1 : 0;
            }
        }

        return downscaledArray;
    }

    function rasterize(text, fontUrl) {
        return new Promise((resolve, reject) => {
            if (text !== "") {
                opentype.load(fontUrl, function (err, font) {
                    if (err) {
                        alert('Font could not be loaded: ' + err);
                        reject(err);
                    } else {
                        const canvas = document.getElementById('canvas');
                        canvas.style.display = 'block';
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Calculate block size and initial font size
                        const blockSize = 600 / gridWidth;
                        let fontSize = 600; // Start with a large font size

                        // Function to check if the text fits within the canvas
                        const doesTextFit = (fontSize) => {
                            const textPath = font.getPath(text, 0, 0, fontSize);
                            const box = textPath.getBoundingBox();
                            return (box.x2 - box.x1 <= canvas.width) && (box.y2 - box.y1 <= canvas.height);
                        };

                        // Adjust the font size to fit the canvas
                        while (fontSize > 0 && !doesTextFit(fontSize)) {
                            fontSize -= 1;
                        }

                        // Get the text path and its bounding box with the final font size
                        const textPath = font.getPath(text, 0, 0, fontSize);
                        const box = textPath.getBoundingBox();

                        // Calculate offsets to position the text centered
                        const xOffset = (canvas.width - (box.x2 - box.x1)) / 2 - box.x1;
                        const yOffset = (canvas.height - (box.y2 - box.y1)) / 2 - box.y1;

                        // Render the text
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
                            allowedAreas = moveContentToBottom(downscaleArray(binaryArray, gridWidth, gridHeight));

                            resolve();
                        }, 500);
                    }
                });
            } else {
                allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));
                resolve();
            }
        });
    }

    function moveContentToBottom(array) {
        const height = array.length;
        const width = array[0].length;

        // Find the first row from the bottom that contains any 1s
        let firstRowWithContentFromBottom = -1;
        for (let y = height - 1; y >= 0; y--) {
            if (array[y].some(cell => cell === 1)) {
                firstRowWithContentFromBottom = y;
                break;
            }
        }

        // Calculate the number of rows to shift the content down
        const rowsToShift = height - 1 - firstRowWithContentFromBottom;

        // Create a new array with the same dimensions
        const newArray = Array.from({ length: height }, () => new Array(width).fill(0));

        // Copy the content to the new array shifted down by rowsToShift
        for (let y = 0; y < height; y++) {
            if (y + rowsToShift < height) {
                newArray[y + rowsToShift] = array[y];
            }
        }

        return newArray;
    }

    function populateGrid() {
        const letterInput = document.getElementById('text').value.trim();
        const fontUrl = document.getElementById('font-select').value;
        let blocks = getSelectedBlocks();
        updateGridSize().then(() => {
            return updateGridOpacity();
        }).then(() => {
            return resetGridAndAreas();
        }).then(() => {

            if (checkSelectedBlocks(blocks)) {
                alert("Please select different colors.");
                return Promise.reject("Invalid block selection.");
            }

            return rasterize(letterInput, fontUrl);
        }).then(() => {
            let placementsPossible;
            do {
                placementsPossible = false;
                for (let y = 0; y < gridHeight; y++) {  // Adjusted to start from top to bottom
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
            console.error('Failed to populate grid:', error);
        });
    }

    sizeInput.addEventListener('input', updateGridSize);
    opacityInput.addEventListener('input', updateGridOpacity);
    createBtn.addEventListener('click', populateGrid);

    // Save button event listener
    saveBtn.addEventListener('click', function () {
        html2canvas(gridContainer, {
            onrendered: function (canvas) {
                var link = document.createElement('a');
                link.href = canvas.toDataURL('image/jpeg');
                link.download = 'tetris-grid.jpg';
                link.click();
            }
        });
    });

    // Font upload event listener
    fontUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const fontData = e.target.result;
                opentype.parse(fontData, function (err, font) {
                    if (err) {
                        alert('Font could not be parsed: ' + err);
                    } else {
                        const text = document.getElementById('text').value;
                        rasterize(text, font);
                    }
                });
            };
            reader.readAsArrayBuffer(file);
        }
    });
});
