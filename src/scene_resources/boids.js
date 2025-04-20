import { vec3, mat3 } from "../../lib/gl-matrix_3.3.0/esm/index.js"

const maxSpeed = 20.;
const minSpeed = 5.;

const avoidanceRadius = 12.;
const perceptionRadius = 50.;

// placeholder
const worldRadius = 90.;

const avoidanceWeight = 30.;
const cohesionWeight = 0.01;
const alignementWeight = 0.27;
const containementWeight = 10.;

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
    const horizontalDistSquared = x * x + y * y;
    if (horizontalDistSquared > 10000.) {
       vec3.normalize(force, vec3.fromValues(-x, -y, 0.));
    }
    else if (horizontalDistSquared < 40.) {
        vec3.normalize(force, vec3.fromValues(x, y, 0.));
    }
    if (posList[index][2] > 50.) {
        vec3.normalize(force, vec3.set(force, force[0], force[1], -1.));
     }
    else if (posList[index][2] < 50.) {
        vec3.normalize(force, vec3.set(force, force[0], force[1], 1.));
    }

    return force;
}

export function evolveBoid(dt, posList, velList, index) {
    const avoidance = avoidanceForce(posList, index);
    const cohesion = cohesionForce(posList, index);
    const alignement = alignementForce(posList, velList, index);
    const containement = containementForce(posList, index);

    console.log(`avoidance: ${vec3.str(avoidance)}`);
    console.log(`cohesion: ${vec3.str(cohesion)}`);
    console.log(`alignement: ${vec3.str(alignement)}`);
    console.log(`containement: ${vec3.str(containement)}`);

    const newVel = vec3.create();
    vec3.scale(newVel, avoidance, avoidanceWeight);
    vec3.scaleAndAdd(newVel, newVel, cohesion, cohesionWeight);
    vec3.scaleAndAdd(newVel, newVel, alignement, alignementWeight);
    vec3.scaleAndAdd(newVel, newVel, containement, containementWeight);

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