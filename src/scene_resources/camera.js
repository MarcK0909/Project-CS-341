import { vec2, vec3, vec4, mat3, mat4 } from "../../lib/gl-matrix_3.3.0/esm/index.js"
import { deg_to_rad, mat4_to_string, vec_to_string, mat4_matmul_many } from "../cg_libraries/cg_math.js"
import * as bezier from "./bezier.js"

/**
 * Create a new turntable camera
 */
export class TurntableCamera {

    constructor() {
        this.angle_z = - Math.PI / 6.; // in radians!
        this.angle_y = -Math.PI / 6; // in radians!
        this.distance_factor = 3.5;
        this.distance_base = 15.;
        this.look_at = [0, 0, 0];
        
        this.mat = {
            projection : mat4.create(),
            view : mat4.create()
        }

        this.update_format_ratio(100, 100);
        this.update_cam_transform();
        
    }

    /**
     * Recompute the camera perspective matrix based on the new ratio
     * @param {*} width the width of the canvas
     * @param {*} height the heigth of the canvas
     */
    update_format_ratio(width, height){
        mat4.perspective(this.mat.projection,
            deg_to_rad * 60, // fov y
            width / height, // aspect ratio
            0.01, // near
            512, // far
        )
    }

    /**
     * Recompute the view matrix (mat.view)
     */
    update_cam_transform() {
        const r = this.distance_base * this.distance_factor;

        const M_look_forward_X = mat4.lookAt(mat4.create(),
            [-r, 0, 0], // camera position in world coord
            this.look_at, // view target point
            [0, 0, 1], // up vector
        )
        
        const M_rot_y = mat4.fromYRotation(mat4.create(), this.angle_y)
        const M_rot_z = mat4.fromZRotation(mat4.create(), this.angle_z)
        mat4_matmul_many(this.mat.view, M_look_forward_X, M_rot_y, M_rot_z);
    }

    /**
     * Compute all the objects transformation matrices and store them into the camera
     * (For improved performance, objects' transformation matrices are computed once at the 
     * beginning of every frame and are stored in the camera for shader_renderers to use)
     * @param {*} scene_objects 
     */
    compute_objects_transformation_matrices(scene_objects){
        this.object_matrices = new Map();

        // Compute and store the objects matrices
        for (const obj of scene_objects) {
            const transformation_matrices = this.compute_transformation_matrices(obj);
            this.object_matrices.set(obj, transformation_matrices);
        }
    }

    /**
     * Compute the transfortmation matrix of the object for this camera
     * @param {*} object 
     * @returns 
     */
    compute_transformation_matrices(object) {
        const mat_projection = this.mat.projection;
        const mat_view = this.mat.view;

        // Construct mat_model_to_world from translation and scale.
        // If we wanted to have a rotation too, we could use mat4.fromRotationTranslationScale.
        const mat_model_to_world = mat4.create();
        mat4.fromRotationTranslationScale(mat_model_to_world, object.rotation, object.translation, object.scale);
        // mat4.fromTranslation(mat_model_to_world, object.translation);
        // mat4.scale(mat_model_to_world, mat_model_to_world, object.scale);

        const mat_model_view = mat4.create();
        const mat_model_view_projection = mat4.create();
        const mat_normals_model_view = mat3.create();
        
        // Compute mat_model_view, mat_model_view_projection, mat_normals_model_view.
        mat4_matmul_many(mat_model_view, mat_view, mat_model_to_world);
        mat4_matmul_many(mat_model_view_projection, mat_projection, mat_model_view);

        // Recall that the transform matrix model_view for normal projection
        // is the inverted transpose of the vertices model_view.
        mat3.identity(mat_normals_model_view);
        mat3.fromMat4(mat_normals_model_view, mat_model_view);
        mat3.invert(mat_normals_model_view, mat_normals_model_view);
        mat3.transpose(mat_normals_model_view, mat_normals_model_view);

        // Note: to optimize we could compute mat_view_projection = mat_projection * mat_view 
        // only once instead as for every object. This option is simpler, and the performance
        // difference is negligible for a moderate number of objects.
        // Consider optimizing this routine if you need to render thousands of distinct objects.
        return { mat_model_view, mat_model_view_projection, mat_normals_model_view }
    }

