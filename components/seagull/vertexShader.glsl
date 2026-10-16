#version 300 es

in vec4 position;
in vec3 normal;

uniform mat4 viewProjection;
uniform mat4 model;

out vec3 vNormal;
out vec3 vFragPos;

void main() {
    vec4 worldPosition = model * position;
    
    vFragPos = vec3(worldPosition);
    vNormal = mat3(model) * normal; 

    gl_Position = viewProjection * worldPosition;
}