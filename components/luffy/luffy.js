import { createProgram, parseOBJ, createShader } from '../../utils.js';

export async function setupLuffy(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/luffy/vertexShader.glsl'),
        fetch('./components/luffy/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'luffy vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'luffy fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);

    const objResponse = await fetch('./assets/luffy/luffy.obj');
    if (!objResponse.ok) {
        throw new Error(`Falha ao descarregar o OBJ do navio! Código: ${objResponse.status}`);
    }

    const objText = await objResponse.text();

    const mtlResponse = await fetch('./assets/luffy/luffy.mtl');
    if (!mtlResponse.ok) {
        throw new Error(`Falha ao descarregar o MTL do luffy! Código: ${mtlResponse.status}`);
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

        console.log(sub.textureFile);

        if (sub.textureFile) {
            let fileName = sub.textureFile.split(/[/\\]/).pop();
            fileName = fileName.replace(/\.dds$/i, '.png');

            sub.texture = twgl.createTexture(gl, {
                src: `./assets/luffy/${fileName}`,
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

export function drawLuffy(gl, matrix4, luffyData, viewProjectionMatrix) {
    if (!luffyData?.meshes) return;

    gl.useProgram(luffyData.programInfo.program);
    gl.disable(gl.CULL_FACE);

    let modelMatrix = matrix4.translation([0.0, 1.9, 2.2]);
    modelMatrix = matrix4.scale(modelMatrix, [1.0, 1.0, 1.0]);

    const finalMatrix = matrix4.multiply(viewProjectionMatrix, modelMatrix);

    for (const sub of luffyData.meshes) {
        if (!sub.vao || !sub.bufferInfo) continue;

        gl.bindVertexArray(sub.vao.vertexArrayObject || sub.vao);

        twgl.setUniforms(luffyData.programInfo, {
            model: finalMatrix,
            textureSampler: sub.texture || null
        });
        twgl.drawBufferInfo(gl, sub.bufferInfo);
    }
    gl.bindVertexArray(null);
}