    //// UI USEFUL FUNCTIONS

    /**
     * Place the camera in the defined view
     * @param {{distance_factor, angle_z, angle_y, look_at}} view 
     */
    set_preset_view(view){
        this.distance_factor = view.distance_factor;
        this.angle_z = view.angle_z;
        this.angle_y = view.angle_y;
        this.look_at = view.look_at;
        this.update_cam_transform();
    }

    /**
     * Helper function to get in the console the state of 
     * the camera to define a preset view
     */
    log_current_state(){
        console.log(
            "distance_factor: " + this.distance_factor,
            "angle_z: " + this.angle_z,
            "angle_y: " + this.angle_y,
            "look_at " + this.look_at,
        );
    }

    /**
     * Update the camera distance_factor to produce a zoom in / zoom out effect
     * @param {*} deltaY the variation
     */
    zoom_action(deltaY){
        const factor_mul_base = 1.01;
        const factor_mul = (deltaY > 0) ? factor_mul_base : 1. / factor_mul_base;
        this.distance_factor *= factor_mul;
        this.distance_factor = Math.max(0.02, Math.min(this.distance_factor, 20.));

        this.update_cam_transform();
    }

    /**
     * Update the camera angle to make it rotate around its look_at point
     * @param {*} movementX 
     * @param {*} movementY 
     */
    rotate_action(movementX, movementY){
        this.angle_z += movementX * 0.003;
        this.angle_y += -movementY * 0.003;

        this.update_cam_transform();
    }

    /**
     * Moves the camera look_at point
     * @param {*} movementX 
     * @param {*} movementY 
     */
    move_action(movementX, movementY){
        const scaleFactor = this.distance_base * this.distance_factor * 0.0005; // Adjust movement speed 

        const right = [
            Math.sin(this.angle_z),
            Math.cos(this.angle_z),
            0
        ];

        const up = [
            -Math.cos(this.angle_z) * Math.sin(this.angle_y),
            Math.sin(this.angle_z) * Math.sin(this.angle_y),
            Math.cos(this.angle_y)
        ];

        this.look_at[0] += right[0] * movementX * scaleFactor + up[0] * movementY * scaleFactor;
        this.look_at[1] += right[1] * movementX * scaleFactor + up[1] * movementY * scaleFactor;
        this.look_at[2] += up[2] * movementY * scaleFactor;

        this.update_cam_transform();
    }
}

export class BezierCamera {
    constructor() {
        this.time = 0;
        this.time_factor = 1.0; // Controls animation speed
        this.debug = false;     // Enable logging for debugging
        this.scale = 1.0;
        
        this.position = vec3.create();
        this.direction = vec3.create();
        this.shutter = 1.0;     // Shutter value for transitions
        
        this.mat = {
            projection: mat4.create(),
            view: mat4.create()
        };
        
        // Default camera settings
        this.update_format_ratio(100, 100);
        this.update_cam_transform();
    }
    
    /**
     * Recompute the camera perspective matrix based on the new ratio
     * @param {number} width The width of the canvas
     * @param {number} height The height of the canvas
     */
    update_format_ratio(width, height) {
        mat4.perspective(this.mat.projection,
            deg_to_rad * 60, // fov y
            width / height,  // aspect ratio
            0.01,           // near
            512,            // far
        );
    }
    
    /**
     * Update camera time for animations
     * @param {number} deltaTime Time elapsed since last frame in seconds
     */
    update_time(deltaTime) {
        // Cap delta time to avoid large jumps when tab is inactive
        const clampedDelta = Math.min(deltaTime, 0.1);
        
        if (this.debug) {
            console.log(`Time update: ${this.time.toFixed(2)} → ${(this.time + clampedDelta * this.time_factor).toFixed(2)} (Δ=${clampedDelta.toFixed(4)}s)`);
        }
        
        this.time += clampedDelta * this.time_factor; //only needed if time factor > 1
        this.update_cam_transform();
    }
    
