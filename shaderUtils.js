import * as THREE from 'three';

export const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D texture;

    void main() {
        vec4 texColor = texture2D(texture, vUv);
        gl_FragColor = texColor;
    }
`;

export function createCustomMaterial(texture) {
    return new THREE.ShaderMaterial({
        uniforms: {
            texture: { value: texture }
        },
        vertexShader,
        fragmentShader
    });
}
