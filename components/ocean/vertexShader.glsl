#version 300 es

in vec4 position;
in vec2 texcoord;

uniform mat4 viewProjection;
uniform mat4 model;
uniform float time;

out vec2 v_texcoord;
out float v_height;
out vec2 v_localPosition;

void main() {
    vec4 pos = position;
    float waveHeigth = 1.2;

    v_localPosition = vec2(pos.x, pos.z);

    float wave1X = 1.0 - abs(sin((pos.x * 0.8) + (time * 0.2)));
    float wave1Z = 1.0 - abs(sin((pos.z * 0.8) + (time * 0.08)));
    float junctionWave1 = wave1X * wave1Z;

    float diagX = (pos.x * 0.7) - (pos.z * 0.7);
    float diagZ = (pos.x * 0.7) + (pos.z * 0.7);

    float wave2X = 1.0 - abs(sin((diagX * 1.2) - (time * 0.2)));
    float wave2Z = 1.0 - abs(sin((diagZ * 1.2) + (time * 0.08)));
    float junctionWave2 = wave2X * wave2Z;

    float finalWave = (junctionWave1 * 0.6) + (junctionWave2 * 0.5);

    finalWave = pow(finalWave, 2.0);
    pos.y += finalWave * waveHeigth;

    gl_Position = viewProjection * model * pos;

    v_texcoord = texcoord;
    v_height = pos.y;
}