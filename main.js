import { addEventListeners } from './eventListeners.js';
import { drawGrid } from './canvasModule.js';

document.addEventListener("DOMContentLoaded", function () {
    addEventListeners();
    drawGrid();
});
