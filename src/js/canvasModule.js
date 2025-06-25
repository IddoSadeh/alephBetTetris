import { ctx, sizeInput, opacityInput, pieceImages, saturationInput, hueInput, luminanceInput, canvas, state } from './variables.js';
import { updateThreeJSColorAdjustments } from './utilityFunctions.js';


export function updateCanvasSize() {
    state.gridWidth = parseInt(sizeInput.value);
    state.gridHeight = parseInt(sizeInput.value);
    state.blockWidth = canvas.width / state.gridWidth;

    state.grid = Array.from(Array(state.gridHeight), () => new Array(state.gridWidth).fill(0));
    state.allowedAreas = Array.from(Array(state.gridHeight), () => new Array(state.gridWidth).fill(1));

    return new Promise(resolve => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        resolve();
    });
}

export function updateCanvasOpacity() {
    const opacity = opacityInput.value / 10;
    canvas.style.borderColor = `rgba(255, 255, 255, ${opacity})`;
    drawGrid();
    return Promise.resolve();
}




export function handleColorAdjustments() {
    updateCanvasColorAdjustments();
    updateThreeJSColorAdjustments();
}

export function updateCanvasColorAdjustments() {
    const saturationValue = saturationInput.value;
    const hueValue = hueInput.value;
    const luminanceValue = luminanceInput.value;

    const filterValue = `
        saturate(${saturationValue}%)
        hue-rotate(${hueValue}deg)
        brightness(${luminanceValue}%)
    `;

    canvas.style.filter = filterValue;

    pieceImages.forEach(img => {
        img.style.filter = filterValue;
    });
}

export function drawGrid() {
    ctx.lineWidth = 1;
    for (let i = 0; i <= state.gridWidth; i++) {
        ctx.beginPath();
        ctx.moveTo(i * state.blockWidth, 0);
        ctx.lineTo(i * state.blockWidth, canvas.height);
        ctx.strokeStyle = `rgba(0, 0, 0, 1)`;
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacityInput.value / 10})`;
        ctx.stroke();
    }
    for (let i = 0; i <= state.gridHeight; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * state.blockWidth);
        ctx.lineTo(canvas.width, i * state.blockWidth);
        ctx.strokeStyle = `rgba(0, 0, 0, 1)`;
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacityInput.value / 10})`;
        ctx.stroke();
    }
    updateCanvasColorAdjustments();
}
