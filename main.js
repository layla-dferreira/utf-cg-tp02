import { setupOcean, drawOcean } from './components/ocean/ocean.js';

const canvas = document.querySelector('.canvas-one-piece');
const gl = canvas.getContext('webgl2');

const matrix4 = twgl.m4;

if (!gl) {
    console.error('WebGL não esta disponivel.');
    throw new Error('WebGL não suportado.');
}

async function start() {

    const oceanData = await setupOcean(gl);

    function render() {
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.1, 0.3, 0.6, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        const rot = 45 * Math.PI / 180, aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zFar = 1000.0, zNear = 0.1;
        
        const projectionMatrix = matrix4.perspective(rot, aspect, zNear, zFar);

        const cameraPosition = [0, 10, 20], target = [0, 0, 0], up = [0, 1, 0];

        const cameraMatrix = matrix4.lookAt(cameraPosition, target, up);
        const viewMatrix = matrix4.inverse(cameraMatrix);
        const viewProjectionMatrix = matrix4.multiply(projectionMatrix, viewMatrix);

        drawOcean(gl, matrix4, oceanData, viewProjectionMatrix);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

try {
    await start();
} catch (error) {
    console.error(error);
}