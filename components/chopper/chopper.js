import { createProgram, parseOBJ, createShader } from '../../utils.js';

export async function setupChopper(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/chopper/vertexShader.glsl'),
        fetch('./components/chopper/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'chopper vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'chopper fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);

    const objResponse = await fetch('./assets/chopper/chopper.obj');
    if (!objResponse.ok) {
        throw new Error(`Falha ao descarregar o OBJ do navio! Código: ${objResponse.status}`);
    }

    const objText = await objResponse.text();

    const mtlResponse = await fetch('./assets/chopper/chopper.mtl');
    if (!mtlResponse.ok) {
        throw new Error(`Falha ao descarregar o MTL do chopper! Código: ${mtlResponse.status}`);
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

        if (sub.textureFile) {
            sub.texture = twgl.createTexture(gl, {
                src: `./assets/chopper/${sub.textureFile}`,
                wrapS: gl.REPEAT,
                wrapT: gl.REPEAT,
                min: gl.LINEAR,
                mag: gl.LINEAR,
                flipY: 1
            });
        }
    }
    return { programInfo, meshes };
}

export function drawChopper(gl, matrix4, chopperData, viewProjectionMatrix) {
    if (!chopperData?.meshes) return;

    gl.useProgram(chopperData.programInfo.program);
    gl.disable(gl.CULL_FACE);

    let modelMatrix = matrix4.translation([-1.3, 1.9, -1.2]);
    modelMatrix = matrix4.scale(modelMatrix, [1.0, 1.0, 1.0]);

    const finalMatrix = matrix4.multiply(viewProjectionMatrix, modelMatrix);

    for (const sub of chopperData.meshes) {
        if (!sub.vao || !sub.bufferInfo) continue;

        gl.bindVertexArray(sub.vao.vertexArrayObject || sub.vao);

        twgl.setUniforms(chopperData.programInfo, {
            model: finalMatrix,
            textureSampler: sub.texture || null
        });
        twgl.drawBufferInfo(gl, sub.bufferInfo);
    }
    gl.bindVertexArray(null);
}