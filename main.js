import { setupSun, drawSun } from './components/sun/sun.js';
import { setupClouds, drawClouds } from './components/clouds/clouds.js';
import { setupOcean, drawOcean } from './components/ocean/ocean.js';
import { setupGoingMerry, drawGoingMerry } from './components/goingMerry/goingMerry.js';
import { setupChopper, drawChopper } from './components/chopper/chopper.js';
import { setupKaru, drawKaru } from './components/karu/karu.js';
import { setupLuffy, drawLuffy } from './components/luffy/luffy.js';

const canvas = document.querySelector('.canvas-one-piece');
const gl = canvas.getContext('webgl2');

const matrix4 = twgl.m4;

if (!gl) {
    console.error('WebGL não esta disponivel.');
    throw new Error('WebGL não suportado.');
}

let activeCamera = 1;
let cameraRadius = {
    camera1: 60,
    camera2: 60
};
let cameraAngleX = {
    camera1: 0, 
    camera2: 0,
    camera3: 0
};
let cameraAngleY = {
    camera1: Math.PI / 4,
    camera2: Math.PI / 4,
    camera3: 0
};
let isDragging = false;
let mouseX = 0;
let mouseY = 0;

window.addEventListener('keydown', (event) => {
    if (event.key === '1') {
        activeCamera = 1;
    } else if (event.key === '2') {
        activeCamera = 2;
    } else if (event.key === '3') {
        activeCamera = 3;
    }
});

canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomSpeed = 0.05;

    if (activeCamera === 1) {
        cameraRadius.camera1 += event.deltaY * zoomSpeed;
        cameraRadius.camera1 = Math.max(10, Math.min(cameraRadius.camera1, 200));
    } else if (activeCamera === 2) {
        cameraRadius.camera2 += event.deltaY * zoomSpeed;
        cameraRadius.camera2 = Math.max(10, Math.min(cameraRadius.camera2, 200));
    }
});

canvas.addEventListener('mousedown', (event) => {
    if (activeCamera === 2 || activeCamera === 3) {
        isDragging = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mousemove', (event) => {
    if (isDragging && activeCamera === 2) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        cameraAngleX.camera2 += deltaX * 0.01;
        cameraAngleY.camera2 += deltaY * 0.01;

        const limit = 1.55;
        cameraAngleY.camera2 = Math.max(-limit, Math.min(limit, cameraAngleY.camera2));
    } else if (isDragging && activeCamera === 3) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        cameraAngleX.camera3 -= deltaX * 0.01;
        cameraAngleY.camera3 -= deltaY * 0.01;

        const limit = 1.55;
        cameraAngleY.camera3 = Math.max(-limit, Math.min(limit, cameraAngleY.camera3));
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
});

async function start() {
    const sun = await setupSun(gl);
    const clouds = await setupClouds(gl);
    const ocean = await setupOcean(gl);
    const goingMerry = await setupGoingMerry(gl);
    const chopper = await setupChopper(gl);
    const karu = await setupKaru(gl);
    const luffy = await setupLuffy(gl);

    function render(time) {
        const seconds = time * 0.01;

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        const fov = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projectionMatrix = matrix4.perspective(fov, aspect, 0.1, 1000.0);

        let cameraPosition, target = [0, 0, 0];
        const up = [0, 1, 0];

        if (activeCamera === 1) {
            const speed = 0.04;
            const currentAngle = seconds * speed;

            const y = Math.sin(cameraAngleY.camera1) * cameraRadius.camera1;
            const xzRadius = Math.cos(cameraAngleY.camera1) * cameraRadius.camera1;
            
            const x = Math.cos(currentAngle) * xzRadius;
            const z = Math.sin(currentAngle) * xzRadius;

            cameraPosition = [x, y, z];
        } else if (activeCamera === 2) {
            const y = Math.sin(cameraAngleY.camera2) * cameraRadius.camera2;
            const xzRadius = Math.cos(cameraAngleY.camera2) * cameraRadius.camera2;
            
            const x = Math.sin(cameraAngleX.camera2) * xzRadius;
            const z = Math.cos(cameraAngleX.camera2) * xzRadius;
            
            cameraPosition = [x, y, z];
        } else if (activeCamera === 3) {
            cameraPosition = [0, 2.6, 0];

            const y = Math.sin(cameraAngleY.camera3);
            const xz = Math.cos(cameraAngleY.camera3);
            
            const x = Math.sin(cameraAngleX.camera3) * xz;
            const z = Math.cos(cameraAngleX.camera3) * xz;
            
            target = [
                cameraPosition[0] + x,
                cameraPosition[1] + y,
                cameraPosition[2] + z
            ];
        }

        const cameraMatrix = matrix4.lookAt(cameraPosition, target, up);
        const viewMatrix = matrix4.inverse(cameraMatrix);
        const viewProjectionMatrix = matrix4.multiply(projectionMatrix, viewMatrix);


        drawSun(gl, matrix4, sun, viewProjectionMatrix);
        drawClouds(gl, matrix4, clouds, viewProjectionMatrix, [-12, 15, -10]);
        drawClouds(gl, matrix4, clouds, viewProjectionMatrix, [12, 15, -10]);
        drawGoingMerry(gl, matrix4, goingMerry, viewProjectionMatrix);
        drawOcean(gl, matrix4, ocean, viewProjectionMatrix);
        drawChopper(gl, matrix4, chopper, viewProjectionMatrix);
        drawKaru(gl, matrix4, karu, viewProjectionMatrix);
        drawLuffy(gl, matrix4, luffy, viewProjectionMatrix);
        
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

try {
    await start();
} catch (error) {
    console.error(error);
}