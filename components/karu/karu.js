import { createProgram, parseOBJ, createShader } from '../../utils.js';

export async function setupKaru(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/karu/vertexShader.glsl'),
        fetch('./components/karu/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'karu vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'karu fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);

    const objResponse = await fetch('./assets/karu/karu.obj');
    if (!objResponse.ok) {
        throw new Error(`Falha ao descarregar o OBJ do karu! Código: ${objResponse.status}`);
    }

    const objText = await objResponse.text();

    const mtlResponse = await fetch('./assets/karu/karu.mtl');
    if (!mtlResponse.ok) {
        throw new Error(`Falha ao descarregar o MTL do Karu! Código: ${mtlResponse.status}`);
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
            let fileName = sub.textureFile.split(/[/\\]/).pop();

            sub.texture = twgl.createTexture(gl, {
                src: `./assets/karu/${fileName}`,
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

export function drawKaru(gl, matrix4, karuData, viewProjectionMatrix, activePose) {
    if (!karuData?.meshes) return;

    gl.useProgram(karuData.programInfo.program);
    gl.disable(gl.CULL_FACE);

    let modelMatrix = matrix4.identity();

    if (activePose === 0) {
        modelMatrix = matrix4.translate(modelMatrix, [1.0, 1.3, 0.0]); 
        modelMatrix = matrix4.rotateY(modelMatrix, 0);                  
    } else if (activePose === 1) {
        modelMatrix = matrix4.translate(modelMatrix, [-1.0, 1.3, 0.0]); 
        modelMatrix = matrix4.rotateY(modelMatrix, -Math.PI / 2);        
    } else if (activePose === 2) {
        modelMatrix = matrix4.translate(modelMatrix, [-1.6, 1.96, -1.0]);
        modelMatrix = matrix4.rotateY(modelMatrix, Math.PI / 2);       
    }

    modelMatrix = matrix4.scale(modelMatrix, [0.02, 0.02, 0.02]);

    const finalMatrix = matrix4.multiply(viewProjectionMatrix, modelMatrix);

    for (const sub of karuData.meshes) {
        if (!sub.vao || !sub.bufferInfo) continue;

        gl.bindVertexArray(sub.vao.vertexArrayObject || sub.vao);

        twgl.setUniforms(karuData.programInfo, {
            model: finalMatrix,
            textureSampler: sub.texture || null
        });
        twgl.drawBufferInfo(gl, sub.bufferInfo);
    }
    gl.bindVertexArray(null);
}