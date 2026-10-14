export const createShader = (gl, name, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source.trim());
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const infoLog = gl.getShaderInfoLog(shader);
    console.error(`Erro ao compilar o shader ${name}:`, infoLog);
    gl.deleteShader(shader);
    throw new Error(`Falha na compilação do shader ${name}: ` + infoLog);
};

export const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    const infoLog = gl.getProgramInfoLog(program);
    console.error('Erro ao linkar o programa:', infoLog);
    gl.deleteProgram(program);
    throw new Error('Falha na linkedição do programa: ' + infoLog);
};

export const createProgramFromFiles = async (gl, vertexPath, fragmentPath) => {
    const [vsSource, fsSource] = await Promise.all([
        fetch(vertexPath).then(res => res.text()),
        fetch(fragmentPath).then(res => res.text())
    ]);

    const vertexShader = createShader(gl, 'vs', gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, 'fs', gl.FRAGMENT_SHADER, fsSource);

    return createProgram(gl, vertexShader, fragmentShader);
};

export function createTexture(gl, image) {
    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return texture;
}

function parseMTL(mtlText) {
    const materialsMap = {};
    if (!mtlText) return materialsMap;

    let currentMtl = null;
    for (let line of mtlText.split('\n')) {
        line = line.trim();
        const lineLower = line.toLowerCase();

        if (lineLower.startsWith('newmtl ')) {
            currentMtl = line.substring(7).trim();
            materialsMap[currentMtl] = {};
        } else if (lineLower.startsWith('map_kd ') && currentMtl) {
            materialsMap[currentMtl].texture = line.substring(7).trim();
        }
    }
    return materialsMap;
}

function processVertex(vertStr, state) {
    if (state.webglIndicesMap.has(vertStr)) {
        state.indices.push(state.webglIndicesMap.get(vertStr));
        return;
    }

    const indicesParts = vertStr.split('/');
    
    let pIdx = Number.parseInt(indicesParts[0]) || 0;
    pIdx = pIdx < 0 ? state.objPositions.length + pIdx : pIdx;

    let tIdx = Number.parseInt(indicesParts[1]) || 0;
    tIdx = tIdx < 0 ? state.objTexcoords.length + tIdx : tIdx;

    let nIdx = Number.parseInt(indicesParts[2]) || 0;
    nIdx = nIdx < 0 ? state.objNormals.length + nIdx : nIdx;

    const pos = state.objPositions[pIdx] || [0, 0, 0];
    const tex = state.objTexcoords[tIdx] || [0, 0];
    const norm = state.objNormals[nIdx] || [0, 0, 0];

    state.positions.push(...pos);
    state.texCoords.push(...tex);
    state.normals.push(...norm);

    state.webglIndicesMap.set(vertStr, state.nextIndex);
    state.indices.push(state.nextIndex);
    state.nextIndex++;
}

function processFace(parts, state) {
    const faceVertices = parts.slice(1);
    for (let i = 1; i < faceVertices.length - 1; i++) {
        const triIndices = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];
        for (const vertStr of triIndices) {
            processVertex(vertStr, state);
        }
    }
}

export function parseOBJ(objText, mtlText) {
    const materialsMap = parseMTL(mtlText);

    const state = {
        objPositions: [[0, 0, 0]],
        objTexcoords: [[0, 0]],
        objNormals: [[0, 0, 0]],
        positions: [],
        texCoords: [],
        normals: [],
        indices: [],
        webglIndicesMap: new Map(),
        nextIndex: 0
    };

    let subMeshes = [];
    let currentMaterial = 'default';

    function flushSubMesh() {
        if (state.positions.length > 0) {
            let textureFile = null;
            if (materialsMap[currentMaterial]?.texture) {
                textureFile = materialsMap[currentMaterial].texture;
            }

            subMeshes.push({
                materialName: currentMaterial,
                textureFile: textureFile,
                arrays: {
                    position: new Float32Array(state.positions),
                    texcoord: new Float32Array(state.texCoords),
                    normal: new Float32Array(state.normals),
                    indices: new Uint16Array(state.indices)
                }
            });
            state.positions = [];
            state.texCoords = [];
            state.normals = [];
            state.indices = [];
            state.webglIndicesMap.clear();
            state.nextIndex = 0;
        }
    }

    const lines = objText.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#') || line === '') continue;

        const parts = line.split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            state.objPositions.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
        } else if (type === 'vt') {
            state.objTexcoords.push([Number(parts[1]), Number(parts[2])]);
        } else if (type === 'vn') {
            state.objNormals.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
        } else if (type === 'usemtl') {
            flushSubMesh();
            currentMaterial = parts[1];
        } else if (type === 'f') {
            processFace(parts, state);
        }
    }
    
    flushSubMesh();
    return subMeshes;
}