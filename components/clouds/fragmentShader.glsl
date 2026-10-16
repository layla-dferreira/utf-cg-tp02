#version 300 es

precision mediump float;

in vec3 vNormal;
in vec3 vFragPos;

uniform vec3 uLightPos;
uniform vec3 uViewPos;
uniform int uUseLighting;

out vec4 outColor;

void main() {
    vec3 norm = vNormal;

    if (uUseLighting == 1) {
        if (length(norm) < 0.01) {
            vec3 dx = dFdx(vFragPos);
            vec3 dy = dFdy(vFragPos);
            norm = cross(dx, dy);
        }
        
        norm = normalize(norm);
        
        vec3 viewDir = normalize(uViewPos - vFragPos);
        if (dot(norm, viewDir) < 0.0) {
            norm = -norm;
        }

        vec3 lightDir = normalize(uLightPos - vFragPos);

        float diff = dot(norm, lightDir) * 0.5 + 0.5;

        vec3 shadowColor = vec3(0.7, 0.75, 0.85); 
        vec3 litColor = vec3(1.0, 1.0, 1.0); 

        vec3 finalColor = mix(shadowColor, litColor, smoothstep(0.4, 0.8, diff));

        outColor = vec4(finalColor, 1.0);
    } else {
        outColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
}