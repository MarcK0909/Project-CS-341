import { vec3, mat3 } from "../../lib/gl-matrix_3.3.0/esm/index.js"
import { fromValues } from "../../lib/gl-matrix_3.3.0/esm/mat2.js";
import { angle } from "../../lib/gl-matrix_3.3.0/esm/vec3.js";

const scale = 0.1;

const maxSpeed = 20. * scale;
const minSpeed = 5. * scale;

const avoidanceRadius = 5. * scale;
const perceptionRadius = 40. * scale;


// cohesion force angle 
const forceAngle = 5 * Math.PI / 12;
const dynamicMaxSpeedWeight = 1.;
const avoidanceForceLimit = 3.;

const avoidanceWeight = 15.;
const cohesionWeight = 0.01;
const alignementWeight = 0.09;
// const containementWeight = 10.;
// const trajectoryWeight = 12.;
// const avoidanceWeight = 0.;
// const cohesionWeight = 0.;
// const alignementWeight = 0.;
const containementWeight = 5.;
const trajectoryWeight = 0.;

// possibility to increase max speed for stragling birds
function dynamicMaxSpeed(posList, index) {
    let averageAngle = 0.;
    let indexAngle = 0.;
    for (let i = 0; i < posList.length; i++) {
        // angle of bird around Z
        let angle = Math.atan2(posList[i][1], posList[i][0]);
        if (angle < 0.) {
        angle += 2 * Math.PI;
        }  

        if (i == index) {
            indexAngle = angle;
        } 
        averageAngle += angle;
        
    }

    averageAngle = averageAngle / posList.length;

    const diffFromAverage = averageAngle - indexAngle;

    if (diffFromAverage > 0 && diffFromAverage < Math.PI / 2) {
        return maxSpeed + dynamicMaxSpeedWeight * diffFromAverage;
    }

    return maxSpeed;

}

function diffFromMeanPerceptionFiltered(filterList, listToMean, index) {
    const diff = vec3.fromValues(0., 0., 0.);
    let count = 0.;
    // assuming the index of corresponding elements in filterList and listToMean is identical 
    for (let i = 0; i < filterList.length; i++) {
        if (i != index) {
            const distanceVec = vec3.create();
            vec3.sub(distanceVec, filterList[i], filterList[index]);
            if (vec3.len(distanceVec) <= perceptionRadius * scale) {
                count += 1.;
                vec3.add(diff, diff, listToMean[i]);
            }
        }
    } 

    if (count != 0) {
        vec3.scale(diff, diff, 1. / count);
    }

    return diff;    
}

function avoidanceForce(posList, index) {
    const force = vec3.fromValues(0., 0., 0.);
    for (let i = 0; i < posList.length; i++) {
        const distanceVec = vec3.create();
        vec3.sub(distanceVec, posList[i], posList[index]);
        const distance = vec3.len(distanceVec);
        if (distance <= avoidanceRadius * scale && distance != 0.) {
            vec3.negate(distanceVec, vec3.normalize(distanceVec, distanceVec));
            const scaledVec = vec3.scale(vec3.create(), distanceVec, 1. / distance);
            if (vec3.len(scaledVec) > avoidanceForceLimit) {
                vec3.scale(scaledVec, distanceVec, avoidanceForceLimit);
            }
            vec3.add(force, force, scaledVec);
        }
    }    

    return force;
}

function cohesionForce(posList, index) {
    const force = diffFromMeanPerceptionFiltered(posList, posList, index);
    return force;
}

function alignementForce(posList, velList, index) {
    const force = diffFromMeanPerceptionFiltered(posList, velList, index);
    return force;
}


// helper function for all BASIC EXCLUSION cylinders  (direction 1 for trigonometric -1 for inverse)
function cylinderCheck(birdXYPos, cylCenter, cylRadius, direction, force) {
    const diff = vec3.subtract(vec3.create(), birdXYPos, cylCenter);
    //console.log(`cylCenter : ${vec3.str(cylCenter)}  len diff : ${vec3.len(diff)}`)
    if (vec3.len(diff) < cylRadius) {    
        vec3.normalize(force, diff);
        vec3.rotateZ(force, force, vec3.create(), direction * forceAngle);
    }
    return force;
}

