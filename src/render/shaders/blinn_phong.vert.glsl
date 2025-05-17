// Vertex attributes, specified in the "attributes" entry of the pipeline
attribute vec3 vertex_positions;
attribute vec3 vertex_normal;
attribute vec2 vertex_tex_coords; // optional
attribute vec3 vertex_tangent;
attribute vec3 vertex_bitangent;

// Varying values passed to fragment shader
varying vec2 v2f_uv;
varying vec3 v2f_frag_pos;
varying vec3 v2f_normal;
varying vec3 v2f_bitangent;
varying vec3 v2f_tangent;


// Global variables specified in "uniforms" entry of the pipeline
uniform mat4 mat_model_view;
uniform mat4 mat_model_view_projection;
uniform mat3 mat_normals_model_view;


void main() {
	
	// uv if object has a texture
	v2f_uv = vertex_tex_coords;

	// vertex position in camera view
	vec4 position_v4 = vec4(vertex_positions, 1);
	v2f_frag_pos = (mat_model_view * vec4(position_v4)).xyz;

	// normals in camera view
	v2f_normal = normalize(mat_normals_model_view * vertex_normal);
	v2f_bitangent = normalize(mat_normals_model_view * vertex_bitangent);
	v2f_tangent = normalize(mat_normals_model_view * vertex_tangent);

	// vertex position on canvas
	gl_Position = mat_model_view_projection * vec4(vertex_positions, 1);
}
