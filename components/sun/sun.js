import { createProgram, createShader } from '../../utils.js';

export async function setupSun(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/sun/vertexShader.glsl'),
        fetch('./components/sun/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'sun vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'sun fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);
    const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 3, 32, 32);

    return { 
        programInfo, 
        bufferInfo 
    };
}

export function drawSun(gl, matrix4, sunData, model) {
    gl.useProgram(sunData.programInfo.program);
    twgl.setBuffersAndAttributes(gl, sunData.programInfo, sunData.bufferInfo);

    const sunPosition = matrix4.translation([0, 15, -10]);
    const modelMatrix = matrix4.multiply(model, sunPosition);

    twgl.setUniforms(sunData.programInfo, {
        model: modelMatrix
    });

    twgl.drawBufferInfo(gl, sunData.bufferInfo);
}