//helper function to define cylinders
function cylinder(distFromOrigin, angleDeg, radius, direction) {
    const angle = angleDeg * Math.PI / 180;
    const cylCenter = vec3.fromValues(Math.cos(angle) * distFromOrigin, Math.sin(angle) * distFromOrigin, 0);
    vec3.scale(cylCenter, cylCenter, scale);
    return {center : cylCenter, radius : radius * scale, direction : direction};
}


function containementForce(posList, index) {
    let force = vec3.fromValues(0., 0., 0.);
    const birdXYPos = vec3.set(vec3.create(), posList[index][0], posList[index][1], 0);
    // console.log(`Bird pos xy : ${vec3.str(birdXYPos)}`)

    /* ===== Define cylinders ===== */
    const outerRadiusNotScaled = 100; // outer limit of world
    const outerRadius = outerRadiusNotScaled * scale;

    const innerRadiusSmallNotScaled = 50; // inner limit checked in q1 and q3
    const innerRadiusSmall = innerRadiusSmallNotScaled * scale;

    /* first quadrant */
    const firstLeftCyl_Q1 = cylinder(50, 0, 20, 1);

    const rightCyl_Q1 = cylinder(outerRadiusNotScaled + 5, 45, 40, -1);

    const secondLeftCyl_Q1 = cylinder(50, 90, 20, 1);

    // SPECIAL CYLINDER
    const loneTreeCylCenter_Q1 = vec3.fromValues(12, 82, 0);
    vec3.scale(loneTreeCylCenter_Q1, loneTreeCylCenter_Q1, scale);
    const loneTreeCylRadius_Q1 = 5 * scale;

    /* second quadrant */
    const innerRadiusBigNotScaled = 80;
    const innerRadiusBig = innerRadiusBigNotScaled * scale;

    const firstRightCyl_Q2 = cylinder(outerRadiusNotScaled + 5, 110, 15, -1);

    const leftCyl_Q2 = cylinder(innerRadiusBigNotScaled - 5, 130, 15, 1);

    const secondRightCyl_Q2 = cylinder(outerRadiusNotScaled + 5, 150, 15, -1);

    /* third quadrant */
    const leftCyl_Q3 = cylinder(innerRadiusSmallNotScaled, 250, 30, 1);

    const rightCyl_Q3 = cylinder(outerRadiusNotScaled + 5, 220, 20, -1);

    
    
    // Global outer limit check
    if (vec3.len(birdXYPos) > outerRadius) {
        vec3.normalize(force, vec3.negate(vec3.create(), birdXYPos));
        vec3.rotateZ(force, force, vec3.create(), - forceAngle);
    }
    // Global inner limit
    force = cylinderCheck(birdXYPos, vec3.create(), innerRadiusSmall, 1, force);



    // angle of bird around Z
    let angle = Math.atan2(birdXYPos[1], birdXYPos[0]);
    if (angle < 0.) {
        angle += 2 * Math.PI;
    }  

    // Different checks per quadrant
    if (angle <= Math.PI / 2) {
        force = cylinderCheck(birdXYPos, firstLeftCyl_Q1.center, firstLeftCyl_Q1.radius, firstLeftCyl_Q1.direction, force);
        force = cylinderCheck(birdXYPos, rightCyl_Q1.center, rightCyl_Q1.radius, rightCyl_Q1.direction, force);
        force = cylinderCheck(birdXYPos, secondLeftCyl_Q1.center, secondLeftCyl_Q1.radius, secondLeftCyl_Q1.direction, force);
  
        // lone tree 
        // const diff = vec3.subtract(vec3.create(), birdXYPos, loneTreeCylCenter_Q1);
        // if (vec3.len(diff) < loneTreeCylRadius_Q1) {
        //     vec3.normalize(force, diff);
        //     console.log("LONE TREE");
        //     if (vec3.angle(vec3.fromValues(1, - 2, 0), diff) < 0) {
        //         vec3.rotateZ(force, force, vec3.create(), - forceAngle);
        //     } else {
        //         vec3.rotateZ(force, force, vec3.create(), forceAngle);
        //     }

            
        // }

    } else if (angle > Math.PI / 2 && angle <= Math.PI) {
        force = cylinderCheck(birdXYPos, firstRightCyl_Q2.center, firstRightCyl_Q2.radius, firstRightCyl_Q2.direction, force);
        force = cylinderCheck(birdXYPos, leftCyl_Q2.center, leftCyl_Q2.radius, leftCyl_Q2.direction, force);
        force = cylinderCheck(birdXYPos, secondRightCyl_Q2.center, secondRightCyl_Q2.radius, secondRightCyl_Q2.direction, force);
        force = cylinderCheck(birdXYPos, vec3.create(), innerRadiusBig, 1, force);
    
    } else if (angle > Math.PI && angle <= 3 * Math.PI / 2) {
        force = cylinderCheck(birdXYPos, leftCyl_Q3.center, leftCyl_Q3.radius, leftCyl_Q3.direction, force);
        force = cylinderCheck(birdXYPos, rightCyl_Q3.center, rightCyl_Q3.radius, rightCyl_Q3.direction, force);        

    } else {

    }


    return force;







    // containement sphere
    // if (vec3.len(posList[index]) > worldRadius) {
    //    vec3.negate(force, vec3.normalize(force, posList[index]));
    // }

    // // Centered in origin
    // const x = posList[index][0];
    // const y = posList[index][1];
    // const horizontalDistSquared = x * x + y * y;
    // const outerRadius = 100 * scale;
    // const midRadius = 60 * scale;
    // const innerRadius = 40 * scale;

    // //first cylinder - second quadrant
    // const cyl1_radius = 40 * scale;
    // const cyl1_angle = 3 * (Math.PI/4);
    // const cyl1_x = outerRadius * Math.cos(cyl1_angle);
    // const cyl1_y = outerRadius * Math.sin(cyl1_angle);
    // // const cyl1_radius = 220 * scale;
    // // const cyl1_x = -200;
    // // const cyl1_y = 200;
    // const x_diff = x - cyl1_x;
    // const y_diff = y -cyl1_y;
    // const dist_cyl = x_diff * x_diff + y_diff * y_diff;

    // // const cyl1b_radius = 80 * scale;
    // // const cyl1b_x = -100;
    // // const cyl1b_y = 100;
    // // const x_diff1b = x - cyl1b_x;
    // // const y_diff1b = y - cyl1b_y;
    // // const dist_cyl1b = x_diff * x_diff + y_diff * y_diff;

    // // Second cylinder - in fourth quadrant
    // const cyl2_radius = 20 * scale;
    // const cyl2_angle = 330 * (Math.PI/180); 
    // const cyl2_distFromOrigin = 100 * scale;
    // const cyl2_x = cyl2_distFromOrigin * Math.cos(cyl2_angle); 
    // const cyl2_y = cyl2_distFromOrigin * Math.sin(cyl2_angle);
    // const x_diff2 = x - cyl2_x;
    // const y_diff2 = y - cyl2_y;
    // const dist_cyl2 = x_diff2 * x_diff2 + y_diff2 * y_diff2;
    
    // // Third cylinder - in fourth quadrant
    // const cyl3_radius = 20 * scale;
    // const cyl3_angle = 295 * (Math.PI/180);
    // const cyl3_distFromOrigin = 60 * scale;
    // const cyl3_x = cyl3_distFromOrigin * Math.cos(cyl3_angle);
    // const cyl3_y = cyl3_distFromOrigin * Math.sin(cyl3_angle);
    // const x_diff3 = x - cyl3_x;
    // const y_diff3 = y - cyl3_y;
    // const dist_cyl3 = x_diff3 * x_diff3 + y_diff3 * y_diff3;

    // let angle = Math.atan2(y, x);
    // if (angle < 0.) {
    //     angle += 2 * Math.PI;
    // }
    // console.log(`ANGLE : ${angle / Math.PI * 180}`);

    // // first cylinder
    // if(angle >=  Math.PI/2 && angle <= Math.PI){
    //     if(dist_cyl < cyl1_radius * cyl1_radius){
    //         vec3.normalize(force, vec3.fromValues(x_diff, y_diff , 0.));
    //         vec3.rotateZ(force, force, vec3.create(), - forceAngle);
    //         //vec3.scale(force,force,5.0);
    //     }
    //     // if(dist_cyl1b < cyl1b_radius * cyl1b_radius){
    //     //     vec3.normalize(force, vec3.fromValues(x_diff1b, y_diff1b , 0.));
    //     //     vec3.rotateZ(force, force, vec3.create(), - forceAngle);
    //     //     //vec3.scale(force,force,5.0);
    //     // }
    // }
    // // second cylinder 
    // if(angle >= (3 * Math.PI/2) && angle <= 2 * Math.PI){
    //     if(dist_cyl2 < cyl2_radius * cyl2_radius){
    //         vec3.normalize(force, vec3.fromValues(x_diff2, y_diff2, 0.));
    //         vec3.rotateZ(force, force, vec3.create(), forceAngle)
    //         // vec3.scale(force, force, 5.0);
    //     }
    //     if(dist_cyl3 < cyl3_radius * cyl3_radius){
    //         vec3.normalize(force, vec3.fromValues(x_diff3, y_diff3, 0.));
    //         vec3.rotateZ(force, force, vec3.create(), - forceAngle)
    //     }
    // }
    
    // // third cylinder
    // if(angle <= (Math.PI/2) || angle >= Math.PI){
    //     if (horizontalDistSquared < midRadius * midRadius) {
    //         vec3.normalize(force, vec3.fromValues(x, y, 0.));
    //         vec3.rotateZ(force, force, vec3.create(), forceAngle)
    //     }
    // }

    // if (horizontalDistSquared > outerRadius * outerRadius) {
    //    vec3.normalize(force, vec3.fromValues(-x, -y, 0.));
    //    vec3.rotateZ(force, force, vec3.create(), - forceAngle)
    //    console.log("out of bounds : TOO FAR");
    // }
    // else if (horizontalDistSquared < innerRadius * innerRadius) {
    //     vec3.normalize(force, vec3.fromValues(x, y, 0.));
    //     vec3.rotateZ(force, force, vec3.create(), forceAngle)
    //     console.log("out of bounds : TOO CLOSE");
    // }

    // return force;

    // // 2 containement cylinders
    // const x = posList[index][0];
    // const y = posList[index][1];
    // const z = posList[index][2];
    // const angle = Math.atan2(y, x); 
    // const horizontalDistSquared = x * x + y * y;
    // const outerRadius = Math.sqrt(2000);

    // //first cylinder - second quadrant
    // const cyl1_radius = 8;
    // const cyl1_angle = 130 * (180/Math.PI);
    // const cyl1_x = outerRadius * Math.cos(cyl1_angle);
    // const cyl1_y = outerRadius * Math.sin(cyl1_angle);
    // const x_diff = x - cyl1_x;
    // const y_diff = y -cyl1_y;
    // const dist_cyl = x_diff * x_diff + y_diff * y_diff;

    // // Second cylinder - in fourth quadrant
    // const cyl2_radius = 12;
    // const cyl2_angle = 330 * (Math.PI/180); 
    // const cyl2_x = 35 * Math.cos(cyl2_angle); 
    // const cyl2_y = 35 * Math.sin(cyl2_angle);
    // const x_diff2 = x - cyl2_x;
    // const y_diff2 = y - cyl2_y;
    // const dist_cyl2 = x_diff2 * x_diff2 + y_diff2 * y_diff2;
    
    // // Third cylinder - in fourth quadrant
    // const cyl3_radius = 10;
    // const cyl3_angle = 305 * (Math.PI/180);
    // const cyl3_x = 20 * Math.cos(cyl3_angle);
    // const cyl3_y = 20 * Math.sin(cyl3_angle);
    // const x_diff3 = x - cyl3_x;
    // const y_diff3 = y - cyl3_y;
    // const dist_cyl3 = x_diff3 * x_diff3 + y_diff3 * y_diff3;

    // // first cylinder
    // if(angle >= (90 * Math.PI/180) && angle <= (180 * Math.PI/180)){
    //     if(dist_cyl < cyl1_radius * cyl1_radius){
    //     vec3.normalize(force, vec3.fromValues(x_diff, y_diff , 0.));
    //     }
    // }
    // // second cylinder 
    // if(angle >= (270 * Math.PI/180) && angle <= (360 * Math.PI/180)){
    //     if(dist_cyl2 < cyl2_radius * cyl2_radius){
    //         vec3.normalize(force, vec3.fromValues(x_diff2, y_diff2, 0.));
    //         vec3.scale(force, force, 6.0);
    //     }
    // }
    
    // // third cylinder
    // if(angle >= (270 * Math.PI/180) && angle <= (360 * Math.PI/180)){
    //     if(dist_cyl3 < cyl3_radius * cyl3_radius){
    //         vec3.normalize(force, vec3.fromValues(x_diff3, y_diff3, 0.));
    //         vec3.scale(force, force, 6.0);
        
    // }}

    // if (horizontalDistSquared > 2000.) {
    //    vec3.normalize(force, vec3.fromValues(-x, -y, 0.));
    // }
    // else if (horizontalDistSquared < 300.) {
    //     vec3.normalize(force, vec3.fromValues(x, y, 0.));
    // }


    // if (z > 60.) {
    //     vec3.set(force, 0., 0., -30.);
    // }
    // else if (z > 45.) {
    //     vec3.set(force, force[0], force[1], -15.);
    // }
    // else if (z > 40.) {
    //     vec3.set(force, force[0], force[1], -8.);
    // }
    // else if (z < 5.) {
    //     vec3.set(force, force[0], force[1], 1.);
    // }

    // return force;
}

