#version 300 es

precision mediump float;

in vec2 v_localPosition;
in float v_height;

out vec4 outColor;

void main() {
    float disc = length(v_localPosition);

    if (disc > 20.0) {
        discard;
    }

    vec3 color = vec3(0.05, 0.3, 0.7);
    vec3 midColor  = vec3(0.2, 0.6, 0.9);
    vec3 crestColor = vec3(0.8, 0.95, 1.0);

    float midFactor = smoothstep(0.02, 0.25, v_height);
    float mixColor = smoothstep(0.25, 0.55, v_height);
    
    vec3 finalColor = mix(color, midColor, midFactor);
    finalColor = mix(finalColor, crestColor, mixColor);

    outColor = vec4(finalColor, 1.0);
}