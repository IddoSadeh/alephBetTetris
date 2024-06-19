import { addEventListeners } from './eventListeners.js';
import { drawGrid } from './canvasModule.js';
import { initThreeJS } from './threeSetup.js';

document.addEventListener("DOMContentLoaded", function () {
    initThreeJS();
    addEventListeners();
    drawGrid();
});
