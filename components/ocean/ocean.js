import { createProgram, createShader } from '../../utils.js';

export async function setupOcean(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/ocean/vertexShader.glsl'),
        fetch('./components/ocean/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'ocean vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'ocean fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);
    const bufferInfo = twgl.primitives.createDiscBufferInfo(gl, 15, 64);

    return { 
        programInfo, 
        bufferInfo 
    };
}

export function drawOcean(gl, matrix4, oceanData, model) {
    gl.useProgram(oceanData.programInfo.program);
    twgl.setBuffersAndAttributes(gl, oceanData.programInfo, oceanData.bufferInfo);

    twgl.setUniforms(oceanData.programInfo, {
        model: model,
    });

    twgl.drawBufferInfo(gl, oceanData.bufferInfo);
}