#version 300 es

precision highp float;

in vec2 vTexCoord;
in vec3 vNormal;
in vec3 vFragPos;

uniform vec3 uLightPos;
uniform vec3 uViewPos;
uniform int uUseLighting;

out vec4 outColor;

uniform sampler2D textureSampler;

void main() {
    vec4 texColor = texture(textureSampler, vTexCoord);

    if (uUseLighting == 1) {
        float ambientStrength = 0.4;
        vec3 ambient = ambientStrength * texColor.rgb;

        vec3 norm = normalize(vNormal);
        vec3 lightDir = normalize(uLightPos - vFragPos);
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = diff * texColor.rgb;

        float specularStrength = 0.3;
        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec3 reflectDir = reflect(-lightDir, norm);  
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        vec3 specular = specularStrength * spec * vec3(1.0, 1.0, 1.0); 

        vec3 result = ambient + diffuse + specular;
        outColor = vec4(result, texColor.a);
    } else {
        outColor = texColor;
    }
}