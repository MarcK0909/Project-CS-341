/**
 * A simple bezier camera system utilities.
 * Based on original work by Gerard Geer
 * License Creative Commons CC0 1.0 Universal (CC-0)
 */
import { vec2, vec3, vec4, mat3, mat4 } from "../../lib/gl-matrix_3.3.0/esm/index.js";

// Constants
export const UP = vec3.fromValues(0.0, 1.0, 0.0);  // An Up vector
export const DOWN = vec3.fromValues(0.0, -1.0, 0.0);
export const FRONT = vec3.fromValues(0.0,0.0,1.0);
export const RIGHT = vec3.fromValues(-1.0,0.0,0.0);

/**
 * A linear Bezier function.
 * @param {vec3} a Start point
 * @param {vec3} b End point
 * @param {number} t Interpolation factor (0-1)
 * @returns {vec3} Point on the curve
 */
export function lb(a, b, t) {
    const result = vec3.create();
    vec3.lerp(result, a, b, t);
    return result;
}

/**
 * The first derivative of a linear Bezier function.
 * @param {vec3} a Start point
 * @param {vec3} b End point
 * @param {number} t Interpolation factor
 * @returns {vec3} Derivative at point t
 */
export function dlb(a, b, t) {
    const result = vec3.create();
    vec3.subtract(result, b, a);
    vec3.normalize(result, result);
    return result;
}

/**
 * A quadratic Bezier function.
 * @param {vec3} a Start point
 * @param {vec3} b Control point
 * @param {vec3} c End point
 * @param {number} t Interpolation factor
 * @returns {vec3} Point on the curve
 */
export function qb(a, b, c, t) {
    const ab = vec3.create();
    const bc = vec3.create();
    vec3.lerp(ab, a, b, t);
    vec3.lerp(bc, b, c, t);
    
    const result = vec3.create();
    vec3.lerp(result, ab, bc, t);
    return result;
}

/**
 * The first derivative of a quadratic Bezier function.
 * @param {vec3} a Start point
 * @param {vec3} b Control point
 * @param {vec3} c End point
 * @param {number} t Interpolation factor
 * @returns {vec3} Derivative at point t
 */
export function dqb(a, b, c, t) {
    const result = vec3.create();
    const temp1 = vec3.create();
    const temp2 = vec3.create();
    
    // (2.0-2.0*t)*(b-a)
    vec3.subtract(temp1, b, a);
    vec3.scale(temp1, temp1, 2.0 - 2.0 * t);
    
    // 2.0*t*(c-b)
    vec3.subtract(temp2, c, b);
    vec3.scale(temp2, temp2, 2.0 * t);
    
    // Combine both terms
    vec3.add(result, temp1, temp2);
    vec3.normalize(result, result);
    
    return result;
}

/**
 * A cubic Bezier function.
 * @param {vec3} a Start point
 * @param {vec3} b Control point 1
 * @param {vec3} c Control point 2
 * @param {vec3} d End point
 * @param {number} t Interpolation factor
 * @returns {vec3} Point on the curve
 */
export function cb(a, b, c, d, t) {
    const ab = vec3.create();
    const bc = vec3.create();
    const cd = vec3.create();
    vec3.lerp(ab, a, b, t);
    vec3.lerp(bc, b, c, t);
    vec3.lerp(cd, c, d, t);
    
    const abc = vec3.create();
    const bcd = vec3.create();
    vec3.lerp(abc, ab, bc, t);
    vec3.lerp(bcd, bc, cd, t);
    
    const result = vec3.create();
    vec3.lerp(result, abc, bcd, t);
    return result;
}

/**
 * The first derivative of a cubic Bezier function.
 * @param {vec3} a Start point
 * @param {vec3} b Control point 1
 * @param {vec3} c Control point 2
 * @param {vec3} d End point
 * @param {number} t Interpolation factor
 * @returns {vec3} Derivative at point t
 */
