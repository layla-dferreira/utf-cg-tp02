#version 300 es

precision highp float;

in vec2 vTexCoord;
out vec4 outColor;

uniform sampler2D textureSampler;

void main() {
    outColor = texture(textureSampler, vTexCoord);
}