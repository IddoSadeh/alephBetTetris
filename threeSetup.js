import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export let scene, camera, renderer, controls;

export function initThreeJS() {
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000);

    const container = document.getElementById('three-container');
    const containerWidth = 600;
    const containerHeight = 600;
    console.log('Container dimensions:', containerWidth, containerHeight);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(containerWidth, containerHeight);
    renderer.domElement.id = 'three-canvas';  // Give the canvas an ID
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

    camera.position.z = 1; // Adjust the camera position to zoom out

    window.addEventListener('resize', () => {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        camera.aspect = containerWidth / containerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerWidth, containerHeight);
    });



    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();
}
