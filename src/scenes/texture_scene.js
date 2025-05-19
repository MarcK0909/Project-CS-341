
import { BezierCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_plane } from "../cg_libraries/cg_mesh.js"

import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";

import { evolveBoid } from "../scene_resources/boids.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix_3.3.0/esm/index.js";

export class TextureScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;
    this.camera = new BezierCamera();

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

    this.lights.push({
      position : [0.0 , 0.0, 15.],
      color: [1.0, 1.0, 0.9]
    });


    for (let h = 0; h < 2; h++) {
      for (let i = 0; i < 4; i++) {
        const position = [15.0 * i + 0., 0.0, 10.0 * h + 0.];
  
        const actorBird = {
          translation : position,
          scale: [1., 1., 1.],
          rotation : quat.fromEuler(quat.create(), 0, 0, 0),
          mesh_reference : "BirdAnimationOndrej0005.obj",
          material : MATERIALS.black,
          time : Math.random() * 2.
        };
  
        this.objects.push(actorBird);
        this.actors[`bird${h * 4 + i}`] = actorBird;
        this.posList.push(vec3.fromValues(position[0], position[1], position[2]));
        this.velList.push(vec3.fromValues(0., 8., 0.));
        this.evolvedList.push(false);
      }
      
    }

    
    this.resource_manager.add_procedural_mesh("floor", cg_mesh_make_plane());
    // this.resource_manager.add_procedural_mesh("spehe", );
    this.objects.push({
      translation : [0.0, 0.0, -10.0],
      scale: [30., 30., 30.],
      rotation : quat.fromEuler(quat.create(), 0, 0, 0),
      mesh_reference : "floor",
      material : MATERIALS.ground2
    });

  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){
    for (const name in this.actors) {
      // bird
      if (name.includes("bird")){
        const bird = this.actors[name];
        bird.evolve = (dt) => {
          bird.time += dt;
          const index = Number(name.charAt(4)); // relies on naming convention !!!!
    
          
          //console.log(`evolving: ${index}`);
          const velocity = evolveBoid(dt, this.posList, this.velList, index);

          const position = vec3.create();
          vec3.scaleAndAdd(position, this.posList[index], velocity, dt);

          bird.translation[0] = position[0];
          bird.translation[1] = position[1];
          bird.translation[2] = 5.;



          animateBird(bird, bird.time);
          this.posList[index] = position;
          this.velList[index] = velocity;

          this.evolvedList[index] = true;
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


function animateBird(bird, time) {
  const frameRate = 25;
  const frame = Math.round(time * frameRate) % 200;
  const heightVar = 0.00015;
  if (frame < 73) {
    // console.log("Flapping");
    bird.translation[2] += frame * 117 * heightVar;
    const animationFrame = frame % 16;
    if (animationFrame < 5) {
      bird.mesh_reference = `BirdAnimationOndrej000${animationFrame + 5}.obj`;
    } else {
      bird.mesh_reference = `BirdAnimationOndrej00${animationFrame + 5}.obj`;
    }
  } else if (frame >= 73 && frame < 78) {
    // console.log("Coast start");
    bird.mesh_reference = `BirdCoastStartOndrej00${frame + 5}.obj`;
    bird.translation[2] += frame * 117 * heightVar;
  } else if (frame > 194) {
    // console.log("Coast end");
    bird.mesh_reference = `BirdCoastEndOndrej000${frame - 195}.obj`;
    
  } else {
    // console.log("Coasting");
    bird.translation[2] += (117 - (frame - 78)) * 78 * heightVar;
  }

  
  
}