export function dcb(a, b, c, d, t) {
    const result = vec3.create();
    const temp1 = vec3.create();
    const temp2 = vec3.create();
    const temp3 = vec3.create();
    
    // 3.0*pow(1.0-t, 2.0)*(b-a)
    vec3.subtract(temp1, b, a);
    vec3.scale(temp1, temp1, 3.0 * Math.pow(1.0 - t, 2.0));
    
    // 6.0*(1.0-t)*t*(c-b)
    vec3.subtract(temp2, c, b);
    vec3.scale(temp2, temp2, 6.0 * (1.0 - t) * t);
    
    // 3.0*pow(t, 2.0)*(d-c)
    vec3.subtract(temp3, d, c);
    vec3.scale(temp3, temp3, 3.0 * Math.pow(t, 2.0));
    
    // Combine all terms
    vec3.add(result, temp1, temp2);
    vec3.add(result, result, temp3);
    vec3.normalize(result, result);
    
    return result;
}

/**
 * Smoothstep function (similar to GLSL)
 * @param {number} edge0 Lower edge
 * @param {number} edge1 Upper edge
 * @param {number} x Value to interpolate
 * @returns {number} Smoothly interpolated value
 */
export function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/**
 * Returns a coefficient for a shutter fade.
 * @param {number} s Start time
 * @param {number} e End time
 * @param {number} t Current time
 * @param {number} duration Fade duration
 * @returns {number} Fade coefficient
 */
export function shutterfade(s, e, t, duration) {
    return Math.min(
        smoothstep(s, s + duration, t),
        smoothstep(e, e - duration, t)
    );
}

/**
 * Creates camera ray from position and direction
 * @param {vec2} uv Screen coordinates
 * @param {vec3} cp Camera position
 * @param {vec3} cd Camera direction
 * @param {number} f Focal length
 * @returns {Object} Camera ray information
 */
export function createCameraRay(uv, cp, cd, f) {
    const ro = vec3.clone(cp);
    
    // Calculate ray direction
    const target = vec3.create();
    const temp1 = vec3.create();
    const temp2 = vec3.create();
    const temp3 = vec3.create();
    
    // cd*f
    vec3.scale(temp1, cd, f);
    
    // cross(cd, UP)*uv.x
    vec3.cross(temp2, cd, UP);
    vec3.scale(temp2, temp2, uv[0]);
    
    // UP*uv.y
    vec3.scale(temp3, UP, uv[1]);
    
    // Combine to get target
    vec3.add(target, cp, temp1);
    vec3.add(target, target, temp2);
    vec3.add(target, target, temp3);
    
    // Calculate direction
    const rd = vec3.create();
    vec3.subtract(rd, target, ro);
    vec3.normalize(rd, rd);
    
    return { ro, rd };
}

/**
 * Sets up camera along a linear Bezier curve
 * @param {number} s Start time
 * @param {number} e End time
 * @param {number} f Fade duration
 * @param {vec3} a Start position
 * @param {vec3} b End position
 * @param {number} t Current time
 * @returns {Object} Camera information
 */
export function l_cam_path(s, e, f, a, b, t) {
    const tSmooth = smoothstep(s, e, t);
    const cp = lb(a, b, tSmooth);
    const cd = dlb(a, b, tSmooth);
    const shutter = shutterfade(s, e, t, f);
    
    return { cp, cd, shutter };
}

/**
 * Sets up camera along a quadratic Bezier curve
 * @param {number} s Start time
 * @param {number} e End time
 * @param {number} f Fade duration
 * @param {vec3} a Start position
 * @param {vec3} b Control position
 * @param {vec3} c End position
 * @param {number} t Current time
 * @returns {Object} Camera information
 */
export function q_cam_path(s, e, f, a, b, c, t) {
    const tSmooth = smoothstep(s, e, t);
    const cp = qb(a, b, c, tSmooth);
    
    // Get direction vector and negate cross product with UP
    const dqbVec = dqb(a, b, c, tSmooth);
    const cd = vec3.create();
    vec3.cross(cd, dqbVec, UP);
    vec3.negate(cd, cd);
    
    const shutter = shutterfade(s, e, t, f);
    
    return { cp, cd, shutter };
}

/**
 * Sets up camera along a cubic Bezier curve
 * @param {number} s Start time
 * @param {number} e End time
 * @param {number} f Fade duration
 * @param {vec3} a Start position
 * @param {vec3} b Control position 1
 * @param {vec3} c Control position 2
 * @param {vec3} d End position
 * @param {number} t Current time
 * @returns {Object} Camera information
 */
