#version 300 es

in vec4 position;
uniform mat4 model;

void main() {
    gl_Position = model * position;
}