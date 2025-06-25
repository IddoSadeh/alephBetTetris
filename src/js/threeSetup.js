import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export let scene, camera, renderer, controls;

// Helper function to get responsive size
function getResponsiveCanvasSize() {
    const container = document.getElementById('tetris-grid-container');
    if (window.innerWidth <= 768) {
        // Mobile: use the grid container size
        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height, window.innerWidth - 40, window.innerHeight - 200);
        return Math.max(300, size);
    } else {
        // Desktop: use fixed 600px
        return 600;
    }
}

export function initThreeJS() {
    scene = new THREE.Scene();
    
    const container = document.getElementById('three-container');
    const initialSize = getResponsiveCanvasSize();
    
    // Use 1:1 aspect ratio for consistency
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    console.log('Initial container size:', initialSize);
    renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true, alpha: true });
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
        }, 100);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 500); // Longer delay for orientation change
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
}