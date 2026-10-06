import { createProgram, createShader } from '../../utils.js';

export async function setupClouds(gl) {
    const [vertexShaderResponse, fragmentShaderResponse] = await Promise.all([
        fetch('./components/clouds/vertexShader.glsl'),
        fetch('./components/clouds/fragmentShader.glsl')
    ]);

    const [vertexShaderCode, fragmentShaderCode] = await Promise.all([
        vertexShaderResponse.text(),
        fragmentShaderResponse.text()
    ]);

    const program = createProgram(
        gl,
        createShader(gl, 'clouds vertex shader', gl.VERTEX_SHADER, vertexShaderCode),
        createShader(gl, 'clouds fragment shader', gl.FRAGMENT_SHADER, fragmentShaderCode)
    );

    const sphere = twgl.primitives.createSphereVertices(2, 32, 32);
    const sphereVertices = sphere.position;
    const sphereIndices = sphere.indices;
    const numIndices = sphereIndices.length;

    const vertices = new Float32Array([
        -1.0,  0.0,  0.0,  
        1.0,  0.0,  0.0,  
        0.0,  1.0,  0.0,  
        0.0, -0.5,  1.0,  
        -0.5,  0.5, -0.5
    ]);

    const numInstances = vertices.length / 3;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionLocation = gl.getAttribLocation(program, 'position');
    const sphereBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sphereVertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    const offsetLocation = gl.getAttribLocation(program, 'instancePosition');
    const offsetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(offsetLocation);
    gl.vertexAttribPointer(offsetLocation, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(offsetLocation, 1);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphereIndices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const modelLocation = gl.getUniformLocation(program, 'model');

    return { 
        program,
        vao,
        modelLocation, 
        numIndices,
        numInstances
    };
}

export function drawClouds(gl, matrix4, cloudsData, model, position) {
    gl.useProgram(cloudsData.program);
    gl.bindVertexArray(cloudsData.vao);

    const cloudsPosition = matrix4.translation(position);
    const modelMatrix = matrix4.multiply(model, cloudsPosition);

    gl.uniformMatrix4fv(cloudsData.modelLocation, false, modelMatrix);
    gl.drawElementsInstanced(gl.TRIANGLES, cloudsData.numIndices, gl.UNSIGNED_SHORT, 0, cloudsData.numInstances);

    gl.bindVertexArray(null);
}