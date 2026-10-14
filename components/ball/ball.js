import { createProgram, createShader } from '../../utils.js';

export async function setupBall(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/ball/vertexShader.glsl'),
        fetch('./components/ball/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'ball vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'ball fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);

    const radius = 20.0;
    const segHorizontal = 64;
    const segVertical = 32;

    const bottomBuffer = twgl.primitives.createSphereBufferInfo(gl, radius, segHorizontal, segVertical, Math.PI / 2, Math.PI, 0, 2 * Math.PI);
    const bottomVao = twgl.createVertexArrayInfo(gl, programInfo, bottomBuffer);
    const bottomTexture = twgl.createTexture(gl, {
        src: new Uint8Array([230, 230, 230, 255]), 
        width: 1,   
        height: 1
    });

    const topBuffer = twgl.primitives.createSphereBufferInfo(gl, radius, segHorizontal, segVertical, 0, Math.PI / 2, 0, 2 * Math.PI);
    const topVao = twgl.createVertexArrayInfo(gl, programInfo, topBuffer);
    const topTexture = twgl.createTexture(gl, {
        src: new Uint8Array([150, 210, 255, 40]), 
        width: 1,   
        height: 1
    });

    return { programInfo,
        bottom: { bufferInfo: bottomBuffer, vao: bottomVao, texture: bottomTexture },
        top: { bufferInfo: topBuffer, vao: topVao, texture: topTexture }
    };
}

export function drawBall(gl, matrix4, ballData, viewProjectionMatrix) {
    if (!ballData) return;

    gl.useProgram(ballData.programInfo.program);
    gl.disable(gl.CULL_FACE);

    let modelMatrix = matrix4.translation([0.0, -0.1, 0.0]);
    const finalMatrix = matrix4.multiply(viewProjectionMatrix, modelMatrix);

    gl.bindVertexArray(ballData.bottom.vao.vertexArrayObject || ballData.bottom.vao);
    twgl.setUniforms(ballData.programInfo, {
        model: finalMatrix,
        textureSampler: ballData.bottom.texture
    });
    twgl.drawBufferInfo(gl, ballData.bottom.bufferInfo);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    gl.bindVertexArray(ballData.top.vao.vertexArrayObject || ballData.top.vao);
    twgl.setUniforms(ballData.programInfo, {
        model: finalMatrix,
        textureSampler: ballData.top.texture
    });
    twgl.drawBufferInfo(gl, ballData.top.bufferInfo);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.bindVertexArray(null);
}