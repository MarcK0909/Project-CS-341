import { light_to_cam_view } from "../../cg_libraries/cg_render_utils.js";
import { ResourceManager } from "../../scene_resources/resource_manager.js";
import { ShaderRenderer } from "./shader_renderer.js"

export class NormalRenderer extends ShaderRenderer {

    /**
     * Renderer for visualizing normal vectors of meshes
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager){
        super(
            regl, 
            resource_manager, 
            `normal.vert.glsl`, 
            `normal.frag.glsl`
        );
    }
    
    /**
     * Render the normal vectors of objects in the scene
     * @param {*} scene_state 
     */
    render(scene_state){
        const scene = scene_state.scene;
        const inputs = [];

        for (const obj of scene.objects) {
            // Skip objects with specific properties that should not have normals visualized
            if(this.exclude_object(obj)) continue;

            const mesh = this.resource_manager.get_mesh(obj.mesh_reference); //Can be only done once for floor.obj (replace)
            
            const { 
                mat_model_view, 
                mat_model_view_projection, 
                mat_normals_model_view 
            } = scene.camera.object_matrices.get(obj);
            
            // Data passed to the pipeline to be used by the shader
            inputs.push({
                mesh: mesh,
                mat_model_view_projection: mat_model_view_projection,
                mat_model_view: mat_model_view,
                mat_normals_model_view: mat_normals_model_view,
				light_position: scene.light_position,
				light_color: scene.light_color,
				material: obj.material,
            });
        }
        
        this.pipeline(inputs);
    }

    exclude_object(obj){
        // Do not visualize normals for objects with these properties
        return obj.material.properties.includes('environment') || 
               obj.material.properties.includes('no_normals');
    }

    depth(){
        return {
            enable: true,
            mask: true,
            func: '<=',
        };
    }

    // blend(){
    //     return {
    //         enable: true,
    //         func: {
    //             src: 'src alpha',
    //             dst: 'one minus src alpha',
    //         },
    //     };
    // }
    
    attributes(regl){
        return {
            vertex_positions: regl.prop('mesh.vertex_positions'),
            vertex_normal: regl.prop('mesh.vertex_normals'),
        }   
    }

    uniforms(regl){
        return {
            mat_model_view_projection: regl.prop('mat_model_view_projection'),
            mat_normals_model_view: regl.prop('mat_normals_model_view'),

            light_position: regl.prop('light_position'),
			light_color: regl.prop('light_color'),

            material_color: regl.prop('material.color'),
			material_shininess: regl.prop('material.shininess'),
        };
    }
}