// function trajectoryForce(posList, index){
//     const force = vec3.fromValues(0., 0., 0.);
//     const x = posList[index][0];
//     const y = posList[index][1];
//     const z = posList[index][2];
//     const angle = Math.atan2(y, x); 
//     const dist = Math.sqrt(x*x + y*y);
    
//     const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
//     const trackPos = normalizedAngle / (2 * Math.PI);
    
//     // Base force magnitude
//     let mag = 8.0;
    
//     if (trackPos < 0.05) {
//         mag = 10.0;
//         vec3.set(force, -y * 1.5, x * 1.5, 20.0); // Strong upward force
//     } 
//     else if (trackPos < 0.1) {
//         // High altitude section in fog
//         mag = 10.0;
//         vec3.set(force, -y * 1.3, x * 1.3, 6.0); // Stay high in fog
//     }
//     else if (trackPos < 0.15) {
//         // Dive out of fog
//         mag = 12.0; 
//         vec3.set(force, -y * 1.8, x * 1.8, -65.0); // Strong dive down
//     }
//     else if (trackPos < 0.2) {
//         // Recovery from dive
//         mag = 6.0;
//         vec3.set(force, -y * 1.0, x * 1.0, 3.0); // Level out
//     }
//     else if (trackPos < 0.25) {
//         // very sharp turn
//         mag = 7.0; 
//         vec3.set(force, -y * 2.5, x * 0.4, 0.0); // Extreme banking
//     }
//     else if (trackPos < 0.35) {
//         mag = 9.0;
//         const chaosX = 4.0 * Math.sin(trackPos * 120);
//         const chaosY = 4.0 * Math.cos(trackPos * 130);
//         vec3.set(force, -y * 1.2 + chaosX, x * 1.2 + chaosY, 2.0 * Math.sin(trackPos * 100));
//     }
//     else if (trackPos < 0.4) {
//         mag = 5.0; 
//         vec3.set(force, -y * 1.8, x * 1.8, 0.0);
//         force[0] += 3.0 * Math.sin(trackPos * 70);
//     }
//     else if (trackPos < 0.45) {
//         // Swift upward climb back into fog
//         mag = 10.0;
//         vec3.set(force, -y * 1.2, x * 1.2, 8.0); // Strong climb
//     }
//     else if (trackPos < 0.5) {
//         // High fog section
//         mag = 8.0;
//         const fogEffect = 1.5 * Math.sin(trackPos * 200);
//         vec3.set(force, -y + fogEffect, x + fogEffect, 4.0);
//     }
//     else if (trackPos < 0.55) {
//         // Dramatic descent from fog with spiral
//         mag = 12.0;
//         const spiralX = 3.0 * Math.sin(trackPos * 80);
//         const spiralY = 3.0 * Math.cos(trackPos * 80);
//         vec3.set(force, -y * 1.4 + spiralX, x * 1.4 + spiralY, -15.0);
//     }
//     else if (trackPos < 0.65) {
//         const chicanePhase = Math.sin(trackPos * 90);
//         vec3.set(force, 
//             -y + chicanePhase * 6.0,
//             x + chicanePhase * 6.0, 
//             8.0 * Math.sin(trackPos * 60));
//         mag = 5.0;
//     }
//     else if (trackPos < 0.7) {
//         mag = 6.0;
//         vec3.set(force, -y * 1.0, x * 1.0, -2.0);
//     }
//     else if (trackPos < 0.75) {
//         mag = 12.0;
//         vec3.set(force, -y * 0.8, x * 0.8, 5.0 + 5.0 * Math.sin(trackPos * 90));
//     }
//     else if (trackPos < 0.8) {
//         // High banking turn
//         mag = 8.0;
//         vec3.set(force, -y * 0.5, x * 2.5, 1.0 * Math.cos(trackPos * 40));
//     }
//     else if (trackPos < 0.85) {
//         // Dramatic hairpin with swooping motion
//         mag = 9.0;
//         vec3.set(force, -y * 0.3, x * 2.8, -4.0 * Math.sin(trackPos * 50));
//     }
//     else if (trackPos < 0.9) {
//         mag = 11.0;
//         vec3.set(force, -y * 1.7, x * 1.7, 15.0);
//     }
//     else if (trackPos < 0.95) {
//         mag = 14.0;
//         vec3.set(force, -y * 2.2, x * 2.2, -10.0);
//     }
//     else {
//         const resetAngle = 0.05;
        