    /**
     * Reset animation time to beginning
     */
    reset_time() {
        this.time = 0;
        this.update_cam_transform();
    }
    
    /**
     * Set time directly
     * @param {number} time New time value
     */
    set_time(time) {
        this.time = time;
        this.update_cam_transform();
    }
    
    set_scale_for_camera(scale){
        this.scale = scale;
    }

    /**
     * Set time factor to control animation speed
     * @param {number} factor Speed factor (1.0 = normal speed)
     */
    set_time_factor(factor) {
        this.time_factor = factor;
    }
    
    /**
     * Enable or disable debugging
     * @param {boolean} enabled Whether to enable debug output
     */
    set_debug(enabled) {
        this.debug = enabled;
    }
    
    /**
     * Recompute the view matrix (mat.view) using Bezier paths
     */
    update_cam_transform() {
        // Create UV coordinates (centered)
        const uv = [0.0, 0.0];
        
        // const { ro, rd, shutter } = bezier.simpleCircleCam(uv, this.time);
        
        const { ro, rd, shutter } = bezier.animateCam(uv, this.time, this.scale);
        
        // Store values for later use
        vec3.copy(this.position, ro);
        vec3.copy(this.direction, rd);
        this.shutter = shutter;
        
        if (this.debug) {
            console.log(`Camera pos: [${this.position[0].toFixed(2)}, ${this.position[1].toFixed(2)}, ${this.position[2].toFixed(2)}]`);
        }
        
        // Calculate look-at point
        const lookAt = vec3.create();
        vec3.add(lookAt, this.position, this.direction);
        
        // Create view matrix
        mat4.lookAt(
            this.mat.view,
            this.position,
            lookAt,
            vec3.fromValues(0,0,1)
        );
    }
    
    /**
     * Compute all the objects transformation matrices
     * @param {Array} scene_objects Objects in the scene
     */
    compute_objects_transformation_matrices(scene_objects) {
        this.object_matrices = new Map();
        
        // Compute and store the objects matrices
        for (const obj of scene_objects) {
            const transformation_matrices = this.compute_transformation_matrices(obj);
            this.object_matrices.set(obj, transformation_matrices);
        }
    }
    
    /**
     * Compute the transformation matrices for an object
     * @param {Object} object The scene object
     * @returns {Object} Transformation matrices
     */
    compute_transformation_matrices(object) {
        const mat_projection = this.mat.projection;
        const mat_view = this.mat.view;
        
        // Create model-to-world matrix
        const mat_model_to_world = mat4.create();
        mat4.fromRotationTranslationScale(
            mat_model_to_world,
            object.rotation,
            object.translation,
            object.scale
        );
        
        // Create derived matrices
        const mat_model_view = mat4.create();
        const mat_model_view_projection = mat4.create();
        const mat_normals_model_view = mat3.create();
        
        // Calculate matrices
        mat4_matmul_many(mat_model_view, mat_view, mat_model_to_world);
        mat4_matmul_many(mat_model_view_projection, mat_projection, mat_model_view);
        
        // Normal matrix is the transpose of the inverse of model_view's upper-left 3x3
        mat3.fromMat4(mat_normals_model_view, mat_model_view);
        mat3.invert(mat_normals_model_view, mat_normals_model_view);
        mat3.transpose(mat_normals_model_view, mat_normals_model_view);
        
        return { mat_model_view, mat_model_view_projection, mat_normals_model_view };
    }
    
    /**
     * Get current camera position
     * @returns {vec3} Camera position
     */
    get_position() {
        return this.position;
    }
    
    /**
     * Get current camera direction
     * @returns {vec3} Camera direction
     */
    get_direction() {
        return this.direction;
    }
    
    /**
     * Log current camera state to console
     */
    log_current_state() {
        console.log(
            "BezierCamera State:",
            "\ntime:", this.time,
            "\nposition:", vec3.str(this.position),
            "\ndirection:", vec3.str(this.direction),
            "\nshutter:", this.shutter
        );
    }
}