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
    const bufferInfo = twgl.primitives.createPlaneBufferInfo(gl, 39.8, 39.8, 100, 100);

    return { 
        programInfo, 
        bufferInfo 
    };
}

export function drawOcean(gl, matrix4, oceanData, viewProjectionMatrix, time, sceneConfig) {
    if (!oceanData) return;

    gl.useProgram(oceanData.programInfo.program);
    twgl.setBuffersAndAttributes(gl, oceanData.programInfo, oceanData.bufferInfo);

    const modelMatrix = matrix4.translation([0.0, 0.0, 0.0]);

    let lightingEnabled;
        if (sceneConfig.lighting) {
            lightingEnabled = 1;
        } else {
            lightingEnabled = 0;
        }

    twgl.setUniforms(oceanData.programInfo, {
        viewProjection: viewProjectionMatrix,
        model: modelMatrix,
        uLightPos: sceneConfig.sunPos,
        uViewPos: sceneConfig.camPos,
        uUseLighting: lightingEnabled,
        time: time
    });

    twgl.drawBufferInfo(gl, oceanData.bufferInfo);
}