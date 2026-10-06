#version 300 es

in vec4 position;
in vec3 instancePosition;
uniform mat4 model;

void main() {
    vec4 localPosition = position + vec4(instancePosition, 0.0);
    gl_Position = model * localPosition;
}