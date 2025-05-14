// Vertex shader for normal visualization
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;

// Pass the normal to the fragment shader
varying vec3 v2f_normal;

// Global uniforms
uniform mat4 mat_model_view_projection;
uniform mat3 mat_normals_model_view;

void main() {
    // Transform the normal to camera space and pass to fragment shader
    v2f_normal = mat_normals_model_view * vertex_normal;
    
    // Output position
    gl_Position = mat_model_view_projection * vec4(vertex_positions, 1.);
}