//         vec3.set(force,
//             -Math.sin(resetAngle * 2 * Math.PI) * 20.0,
//             Math.cos(resetAngle * 2 * Math.PI) * 20.0,
//             -25.0); // Strong upward boost for next lap
            
//         mag = 4.0;
//     }
    
//     force[2] += 2.5 * Math.sin(trackPos * 20.0);
    
//     const radiusVar = 1.0 + 1.0 * Math.sin(trackPos * 12.0);
    
//     vec3.scale(force, force, mag * radiusVar);
    
//     return force;
// }

export function evolveBoid(dt, posList, velList, index) {
    const avoidance = avoidanceForce(posList, index);
    const cohesion = cohesionForce(posList, index);
    const alignement = alignementForce(posList, velList, index);
    const containement = containementForce(posList, index);
    //const trajectory = trajectoryForce(posList, index); 

    // console.log(`avoidance: ${vec3.str(avoidance)}`);
    // console.log(`cohesion: ${vec3.str(cohesion)}`);
    // console.log(`alignement: ${vec3.str(alignement)}`);
    // console.log(`containement: ${vec3.str(containement)}`);
    // console.log(`trajectory: ${vec3.str(trajectory)}`);

    const newVel = vec3.create();
    vec3.scale(newVel, avoidance, avoidanceWeight);
    vec3.scaleAndAdd(newVel, newVel, cohesion, cohesionWeight);
    vec3.scaleAndAdd(newVel, newVel, alignement, alignementWeight);
    vec3.scaleAndAdd(newVel, newVel, containement, containementWeight);
    //vec3.scaleAndAdd(newVel, newVel, trajectory, trajectoryWeight);

    vec3.scaleAndAdd(newVel, velList[index], newVel, dt);

    const norm = vec3.len(newVel);
    const adjustedMaxSpeed = dynamicMaxSpeed(posList, index);
    if (norm < minSpeed) {
        vec3.normalize(newVel, newVel);
        vec3.scale(newVel, newVel, minSpeed);
    } else if (norm > adjustedMaxSpeed) { 
        vec3.normalize(newVel, newVel);
        vec3.scale(newVel, newVel, adjustedMaxSpeed);       
    }
    
    return newVel;
}