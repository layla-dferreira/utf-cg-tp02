#version 300 es

layout(location = 0) in vec4 position;
layout(location = 1) in vec2 texcoord;

uniform mat4 model;
out vec2 vTexCoord;

void main() {
    gl_Position = model * position;
    vTexCoord = texcoord;
}