import { addEventListeners } from './js/eventListeners.js';
import { drawGrid } from './js/canvasModule.js';
import { initThreeJS } from './js/threeSetup.js';

document.addEventListener("DOMContentLoaded", function () {
    initThreeJS();
    addEventListeners();
    drawGrid();
});
