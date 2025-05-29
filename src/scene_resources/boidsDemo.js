import { vec3, mat3 } from "../../lib/gl-matrix_3.3.0/esm/index.js"

const scale = 0.1;

const maxSpeed = 20. * scale;
const minSpeed = 5. * scale;

const avoidanceRadius = 3. * scale;
const perceptionRadius = 10. * scale;


// cohesion force angle 
const forceAngle = 5 * Math.PI / 12;
const dynamicMaxSpeedWeight = 1.;
const avoidanceForceLimit = 30. * scale;

const avoidanceWeight = 2. * scale;
const cohesionWeight = 5. * scale;
const alignementWeight = 2. * scale;
const containementWeight = 50. * scale;
const trajectoryWeight = 0.;

// useful vec3
const origin = vec3.create();

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
        vec3.sub(diff, diff, listToMean[index]);
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
    if (vec3.len(diff) < cylRadius) {    
        vec3.normalize(force, diff);
        vec3.rotateZ(force, force, origin, direction * forceAngle);
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

    // Global outer limit check
    if (vec3.len(birdXYPos) > 3.) {
        vec3.normalize(force, vec3.negate(vec3.create(), birdXYPos));
    }

    // Global lower and upper bound
    if (posList[index][2] < 1.2) {
        console.log("TOO LOW");
        const newForce = vec3.fromValues(0, 0, 1);
        vec3.add(force, force, newForce);
    } else if (posList[index][2] > 3.) {
            const newForce = vec3.fromValues(0, 0, -1);
            vec3.add(force, force, newForce);      
    }


    return force;


}

export function evolveBoid(dt, posList, velList, index) {
    const avoidance = avoidanceForce(posList, index);
    const cohesion = cohesionForce(posList, index);
    const alignement = alignementForce(posList, velList, index);
    const containement = containementForce(posList, index);

    const newVel = vec3.create();
    vec3.scale(newVel, avoidance, avoidanceWeight);
    vec3.scaleAndAdd(newVel, newVel, cohesion, cohesionWeight);
    vec3.scaleAndAdd(newVel, newVel, alignement, alignementWeight);
    vec3.scaleAndAdd(newVel, newVel, containement, containementWeight);

    vec3.scaleAndAdd(newVel, velList[index], newVel, dt);

    const norm = vec3.len(newVel);
    const adjustedMaxSpeed = maxSpeed;
    if (norm < minSpeed) {
        vec3.normalize(newVel, newVel);
        vec3.scale(newVel, newVel, minSpeed);
    } else if (norm > adjustedMaxSpeed) { 
        vec3.normalize(newVel, newVel);
        vec3.scale(newVel, newVel, adjustedMaxSpeed);       
    }
    
    return newVel;
}