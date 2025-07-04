import * as vars from './variables.js';
import * as utils from './utilityFunctions.js';
import { handleColorAdjustments, updateCanvasOpacity, updateCanvasSize, drawGrid } from './canvasModule.js';
import { renderer, scene } from './threeSetup.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { handleMobileResize } from './utilityFunctions.js';

export function addEventListeners() {
    vars.sizeInput.addEventListener('input', () => {
        const textValue = vars.textInput.value.trim();
        if (utils.isValidCharacter(textValue)) {
            utils.populateCanvas();
        } else {
            updateCanvasSize();
        }
    });
    vars.toggleButton.addEventListener('click', function () {
        if (vars.threeContainer.style.display === 'none' || vars.threeContainer.style.display === '') {
            vars.opacityHelper.style.display = "none";
            vars.threedHelper.style.display = "block";
            vars.threeContainer.style.display = 'block';
            vars.tetrisCanvas.style.display = 'none';
            vars.toggleButton.textContent = 'Switch to 2D View';
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    handleMobileResize();
                }, 100);
            }
        } else {
            vars.opacityHelper.style.display = "block";
            vars.threedHelper.style.display = "none";
            vars.threeContainer.style.display = 'none';
            vars.tetrisCanvas.style.display = 'block';
            vars.toggleButton.textContent = 'Switch to 3D View';
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    handleMobileResize();
                    drawGrid();
                }, 100);
            }
        }
    });

    if (window.innerWidth <= 768) {
        let mobileResizeTimeout;

        window.addEventListener('resize', () => {
            clearTimeout(mobileResizeTimeout);
            mobileResizeTimeout = setTimeout(() => {
                handleMobileResize();
                // Redraw if there's content
                const textValue = vars.textInput.value.trim();
                if (utils.isValidCharacter(textValue)) {
                    utils.populateCanvas();
                } else {
                    drawGrid();
                }
            }, 250);
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                handleMobileResize();
                const textValue = vars.textInput.value.trim();
                if (utils.isValidCharacter(textValue)) {
                    utils.populateCanvas();
                } else {
                    drawGrid();
                }
            }, 500);
        });

        // Initial mobile setup
        setTimeout(() => {
            handleMobileResize();
        }, 100);
    }
    vars.layerSlider.addEventListener('input', function () {
        utils.populateCanvas(); // Redraw the cubes when the slider value changes
    });

    vars.saturationInput.addEventListener('input', handleColorAdjustments);
    vars.hueInput.addEventListener('input', handleColorAdjustments);
    vars.luminanceInput.addEventListener('input', handleColorAdjustments)

    vars.opacityInput.addEventListener('input', updateCanvasOpacity);
    vars.textInput.addEventListener('input', () => {
        const textValue = vars.textInput.value.trim();
        if (utils.isValidCharacter(textValue)) {
            utils.populateCanvas();
        } else {
            console.warn('Invalid input: Only a single Hebrew character is allowed.');
        }
    });
    vars.fontSelect.addEventListener('input', utils.populateCanvas);

    vars.saveBtn.addEventListener('click', function () {
        const format = vars.exportFormat.value;
        const extension = format === 'jpeg' ? 'jpg' : format;
        const mimeType = `image/${format}`;

        if (vars.threeContainer.style.display === 'block') {
            if (extension === 'png' || extension === 'jpg') {
                // Save 3D scene as PNG or JPEG
                const dataUrl = renderer.domElement.toDataURL(mimeType);
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `3d-grid-image.${extension}`;
                link.click();
            } else if (extension === 'obj') {
                // Save 3D scene as OBJ
                const exporter = new OBJExporter();
                const objData = exporter.parse(scene);
                const blob = new Blob([objData], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = '3d-grid-model.obj';
                link.click();
            }
        } else {
            // Save 2D canvas
            const tempCanvas = document.createElement('canvas');
            const originalWidth = vars.tetrisCanvas.width / 0.1;
            const originalHeight = vars.tetrisCanvas.height / 0.1;
            tempCanvas.width = originalWidth;
            tempCanvas.height = originalHeight;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

            tempCtx.drawImage(vars.tetrisCanvas, 0, 0, originalWidth, originalHeight);

            tempCanvas.toBlob(function (blob) {
                let link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `grid-image.${extension}`;
                link.click();
            }, mimeType);
        }
    });

    vars.fontUpload.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const fontData = e.target.result;
                try {
                    const font = opentype.parse(fontData);

                    const option = document.createElement('option');
                    option.value = URL.createObjectURL(new Blob([fontData], { type: 'font/ttf' }));
                    option.text = file.name;
                    vars.fontSelect.add(option);
                    vars.fontSelect.value = option.value;

                    const textValue = vars.textInput.value.trim();
                    if (utils.isValidCharacter(textValue)) {
                        utils.populateCanvas();
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

    vars.checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            clearTimeout(vars.state.repopulateTimeout);
            vars.state.repopulateTimeout = setTimeout(() => {
                const textValue = vars.textInput.value.trim();
                if (utils.isValidCharacter(textValue)) {
                    utils.populateCanvas();
                }
            }, 1000);
        });
    });

    vars.welcomeScreen.style.display = 'block';
    vars.closeWelcomeBtn.addEventListener('click', () => {
        vars.welcomeScreen.style.display = 'none';
        drawGrid();
    });

    vars.helpButton.addEventListener('click', () => {
        vars.welcomeScreen.style.display = 'block';
    });

}
