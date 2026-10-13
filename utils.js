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

export function parseOBJ(objText, mtlText) {
    const materialsMap = {};
    if (mtlText) {
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
    } 

    const lines = objText.split('\n');
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];

    let subMeshes = [];
    let currentMaterial = 'default';
    
    let positions = [];
    let texCoords = [];
    let normals = [];
    let indices = [];
    let webglIndicesMap = new Map();
    let nextIndex = 0;

    function flushSubMesh() {
        if (positions.length > 0) {
            let textureFile = null;
            if (materialsMap[currentMaterial] && materialsMap[currentMaterial].texture) {
                textureFile = materialsMap[currentMaterial].texture;
            }

            subMeshes.push({
                materialName: currentMaterial,
                textureFile: textureFile,
                arrays: {
                    position: new Float32Array(positions),
                    texcoord: new Float32Array(texCoords),
                    normal: new Float32Array(normals),
                    indices: new Uint16Array(indices)
                }
            });
            positions = [];
            texCoords = [];
            normals = [];
            indices = [];
            webglIndicesMap.clear();
            nextIndex = 0;
        }
    }

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('#') || line === '') continue;

        const parts = line.split(/\s+/);
        const type = parts[0];

        if (type === 'v') {
            objPositions.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
        } else if (type === 'vt') {
            objTexcoords.push([parseFloat(parts[1]), parseFloat(parts[2])]);
        } else if (type === 'vn') {
            objNormals.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
        } else if (type === 'usemtl') {
            flushSubMesh();
            currentMaterial = parts[1];
        } else if (type === 'f') {
            const faceVertices = parts.slice(1);
            for (let i = 1; i < faceVertices.length - 1; i++) {
                const triIndices = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];
                for (const vertStr of triIndices) {
                    if (webglIndicesMap.has(vertStr)) {
                        indices.push(webglIndicesMap.get(vertStr));
                    } else {
                        const indicesParts = vertStr.split('/');
                        
                        let pIdx = parseInt(indicesParts[0]) || 0;
                        pIdx = pIdx < 0 ? objPositions.length + pIdx : pIdx;
                        
                        let tIdx = parseInt(indicesParts[1]) || 0;
                        tIdx = tIdx < 0 ? objTexcoords.length + tIdx : tIdx;
                        
                        let nIdx = parseInt(indicesParts[2]) || 0;
                        nIdx = nIdx < 0 ? objNormals.length + nIdx : nIdx;

                        const pos = objPositions[pIdx] || [0, 0, 0];
                        const tex = objTexcoords[tIdx] || [0, 0];
                        const norm = objNormals[nIdx] || [0, 0, 0];

                        positions.push(...pos);
                        texCoords.push(...tex);
                        normals.push(...norm);

                        webglIndicesMap.set(vertStr, nextIndex);
                        indices.push(nextIndex);
                        nextIndex++;
                    }
                }
            }
        }
    }
    flushSubMesh();
    return subMeshes;
}