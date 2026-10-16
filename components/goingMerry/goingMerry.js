import { createProgram, parseOBJ, createShader } from '../../utils.js';

export async function setupGoingMerry(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/goingMerry/vertexShader.glsl'),
        fetch('./components/goingMerry/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'goingMerry vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'goingMerry fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const programInfo = twgl.createProgramInfoFromProgram(gl, program);

    const objResponse = await fetch('./assets/goingMerry/goingMerry.obj');
    if (!objResponse.ok) {
        throw new Error(`Falha ao descarregar o OBJ do navio! Código: ${objResponse.status}`);
    }
    
    const objText = await objResponse.text();

    const mtlResponse = await fetch('./assets/goingMerry/goingMerry.mtl');
    if (!mtlResponse.ok) {
        console.error(`ERRO: Não foi possível descarregar o ficheiro MTL (${nomeFicheiroMTL}).`);
    }
    
    let mtlText = null;
    if (mtlResponse.ok) {
        mtlText = await mtlResponse.text();
    }

    const meshes = parseOBJ(objText, mtlText);

    for (const sub of meshes) {
        sub.bufferInfo = twgl.createBufferInfoFromArrays(gl, sub.arrays);
        sub.vao = twgl.createVertexArrayInfo(gl, programInfo, sub.bufferInfo);

        if (sub.textureFile) {
            sub.texture = twgl.createTexture(gl, {
                src: `./assets/goingMerry/${sub.textureFile}`,
                wrapS: gl.REPEAT,
                wrapT: gl.REPEAT,
                min: gl.LINEAR,
                mag: gl.LINEAR,
                flipY: 1,
            }, (err) => {
                if (err) {
                    console.warn(`Não foi possível carregar a textura ${sub.textureFile}`, err);
                }
            });
        }
    }
    return { programInfo, meshes };
}

export function drawGoingMerry(gl, matrix4, merryData, viewProjectionMatrix, sceneConfig) {
    if (!merryData?.meshes) return;

    gl.useProgram(merryData.programInfo.program);

    gl.disable(gl.CULL_FACE);

    let modelMatrix = matrix4.translation([0.0, 0.8, 0.0]);
    modelMatrix = matrix4.scale(modelMatrix, [0.003, 0.003, 0.003]);

    for (const sub of merryData.meshes) {
        if (!sub.bufferInfo) continue;

        let vaoToBind = null;
        if (sub.vao) {
            vaoToBind = sub.vao.vertexArrayObject || sub.vao;
        }

        if (vaoToBind) {
            gl.bindVertexArray(vaoToBind);
        }

        let lightingEnabled;
        if (sceneConfig.lighting) {
            lightingEnabled = 1;
        } else {
            lightingEnabled = 0;
        }

        const uniforms = {
            viewProjection: viewProjectionMatrix,
            model: modelMatrix,
            uLightPos: sceneConfig.sunPos,
            uViewPos: sceneConfig.camPos,
            uUseLighting: lightingEnabled,
        };

        if (sub.texture) {
            uniforms.textureSampler = sub.texture;
        }

        twgl.setUniforms(merryData.programInfo, uniforms);
        twgl.drawBufferInfo(gl, sub.bufferInfo);
    }
    gl.bindVertexArray(null);
}