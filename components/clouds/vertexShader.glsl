#version 300 es

in vec4 position;
in vec3 instancePosition;
in vec3 normal;

uniform mat4 viewProjection;
uniform mat4 model;

out vec3 vNormal;
out vec3 vFragPos;

void main() {
    vec4 localPosition = position + vec4(instancePosition, 0.0);
    gl_Position = viewProjection * model * localPosition;

    vFragPos = vec3(model * localPosition);
    vNormal = mat3(model) * normal;
}