import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere, cg_mesh_make_plane } from "../cg_libraries/cg_mesh.js"

import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";

import { evolveBoid } from "../scene_resources/boidsDemo.js"; // Assuming this path and function are correct
import { quat, vec3 } from "../../lib/gl-matrix_3.3.0/esm/index.js";

export class BoidsDemo extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;
    this.scale = 0.1;
    this.camera.distance_factor = 0.5;
    this.camera.update_cam_transform();
    // Boids
    this.posList = [];
    this.newPosList = [];
    this.velList = [];
    this.newVelList = [];
    this.evolvedList = [];

    this.initialize_scene();
    this.initialize_actor_actions();

  }

  /**
   * Scene setup
   */
  initialize_scene(){

    this.resource_manager.add_procedural_mesh("skySphere", cg_mesh_make_uv_sphere(20));
    this.resource_manager.add_procedural_mesh("plane", cg_mesh_make_plane());

    this.lights.push({
      position : [0.0 , 0.0, 100.],
      color: [1.0, 1.0, 0.9]
    });

    const group1_h_limit = 10; 
    const group1_i_limit = 5;
    const group1_j_limit = 2;

    const group2_h_limit = 10; 
    const group2_i_limit = 5;
    const group2_j_limit = 2;

    let boid_actor_id_counter = 0; 

    for (let h = 0; h < group1_h_limit; h++) {
      for (let i = 0; i < group1_i_limit; i++) {
        for (let j = 0; j < group1_j_limit; j++) {
          const position = [
            this.scale * (3.0 * i + 10. + 1. * j), 
            this.scale * (3.0 * h - 2. + 0.5 * j), 
            this.scale * (3.0 * j + 15.)
          ];
          const velocity = vec3.fromValues(-18. * this.scale, 0., 0.);
          let bird_material = MATERIALS.bird;

          const actorBird = {
            translation : vec3.clone(position), 
            rotation : quat.rotationTo(quat.create(), vec3.fromValues(0., 1., 0.), vec3.normalize(vec3.create(), velocity)),
            scale: [0.3 * this.scale, 0.3 * this.scale, 0.3 * this.scale],
            mesh_reference : "BirdAnimationOndrej0005.obj", 
            material : bird_material,
            time : Math.random() * 10. 
          };
    
          this.objects.push(actorBird);
          this.actors[`bird${boid_actor_id_counter + 100}`] = actorBird; 
          this.posList.push(vec3.clone(position));
          this.velList.push(vec3.clone(velocity));
          this.evolvedList.push(false);
          
          boid_actor_id_counter++;
        }
      }
    }

    for (let h = 0; h < group2_h_limit; h++) {
      for (let i = 0; i < group2_i_limit; i++) {
        for (let j = 0; j < group2_j_limit; j++) {
          const position = [
            this.scale * (3.0 * h - 2. + 0.5 * j), 
            this.scale * (3.0 * i + 10. + 1. * j), 
            this.scale * (3.0 * j + 16.)
          ];
          const velocity = vec3.fromValues(0., -18. * this.scale, 0.);
          let bird_material = MATERIALS.bird;

          const actorBird = {
            translation : vec3.clone(position),
            rotation : quat.rotationTo(quat.create(), vec3.fromValues(0., 1., 0.), vec3.normalize(vec3.create(), velocity)),
            scale: [0.3 * this.scale, 0.3 * this.scale, 0.3 * this.scale],
            mesh_reference : "BirdAnimationOndrej0005.obj",
            material : bird_material,
            time : Math.random() * 10.
          };
    
          this.objects.push(actorBird);
          this.actors[`bird${boid_actor_id_counter + 100}`] = actorBird;
          this.posList.push(vec3.clone(position));
          this.velList.push(vec3.clone(velocity));
          this.evolvedList.push(false);
          
          boid_actor_id_counter++;
        }
      }
    }
    
    if (boid_actor_id_counter >= 900) {
        console.warn(`WARNING: Number of boids (${boid_actor_id_counter}) is approaching or exceeding the limit (900) for the current actor name parsing logic in initialize_actor_actions. Indexing may become incorrect.`);
    }
    // console.log(`Initialized ${boid_actor_id_counter} boids.`);


    this.objects.push({
      translation : [0.0, 0.0, 0.0],
      rotation : quat.fromEuler(quat.create(), 0, 0, 0),
      scale: [70., 70., 70.],
      mesh_reference : "skySphere",
      material : MATERIALS.sunset_sky
    });

  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){
    for (const name in this.actors) {
      if (name.includes("camera")) {
        const bezierCam = this.actors[name];
        bezierCam.evolve = (dt) => {
          bezierCam.update_time(dt);
        }
      } else if (name.includes("bird")){
        const bird = this.actors[name];
        bird.evolve = (dt) => {
          bird.time += dt;
          const index = Number(name.substring(4, 7)) - 100; 
    
          if (index < 0 || index >= this.posList.length) {
            console.error(`Calculated invalid index ${index} for actor ${name}. Check naming and substring logic.`);
            return;
          }
          
          const current_pos = this.posList[index];
          const current_vel = this.velList[index];

          // evolveBoid is expected to return the new velocity
          const new_velocity_from_boid_logic = evolveBoid(dt, this.posList, this.velList, index, current_pos, current_vel);

          const new_position = vec3.create();
          vec3.scaleAndAdd(new_position, current_pos, new_velocity_from_boid_logic, dt);

          bird.translation[0] = new_position[0];
          bird.translation[1] = new_position[1];
          bird.translation[2] = new_position[2];

          bird.rotation = quat.rotationTo(quat.create(), vec3.fromValues(0., 1., 0.), vec3.normalize(vec3.create(), new_velocity_from_boid_logic));
          
          animateBird(bird, bird.time, this.scale);

          this.newPosList[index] = new_position;
          this.newVelList[index] = new_velocity_from_boid_logic;
          this.evolvedList[index] = true;
        
          let all_evolved = true;
          for(let i = 0; i < this.evolvedList.length; i++) {
            if (!this.evolvedList[i]) {
              all_evolved = false;
              break;
            }
          }

          if (all_evolved) {
            for (let i = 0; i < this.posList.length; i++) {
              vec3.copy(this.posList[i], this.newPosList[i]);
              vec3.copy(this.velList[i], this.newVelList[i]);
              this.evolvedList[i] = false;
            }
          }
        };
      }
    }
  }

  /**
   * Initialize custom scene-specific UI parameters to allow interactive control of selected scene elements.
   * This function is called in main() if the scene is active.
   */
  initialize_ui_params(){
    // TODO
  }
}

function animateBird(bird, time, scale) {
  const frameRate = 25;
  const frame = Math.round(time * frameRate) % 200;
  const heightVar = 0.00015 * scale;
  if (frame < 73) {
    bird.translation[2] += frame * 117 * heightVar;
    const animationFrame = frame % 16;
    if (animationFrame < 5) {
      bird.mesh_reference = `BirdAnimationOndrej000${animationFrame + 5}.obj`;
    } else {
      bird.mesh_reference = `BirdAnimationOndrej00${animationFrame + 5}.obj`;
    }
  } else if (frame >= 73 && frame < 78) {
    bird.mesh_reference = `BirdCoastStartOndrej00${frame + 5}.obj`;
    bird.translation[2] += frame * 117 * heightVar;
  } else if (frame > 194) {
    bird.mesh_reference = `BirdCoastEndOndrej000${frame - 195}.obj`;
  } else {
    bird.mesh_reference = `BirdCoastStartOndrej0082.obj`;
    bird.translation[2] += (117 - (frame - 78)) * 78 * heightVar;
  }
}