export function c_cam_path(s, e, f, a, b, c, d, t) {
    const tSmooth = smoothstep(s, e, t);
    const cp = cb(a, b, c, d, tSmooth);
    const cd = dcb(a, b, c, d, tSmooth);
    const shutter = shutterfade(s, e, t, f);
    
    return { cp, cd, shutter };
}

/**
 * Simple circular path for testing camera movement
 * @param {vec2} uv Screen coordinates
 * @param {number} t Current time
 * @returns {Object} Camera ray information
 */
export function simpleCircleCam(uv, t) {
    // Create a simple circular path
    const radius = 5.0;
    const height = 1.0;
    const speed = 0.5; // Controls rotation speed
    
    // Calculate position on a circle
    const x = radius * Math.cos(t * speed);
    const z = radius * Math.sin(t * speed);
    const y = height;
    
    const cp = vec3.fromValues(x, y, z);
    
    // Look at center
    const cd = vec3.create();
    vec3.set(cd, -x, -0.5, -z);
    vec3.normalize(cd, cd);
    
    const shutter = 1.0; // Always visible
    
    // Create camera ray
    const { ro, rd } = createCameraRay(uv, cp, cd, 1.0);
    
    return { ro, rd, shutter };
}

/**
 * Animates the camera, choosing a path based on the current time
 * @param {vec2} uv Screen coordinates
 * @param {number} t Current time
 * @returns {Object} Camera ray information
 */
export function animateCam(uv, t) {
    let cp, cd, shutter = 0.0;
    
    // Loop time every 15 seconds
    // t = t % 15.0;
    
    // if (t < 5.0) {
    //     // Linear camera path
    //     const result = l_cam_path(
    //         0.0, 5.0, 0.5,
    //         vec3.fromValues(0.0, 0.33, 5.0),
    //         vec3.fromValues(0.0, 0.33, 2.0),
    //         t
    //     );
    //     console.log("LESS THAN 5");
    //     cp = result.cp;
    //     cd = result.cd;
    //     shutter = result.shutter;
    // } else if (t < 8.0) {
    //     // Quadratic camera path
    //     const result = q_cam_path(
    //         5.0, 8.0, 0.5,
    //         vec3.fromValues(-7.0, 0.125, 0.1),
    //         vec3.fromValues(0.0, 0.175, 7.0),
    //         vec3.fromValues(7.0, 0.125, 0.1),
    //         t
    //     );
    //     cp = result.cp;
    //     cd = result.cd;
    //     shutter = result.shutter;
    //     console.log("LESS THAN 8");

    // } else if (t < 15.0) {
    //     // Cubic camera path
    //     const result = c_cam_path(
    //         8.0, 15.0, 0.5,
    //         vec3.fromValues(5.0, 0.33, 5.0),
    //         vec3.fromValues(-1.0, 0.33, 5.0),
    //         vec3.fromValues(1.0, 0.33, -5.0),
    //         vec3.fromValues(-5.0, 0.33, -5.0),
    //         t
    //     );

    t = t % 30;

    if(t < 15 && t > 0){
        console.log('skibdii')
        let start = vec3.fromValues(12, 6, 2);
        let end = vec3.fromValues(-12, 6, 2);

        let p1 = vec3.fromValues(8, 4, 2);
        let p2 = vec3.fromValues(-8, 4, 2);
        
        const result = c_cam_path(
            0, 15, 1.,
            start,
            p1,
            p2,
            end,

            t
        )
        cp = result.cp;
        cd = result.cd;
        shutter = result.shutter;
    } else {
        console.log("Aaaaa");
        let start = vec3.fromValues(-12, 6, 2);
        let end = vec3.fromValues(12, 6, 2);

        let p1 = vec3.fromValues(-8, -4, 2);
        let p2 = vec3.fromValues(8, -4, 2);
        
        const result = c_cam_path(
            15, 30, 1.,
            start,
            p1,
            p2,
            end,
            t
        )
        cp = result.cp;
        cd = result.cd;
        shutter = result.shutter;
    }
    
    // Create camera ray
    const { ro, rd } = createCameraRay(uv, cp, cd, 1.0);
    
    return { ro, rd, shutter };
}
