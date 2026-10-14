import { createProgram, parseOBJ, createShader } from '../../utils.js';

const mtlMaterialColors = {
    'Material.002': [0.479229, 0.011474, 0.016370], 
    'Material.003': [0.578387, 0.314875, 0.050074], 
    'Material.004': [0.479320, 0.144129, 0.152926], 
    'Material.005': [0.800000, 0.800000, 0.800000]  
};

const fallbackColors = [
    [0.479229, 0.011474, 0.016370],
    [0.578387, 0.314875, 0.050074],
    [0.479320, 0.144129, 0.152926],
    [0.800000, 0.800000, 0.800000]
];

export async function setupLuffyChopper(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/luffyChopper/vertexShader.glsl'),
        fetch('./components/luffyChopper/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'luffyChopper vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'luffyChopper fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);

    const objResponse = await fetch('./assets/luffyChopper/luffyChopper.obj');
    if (!objResponse.ok) {
        throw new Error(`Falha ao descarregar o OBJ do navio! Código: ${objResponse.status}`);
    }

    const objText = await objResponse.text();

    const mtlResponse = await fetch('./assets/luffyChopper/luffyChopper.mtl');
    if (!mtlResponse.ok) {
        throw new Error(`Falha ao descarregar o MTL do luffyChopper! Código: ${mtlResponse.status}`);
    }

    let mtlText = null;
    if (mtlResponse.ok) {
        mtlText = await mtlResponse.text();
    }

    const meshes = parseOBJ(objText, mtlText);

    for (const sub of meshes) {
        if (!sub.arrays || sub.arrays.position.length === 0) continue;

        sub.bufferInfo = twgl.createBufferInfoFromArrays(gl, sub.arrays);
        sub.vao = twgl.createVertexArrayInfo(gl, programInfo, sub.bufferInfo);

        const matName = sub.material || sub.materialName || sub.name;
        const color = mtlMaterialColors[matName] || fallbackColors[i % fallbackColors.length];

        const r = Math.floor(color[0] * 255);
        const g = Math.floor(color[1] * 255);
        const b = Math.floor(color[2] * 255);

        sub.texture = twgl.createTexture(gl, {
            src: new Uint8Array([r, g, b, 255]),
            width: 1,
            height: 1
        });
    }
    return { programInfo, meshes };
}

export function drawLuffyChopper(gl, matrix4, luffyChopperData, viewProjectionMatrix) {
    if (!luffyChopperData?.meshes) return;

    gl.useProgram(luffyChopperData.programInfo.program);
    gl.disable(gl.CULL_FACE);

    let modelMatrix = matrix4.translation([-0.26, 3.03, 3.4]);
    modelMatrix = matrix4.scale(modelMatrix, [0.1, 0.1, 0.1]);

    const finalMatrix = matrix4.multiply(viewProjectionMatrix, modelMatrix);

    for (const sub of luffyChopperData.meshes) {
        if (!sub.vao || !sub.bufferInfo) continue;

        gl.bindVertexArray(sub.vao.vertexArrayObject || sub.vao);

        twgl.setUniforms(luffyChopperData.programInfo, {
            model: finalMatrix,
            textureSampler: sub.texture || null
        });
        twgl.drawBufferInfo(gl, sub.bufferInfo);
    }
    gl.bindVertexArray(null);
}