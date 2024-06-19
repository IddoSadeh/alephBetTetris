export const container = document.getElementById('container');
export const canvas = document.getElementById('tetris-canvas');
export const ctx = canvas.getContext('2d', { willReadFrequently: true });
export const sizeInput = document.getElementById('size');
export const opacityInput = document.getElementById('opacity');
export const textInput = document.getElementById('text');
export const saveBtn = document.getElementById('save');
export const exportFormat = document.getElementById('export-format');
export const fontUpload = document.getElementById('font-upload');
export const fontSelect = document.getElementById('font-select');
export const checkboxes = document.querySelectorAll('.pieces-checkbox input[type=checkbox]');
export const pieceImages = document.querySelectorAll('.pieces-checkbox img');
export const welcomeScreen = document.getElementById('welcome-screen');
export const closeWelcomeBtn = document.getElementById('close-welcome');
export const helpButton = document.getElementById('help-button');
export const saturationInput = document.getElementById('saturation');
export const hueInput = document.getElementById('hue');
export const luminanceInput = document.getElementById('luminance');
export const toggleButton = document.getElementById('toggle-view');
export const tetrisCanvas = document.getElementById('tetris-canvas');
export const threeContainer = document.getElementById('three-container');
export const layerSlider = document.getElementById('layer-slider');
export const opacityHelper = document.getElementById('opacity-helper');
export const threedHelper = document.getElementById('threed-helper');
export let state = {
    gridWidth: 12,
    gridHeight: 12,
    blockWidth: 50,
    grid: Array.from(Array(12), () => new Array(12).fill(0)),
    allowedAreas: Array.from(Array(12), () => new Array(12).fill(1)),
    repopulateTimeout: null
};