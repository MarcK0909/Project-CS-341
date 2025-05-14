precision mediump float;

varying vec3 v2f_normal;

void main() {
    // Normalize the normal as interpolation may have changed its length
    vec3 normal = normalize(v2f_normal);
    
    // This creates a false-color representation based on normal direction
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.);
}