#version 300 es

layout(location = 0) in vec4 position;
layout(location = 1) in vec2 texcoord;

in vec3 normal;

uniform mat4 viewProjection; 
uniform mat4 model;

out vec3 vNormal;
out vec3 vFragPos;
out vec2 vTexCoord;

void main() {
    gl_Position = viewProjection * model * position;

    vFragPos = vec3(model * position);
    vNormal = mat3(model) * normal;
    vTexCoord = texcoord;
}