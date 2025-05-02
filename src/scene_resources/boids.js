import { vec3, mat3 } from "../../lib/gl-matrix_3.3.0/esm/index.js"
import { fromValues } from "../../lib/gl-matrix_3.3.0/esm/mat2.js";

const maxSpeed = 20.;
const minSpeed = 5.;

const avoidanceRadius = 12.;
const perceptionRadius = 50.;

// placeholder
const worldRadius = 90.;

const avoidanceWeight = 30.;
const cohesionWeight = 0.01;
const alignementWeight = 0.27;
// const containementWeight = 10.;
// const trajectoryWeight = 12.;
// const avoidanceWeight = 0.;
// const cohesionWeight = 0.;
// const alignementWeight = 0.;
const containementWeight = 30.;
const trajectoryWeight = 2.;

function diffFromMeanPerceptionFiltered(filterList, listToMean, index) {
    const diff = vec3.fromValues(0., 0., 0.);
    let count = 0.;
    // assuming the index of corresponding elements in filterList and listToMean is identical 
    for (let i = 0; i < filterList.length; i++) {
        if (i != index) {
            const distanceVec = vec3.create();
            vec3.sub(distanceVec, filterList[i], filterList[index]);
            if (vec3.len(distanceVec) <= perceptionRadius) {
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
        if (distance <= avoidanceRadius && distance != 0.) {
            vec3.scaleAndAdd(force, force, vec3.negate(distanceVec, vec3.normalize(distanceVec, distanceVec)), 1. / distance);
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

function containementForce(posList, index) {
    const force = vec3.fromValues(0., 0., 0.);
    // containement sphere
    // if (vec3.len(posList[index]) > worldRadius) {
    //    vec3.negate(force, vec3.normalize(force, posList[index]));
    // }

    // 2 containement cylinders
    const x = posList[index][0];
    const y = posList[index][1];
    const z = posList[index][2];
    const horizontalDistSquared = x * x + y * y;
    if (horizontalDistSquared > 10000.) {
       vec3.normalize(force, vec3.fromValues(-x * 3., -y * 3., 0.));
    }
    else if (horizontalDistSquared < 40.) {
        vec3.normalize(force, vec3.fromValues(3. * x, 3. * y, 0.));
    }
    if (z > 50.) {
        vec3.normalize(force, vec3.set(force, force[0], force[1], -1.));
     }
    else if (z < 50.) {
        vec3.normalize(force, vec3.set(force, force[0], force[1], 1.));
    }

    return force;
}

function trajectoryForce(posList, index){
    const force = vec3.fromValues(0., 0., 0.);
    const x = posList[index][0];
    const y = posList[index][1];
    const z = posList[index][2];
    const angle = Math.atan2(y, x); 
    const dist = Math.sqrt(x*x + y*y);
    
    //time-based effect based on position
    const pseudoTime = (dist * 0.01) + (index * 0.1);
    
    const sector = Math.floor(((angle + Math.PI) / (Math.PI / 4))) % 8;

    const mag = 3.0 + Math.sin(dist * 0.05) * 1.5;

    switch (sector) {
        case 0:
            //  spiral
            vec3.set(force, 
                mag + 3.0 * Math.sin(angle * 3.0), 
                2.0 * Math.sin(8 * x) + 2.0 * Math.cos(dist * 0.1), 
                0.5 * Math.sin(dist * 0.1));
            break;
        case 1:
            //  swirl 
            vec3.set(force, 
                mag + 4.0 * Math.cos(5 * angle), 
                mag + 4.0 * Math.sin(5 * angle), 
                0.8 * Math.sin(angle * 2.0));
            break;
        case 2:
            vec3.set(force, 
                3.0 * Math.sin(y * 0.1), 
                mag + 2.0 * Math.cos(x * 0.1), 
                0.7 * Math.cos(dist * 0.08));
            break;
        case 3:
            vec3.set(force, 
                -mag + 3.0 * Math.sin(angle * 4.0), 
                mag + 2.0 * Math.cos(dist * 0.1), 
                0.5 * Math.sin(x * 0.08));
            break;
        case 4:
            // Oscillation
            vec3.set(force, 
                mag + Math.sin(dist * 0.2) * 3.0, 
                2.0 * Math.sin(8 * x) + Math.cos(dist * 0.15) * 3.0, 
                0.6 * Math.sin(angle * 3));
            break;
        case 5:
            vec3.set(force, 
                -mag + 4.0 * Math.cos(6 * angle + dist * 0.05), 
                -mag + 3.0 * Math.sin(5 * angle + dist * 0.05), 
                0.7 * Math.cos(angle * 2.0));
            break;
        case 6:
            vec3.set(force, 
                3.0 * Math.cos(y * 0.15), 
                -mag + 2.0 * Math.sin(x * 0.2), 
                0.8 * Math.sin(dist * 0.06));
            break;
        case 7:
            vec3.set(force, 
                mag + 3.0 * Math.cos(angle * 2.0 + dist * 0.05), 
                -mag + 3.0 * Math.sin(angle * 3.0 + dist * 0.05), 
                0.5 * Math.cos(angle * 4.0));
            break;
    }
    return force;
}

export function evolveBoid(dt, posList, velList, index) {
    const avoidance = avoidanceForce(posList, index);
    const cohesion = cohesionForce(posList, index);
    const alignement = alignementForce(posList, velList, index);
    const containement = containementForce(posList, index);
    const trajectory = trajectoryForce(posList, index); 

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
    vec3.scaleAndAdd(newVel, newVel, trajectory, trajectoryWeight);

    vec3.scaleAndAdd(newVel, velList[index], newVel, dt);

    const norm = vec3.len(newVel);
    if (norm < minSpeed) {
        vec3.normalize(newVel, newVel);
        vec3.scale(newVel, newVel, minSpeed);
    } else if (norm > maxSpeed) { 
        vec3.normalize(newVel, newVel);
        vec3.scale(newVel, newVel, maxSpeed);       
    }
    
    return newVel;
}