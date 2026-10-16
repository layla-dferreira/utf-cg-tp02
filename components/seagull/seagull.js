import { createProgram, createShader } from '../../utils.js';

export async function setupSeagull(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/seagull/vertexShader.glsl'),
        fetch('./components/seagull/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'seagull vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'seagull fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1.0);

    return { 
        programInfo, 
        bufferInfo 
    };
}

export function drawSeagull(gl, matrix4, seagullData, viewProjectionMatrix, time) {
    if (!seagullData) return;

    gl.useProgram(seagullData.programInfo.program);
    twgl.setBuffersAndAttributes(gl, seagullData.programInfo, seagullData.bufferInfo);

    const whiteColor = [0.9, 0.9, 0.9, 1.0];
    const grayColor = [0.7, 0.7, 0.7, 1.0];
    const yellowColor = [0.8, 0.9, 0.1, 1.0];
    const blackColor = [0.0, 0.0, 0.0, 1.0];

    function drawSeagullPart(modelMatrix, scale, color) {
        const scaleModelMatrix = matrix4.scale(modelMatrix, scale);
        twgl.setUniforms(seagullData.programInfo, {
            viewProjection: viewProjectionMatrix,
            model: scaleModelMatrix,
            color: color
        });
        twgl.drawBufferInfo(gl, seagullData.bufferInfo);
    }

    const angle = time * 0.1;
    const radius = 12.0;
    const height = 10.0 + Math.sin(time * 1.0) * 1.0;

    let seagullPosition = matrix4.translation([
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
    ]);
    seagullPosition = matrix4.rotateY(seagullPosition, -angle);

    const bodyNode = seagullPosition;
    drawSeagullPart(bodyNode, [1.5, 1.2, 2.5], whiteColor);

    let legLeft = matrix4.translate(bodyNode, [0.3, -0.8, -0.2]); 
    drawSeagullPart(legLeft, [0.2, 0.5, 0.2], yellowColor);
    let footLeft = matrix4.translate(legLeft, [0, -0.25, 0.2]);
    drawSeagullPart(footLeft, [0.25, 0.15, 0.4], yellowColor); 

    let legRight = matrix4.translate(bodyNode, [-0.3, -0.8, -0.2]); 
    drawSeagullPart(legRight, [0.2, 0.5, 0.2], yellowColor);
    let footRight = matrix4.translate(legRight, [0, -0.25, 0.2]); 
    drawSeagullPart(footRight, [0.25, 0.15, 0.4], yellowColor);

    let neckNode = matrix4.translate(bodyNode, [0.0, 1.0, 1.0]);
    drawSeagullPart(neckNode, [0.6, 1.5, 0.6], grayColor);

    let headNode = matrix4.translate(neckNode, [0.0, 1.0, 0.2]);
    drawSeagullPart(headNode, [0.9, 0.9, 0.9], whiteColor);

    let beakNode = matrix4.translate(headNode, [0.0, -0.1, 0.8]);
    drawSeagullPart(beakNode, [0.4, 0.3, 1.2], yellowColor);

    let eyeLeft = matrix4.translate(headNode, [0.46, 0.1, 0.2]); 
    drawSeagullPart(eyeLeft, [0.1, 0.15, 0.15], blackColor); 

    let eyeRight = matrix4.translate(headNode, [-0.46, 0.1, 0.2]); 
    drawSeagullPart(eyeRight, [0.1, 0.15, 0.15], blackColor);

    let tailNode = matrix4.translate(bodyNode, [0.0, 0.2, -1.5]);
    drawSeagullPart(tailNode, [0.8, 0.4, 1.0], grayColor);

    const flapSpeed = time * 1.0;
    const flapAngle = Math.sin(flapSpeed) * 0.6;

    let wingLeft = matrix4.translate(bodyNode, [0.75, 0.3, 0.0]); 
    wingLeft = matrix4.rotateZ(wingLeft, flapAngle);               
    wingLeft = matrix4.translate(wingLeft, [1.8, 0.0, 0.0]);          
    drawSeagullPart(wingLeft, [3.6, 0.2, 1.5], whiteColor);

    let wingRight = matrix4.translate(bodyNode, [-0.75, 0.3, 0.0]); 
    wingRight = matrix4.rotateZ(wingRight, -flapAngle);              
    wingRight = matrix4.translate(wingRight, [-1.8, 0.0, 0.0]);
    drawSeagullPart(wingRight, [3.6, 0.2, 1.5], whiteColor);
}
