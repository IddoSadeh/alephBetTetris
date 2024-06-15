document.addEventListener("DOMContentLoaded", function () {
    // Define variables
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const sizeInput = document.getElementById('size');
    const opacityInput = document.getElementById('opacity');
    const textInput = document.getElementById('text');
    const saveBtn = document.getElementById('save');
    const exportFormat = document.getElementById('export-format');
    const fontUpload = document.getElementById('font-upload');
    const fontSelect = document.getElementById('font-select');
    const checkboxes = document.querySelectorAll('.pieces-checkbox input[type=checkbox]');
    const welcomeScreen = document.getElementById('welcome-screen');
    const closeWelcomeBtn = document.getElementById('close-welcome');
    const helpButton = document.getElementById('help-button');
    let gridWidth = 12;
    let gridHeight = 12;
    let blockWidth = 50;
    let grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
    let allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));
    let repopulateTimeout;

    // Define functions
    function updateCanvasSize() {
        gridWidth = parseInt(sizeInput.value);
        gridHeight = parseInt(sizeInput.value);
        blockWidth = canvas.width / gridWidth;
        return new Promise(resolve => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            resolve();
        });
    }

    function updateCanvasOpacity() {
        const opacity = opacityInput.value / 10;
        canvas.style.borderColor = `rgba(255, 255, 255, ${opacity})`;
        drawGrid();
        return Promise.resolve();
    }

    function resetGridAndAreas() {
        grid = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(0));
        allowedAreas = Array.from(Array(gridHeight), () => new Array(gridWidth).fill(1));
        return Promise.resolve();
    }

    function drawGrid() {

        ctx.lineWidth = 1;
    
        for (let i = 0; i <= gridWidth; i++) {
            ctx.beginPath();
            ctx.moveTo(i * blockWidth, 0);
            ctx.lineTo(i * blockWidth, canvas.height);
            // Draw the line in black first
            ctx.strokeStyle = `rgba(0, 0, 0, 1)`;
            ctx.stroke();
            // Draw the line in white with the specified opacity
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityInput.value / 10})`;
            ctx.stroke();
        }
    
        for (let i = 0; i <= gridHeight; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * blockWidth);
            ctx.lineTo(canvas.width, i * blockWidth);
            // Draw the line in black first
            ctx.strokeStyle = `rgba(0, 0, 0, 1)`;
            ctx.stroke();
            // Draw the line in white with the specified opacity
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityInput.value / 10})`;
            ctx.stroke();
        }
    }
    

    function drawBlock(block, x, y) {
        const img = new Image();
        img.src = block.svgUrl;
        img.onload = () => {
            ctx.drawImage(img, x * blockWidth, y * blockWidth, blockWidth, blockWidth);
        };
    }

    function placeBlock(block, x, y) {
        for (let i = 0; i < block.matrix.length; i++) {
            for (let j = 0; j < block.matrix[i].length; j++) {
                if (block.matrix[i][j] === 1) {
                    grid[y + i][x + j] = 1;
                    allowedAreas[y + i][x + j] = 0;
                    drawBlock(block, x + j, y + i);
                }
            }
        }
    }

    function populateCanvas() {
        const letterInput = textInput.value.trim();
        const fontUrl = fontSelect.value;
        let blocks = getSelectedBlocks();
        updateCanvasSize().then(() => {
            return updateCanvasOpacity();
        }).then(() => {
            return resetGridAndAreas();
        }).then(() => {
            return rasterize(letterInput, fontUrl);
        }).then(() => {
            let placementsPossible;
            do {
                placementsPossible = false;
                for (let y = 0; y < gridHeight; y++) {
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

    function isValidHebrewCharacter(input) {
        return /^[\u0590-\u05FF]$/.test(input);
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

                    if (newX >= gridWidth || newY >= gridHeight || newX < 0 || newY < 0) {
                        return false;
                    }

                    if (grid[newY][newX] === 1) {
                        return false;
                    }

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
                        const ctx = canvas.getContext('2d',{ willReadFrequently: true });
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        const blockSize = 600 / gridWidth;
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

    // Event listeners
    sizeInput.addEventListener('input', () => {
        const textValue = textInput.value.trim();
        if (isValidHebrewCharacter(textValue)) {
            populateCanvas();
        } else {
            updateCanvasSize();
        }
    });

    opacityInput.addEventListener('input', updateCanvasOpacity);
    textInput.addEventListener('input', () => {
        const textValue = textInput.value.trim();
        if (isValidHebrewCharacter(textValue)) {
            populateCanvas();
        } else {
            console.warn('Invalid input: Only a single Hebrew character is allowed.');
        }
    });
    fontSelect.addEventListener('input', populateCanvas); 


    saveBtn.addEventListener('click', function () {
        // Create a temporary canvas to downscale the high-resolution canvas
        const tempCanvas = document.createElement('canvas');
        const originalWidth = canvas.width / 0.1;
        const originalHeight = canvas.height / 0.1;
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d',{ willReadFrequently: true });
        
        // Draw the high-resolution canvas onto the temporary canvas
        tempCtx.drawImage(canvas, 0, 0, originalWidth, originalHeight);
    
        const format = exportFormat.value;
        const extension = format === 'jpeg' ? 'jpg' : format;
        const mimeType = `image/${format}`;
    
        tempCanvas.toBlob(function (blob) {
            let link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `grid-image.${extension}`;
            link.click();
        }, mimeType);
    });

    fontUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const fontData = e.target.result;
                
                try {
                    const font = opentype.parse(fontData);
    
                    // Add the uploaded font to the dropdown menu and select it
                    const option = document.createElement('option');
                    option.value = URL.createObjectURL(new Blob([fontData], { type: 'font/ttf' }));
                    option.text = file.name;
                    fontSelect.add(option);
                    fontSelect.value = option.value;
    
                    // Repopulate the canvas
                    const textValue = textInput.value.trim();
                    if (isValidHebrewCharacter(textValue)) {
                        populateCanvas();
                    } else {
                        console.warn('Invalid input: Only a single Hebrew character is allowed.');
                    }
                } catch (err) {
                    alert('Font could not be parsed: ' + err);
                }
            };
            reader.onerror = function (e) {
                alert('Error reading file: ' + e);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('No file selected');
        }
    });
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            clearTimeout(repopulateTimeout);
            repopulateTimeout = setTimeout(() => {
                const textValue = textInput.value.trim();
                if (isValidHebrewCharacter(textValue)) {
                    populateCanvas();
                }
            }, 1000); // Wait for 1 second before repopulating
        });
    });

    // Initial grid drawing on page load
    welcomeScreen.style.display = 'block';
    closeWelcomeBtn.addEventListener('click', () => {
        welcomeScreen.style.display = 'none';
        drawGrid();
    });

    helpButton.addEventListener('click', () => {
        welcomeScreen.style.display = 'block';
    });
});
