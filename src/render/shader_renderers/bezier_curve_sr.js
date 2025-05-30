import { vec3, vec4 } from "../../../lib/gl-matrix_3.3.0/esm/index.js";
import { ShaderRenderer } from "./shader_renderer.js";
import { ResourceManager } from "../../scene_resources/resource_manager.js";

export class BezierCurveShaderRenderer extends ShaderRenderer {

    /**
     * Renders Bezier curves based on predefined control points.
     * @param {*} regl 
     * @param {ResourceManager} resource_manager 
     */
    constructor(regl, resource_manager) {
        // Call parent constructor to initialize basic properties
        super(
            regl,
            resource_manager,
            `bezier_curve.vert.glsl`,
            `bezier_curve.frag.glsl`
        );

        this.scale = 0.1; // Consistent with BlinnPhongShaderRenderer's scale, assumed to be mapScale

        this.num_curve_points = 100; // Resolution of the curve
        const t_values = Array.from({ length: this.num_curve_points }, (_, i) => i / (this.num_curve_points - 1));
        this.t_buffer = t_values;

        // Define control points for the three segments, similar to bezier.js animateCam
        // These are in "map units" before scaling
        this.curve_segments_control_points = [
            // Segment 1
            [
                vec3.fromValues(120, 0, 10),
                vec3.fromValues(40, 20, 10),
                vec3.fromValues(40, 96, 10),
                vec3.fromValues(-40, 80, 10)
            ],
            // Segment 2
            [
                vec3.fromValues(-40, 80, 10),
                vec3.fromValues(-80, 72, 10),
                vec3.fromValues(-120, 20, 10),
                vec3.fromValues(-80, -40, 10)
            ],
            // Segment 3
            [
                vec3.fromValues(-80, -40, 10),
                vec3.fromValues(-40, -100, 10),
                vec3.fromValues(60, -100, 10),
                vec3.fromValues(100, 0, 10)
            ]
        ];

        // Define colors for each segment (optional, can use one color for all)
        this.curve_colors = [
            vec4.fromValues(1.0, 0.0, 0.0, 1.0), // Red
            vec4.fromValues(0.0, 1.0, 0.0, 1.0), // Green
            vec4.fromValues(0.0, 0.0, 1.0, 1.0)  // Blue
        ];
        
        // Reinitialize the pipeline after all properties are set
        this.pipeline = this.init_pipeline();
    }

    /**
     * Render the Bezier curves.
     * @param {*} scene_state 
     */
    render(scene_state) {
        const camera = scene_state.scene.camera;
        const projectionMatrix = camera.mat.projection;
        const viewMatrix = camera.mat.view; // u_modelViewMatrix will be the view matrix

        const inputs = [];

        this.curve_segments_control_points.forEach((segment_points, index) => {
            const p0_scaled = vec3.create();
            const p1_scaled = vec3.create();
            const p2_scaled = vec3.create();
            const p3_scaled = vec3.create();

            vec3.scale(p0_scaled, segment_points[0], this.scale);
            vec3.scale(p1_scaled, segment_points[1], this.scale);
            vec3.scale(p2_scaled, segment_points[2], this.scale);
            vec3.scale(p3_scaled, segment_points[3], this.scale);
            
            inputs.push({
                u_projectionMatrix: projectionMatrix,
                u_modelViewMatrix: viewMatrix,
                u_p0: p0_scaled,
                u_p1: p1_scaled,
                u_p2: p2_scaled,
                u_p3: p3_scaled,
                u_curveColor: this.curve_colors[index % this.curve_colors.length]
            });
        });
        this.pipeline(inputs);
    }

    attributes(regl) {
        // Define t_values directly here for the attribute configuration.
        // This lets regl manage the buffer creation for this attribute internally.
        const t_values_for_attribute = Array.from({ length: this.num_curve_points }, (_, i) => i / (this.num_curve_points - 1));
        return {
            a_t: t_values_for_attribute
        };
    }

    uniforms(regl) {
        return {
            u_projectionMatrix: regl.prop('u_projectionMatrix'),
            u_modelViewMatrix: regl.prop('u_modelViewMatrix'),
            u_p0: regl.prop('u_p0'),
            u_p1: regl.prop('u_p1'),
            u_p2: regl.prop('u_p2'),
            u_p3: regl.prop('u_p3'),
            u_curveColor: regl.prop('u_curveColor')
        };
    }

    primitive() {
        return 'line strip';
    }

    count() {
        return this.num_curve_points;
    }

    depth() {
        return {
            enable: true,
            mask: true, // Allow writing to depth buffer
            func: '<=',
        };
    }

    blend() {
        return {
            enable: false, // No blending for solid lines
        };
    }

    cull() {
        return {
            enable: false, // No culling for lines
        };
    }

    // Override pipeline initialization to handle line rendering specifics
    init_pipeline() {
        const regl = this.regl;

        return regl({
            attributes: this.attributes(regl),
            
            // For line rendering, we don't use element indices - instead we use count
            primitive: this.primitive(),
            count: this.count(),
            
            depth: this.depth(),
            cull: this.cull(),
            blend: this.blend(),
            
            uniforms: this.uniforms(regl),
            
            vert: this.vert_shader,
            frag: this.frag_shader,
        });
    }
}
