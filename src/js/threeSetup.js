import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export let scene, camera, renderer, controls;
let animationFrameId = null;
let controlsActive = false;
let settlingFrames = 0;

export function requestThreeRender(frames = 1) {
    settlingFrames = Math.max(settlingFrames, frames);
    if (animationFrameId === null) animationFrameId = requestAnimationFrame(renderFrame);
}

function renderFrame() {
    animationFrameId = null;
    const controlsChanged = controls?.update() ?? false;
    renderer?.render(scene, camera);
    settlingFrames = Math.max(0, settlingFrames - 1);

    if (controlsActive || controlsChanged || settlingFrames > 0) {
        animationFrameId = requestAnimationFrame(renderFrame);
    }
}

// Helper function to get responsive size
function getResponsiveCanvasSize() {
    const container = document.getElementById('tetris-grid-container');
    const rect = container.getBoundingClientRect();
    return Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
}

export function initThreeJS() {
    scene = new THREE.Scene();
    
    const container = document.getElementById('three-container');
    const initialSize = getResponsiveCanvasSize();
    
    // Use 1:1 aspect ratio for consistency
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    console.log('Initial container size:', initialSize);
    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(initialSize, initialSize);
    renderer.domElement.id = 'three-canvas';
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.1;
    controls.maxDistance = 100;
    controls.addEventListener('start', () => {
        controlsActive = true;
        requestThreeRender();
    });
    controls.addEventListener('end', () => {
        controlsActive = false;
        requestThreeRender(30);
    });

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5).normalize();
    scene.add(light);

    camera.position.z = 1;

    // Make globally accessible for mobile resize handling
    window.renderer = renderer;
    window.camera = camera;
    window.scene = scene;
    window.controls = controls;

    // Handle window resize with mobile-aware logic
    function handleResize() {
        setTimeout(() => {
            const newSize = getResponsiveCanvasSize();
            
            // Update renderer size
            renderer.setSize(newSize, newSize);
            
            // Keep 1:1 aspect ratio
            camera.aspect = 1;
            camera.updateProjectionMatrix();
            
            // Update container styling
            container.style.width = newSize + 'px';
            container.style.height = newSize + 'px';
            
            console.log('Three.js resized to:', newSize);
            requestThreeRender();
        }, 100);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 500); // Longer delay for orientation change
    });

    requestThreeRender();
}
