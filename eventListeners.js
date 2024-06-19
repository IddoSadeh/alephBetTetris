import * as vars from './variables.js';
import * as utils from './utilityFunctions.js';
import { updateCanvasColorAdjustments, updateCanvasOpacity, updateCanvasSize, drawGrid } from './canvasModule.js';

export function addEventListeners() {
    vars.sizeInput.addEventListener('input', () => {
        const textValue = vars.textInput.value.trim();
        if (utils.isValidHebrewCharacter(textValue)) {
            utils.populateCanvas();
        } else {
            updateCanvasSize();
        }
    });

    vars.saturationInput.addEventListener('input', updateCanvasColorAdjustments);
    vars.hueInput.addEventListener('input', updateCanvasColorAdjustments);
    vars.luminanceInput.addEventListener('input', updateCanvasColorAdjustments);

    vars.opacityInput.addEventListener('input', updateCanvasOpacity);
    vars.textInput.addEventListener('input', () => {
        const textValue = vars.textInput.value.trim();
        if (utils.isValidHebrewCharacter(textValue)) {
            utils.populateCanvas();
        } else {
            console.warn('Invalid input: Only a single Hebrew character is allowed.');
        }
    });
    vars.fontSelect.addEventListener('input', utils.populateCanvas);

    vars.saveBtn.addEventListener('click', function () {
        const tempCanvas = document.createElement('canvas');
        const originalWidth = vars.canvas.width / 0.1;
        const originalHeight = vars.canvas.height / 0.1;
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        tempCtx.drawImage(vars.canvas, 0, 0, originalWidth, originalHeight);

        const format = vars.exportFormat.value;
        const extension = format === 'jpeg' ? 'jpg' : format;
        const mimeType = `image/${format}`;

        tempCanvas.toBlob(function (blob) {
            let link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `grid-image.${extension}`;
            link.click();
        }, mimeType);
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
                    if (utils.isValidHebrewCharacter(textValue)) {
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
                if (utils.isValidHebrewCharacter(textValue)) {
                    utils.populateCanvas();
                }
            }, 1000);
        });
    });

    vars.closeWelcomeBtn.addEventListener('click', () => {
        vars.welcomeScreen.style.display = 'none';
        drawGrid();
    });

    vars.helpButton.addEventListener('click', () => {
        vars.welcomeScreen.style.display = 'block';
    });
}
