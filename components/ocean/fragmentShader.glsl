#version 300 es

precision highp float;

in vec2 v_localPosition;
in float v_height;
in vec3 vFragPos;

uniform vec3 uLightPos;
uniform vec3 uViewPos;
uniform int uUseLighting;

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

    if (uUseLighting == 1) {
        vec3 dx = dFdx(vFragPos);
        vec3 dy = dFdy(vFragPos);
        vec3 norm = normalize(cross(dx, dy));
        
        if (norm.y < 0.0) {
            norm = -norm;
        }

        float ambientStrength = 0.2;
        vec3 ambient = ambientStrength * finalColor;

        vec3 lightDir = normalize(uLightPos - vFragPos);
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = diff * finalColor;

        float specularStrength = 0.6; 
        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec3 reflectDir = reflect(-lightDir, norm);  
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 64.0); // 64 = Brilho muito focado
        vec3 specular = specularStrength * spec * vec3(1.0, 1.0, 1.0); 

        vec3 result = ambient + diffuse + specular;
        outColor = vec4(result, 1.0);
    } else {
        outColor = vec4(finalColor, 1.0);
    }
}