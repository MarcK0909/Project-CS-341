precision mediump float; // Optional in GLSL ES 1.00, but good practice

// Input vertex attribute: parameter t along the curve (0.0 to 1.0)
attribute float a_t;

// Uniforms
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelViewMatrix;

// Control points for the cubic Bezier curve
uniform vec3 u_p0; // Start point
uniform vec3 u_p1; // Control point 1
uniform vec3 u_p2; // Control point 2
uniform vec3 u_p3; // End point

void main() {
    float t = a_t;
    float one_minus_t = 1.0 - t;
    
    // Cubic Bezier formula:
    // B(t) = (1-t)^3 * P0 + 3*(1-t)^2*t * P1 + 3*(1-t)*t^2 * P2 + t^3 * P3
    vec3 position = 
        pow(one_minus_t, 3.0) * u_p0 +
        3.0 * pow(one_minus_t, 2.0) * t * u_p1 +
        3.0 * one_minus_t * pow(t, 2.0) * u_p2 +
        pow(t, 3.0) * u_p3;
        
    gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(position, 1.0);
}

