
import { TurntableCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere } from "../cg_libraries/cg_mesh.js"

import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action 
} from "../cg_libraries/cg_web.js";
import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";

import { evolveBoid } from "../scene_resources/boids.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix_3.3.0/esm/index.js";

export class BirdAnimation extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;
    this.scale = 0.1;
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

    // TODO

    this.resource_manager.add_procedural_mesh("skySphere", cg_mesh_make_uv_sphere(20));

    this.lights.push({
      position : [0.0 , 0.0, 15.],
      color: [1.0, 1.0, 0.9]
    });


    for (let h = 0; h < 4; h++) {
      for (let i = 0; i < 9; i++) {
        const position = [this.scale * (3.0 * i + 71.), this.scale* (5.0 * h - 5.), this.scale * (0.0)];
        const velocity = vec3.fromValues(0., 18. * this.scale, 0.);
        let bird_material = MATERIALS.black;

        const actorBird = {
          translation : position,
          rotation : quat.rotationTo(quat.create(), vec3.fromValues(0., 1., 0.), velocity),
          scale: [0.3 * this.scale, 0.3 * this.scale, 0.3 * this.scale],
          mesh_reference : "BirdAnimationOndrej0005.obj",
          material : bird_material,
          time : Math.random() * 2.
        };
  
        this.objects.push(actorBird);
        this.actors[`bird${h * 9 + i + 100}`] = actorBird;
        this.posList.push(vec3.fromValues(position[0], position[1], position[2]));
        this.velList.push(velocity);
        this.evolvedList.push(false);
      }
      
    }

    // this.objects.push({
    //   translation : [20., 0.0, 0.0],
    //   scale: [5., 5., 5.],
    //   mesh_reference : "Bird0001.obj",
    //   material : MATERIALS.gold
    // });

    // this.objects.push({
    //   translation : [0., 0.0, 0.0],
    //   rotation : quat.fromEuler(quat.create(), 0, 0, 0),
    //   scale: [5., 5., 5.],
    //   mesh_reference : "Bird1.obj",
    //   material : MATERIALS.gold
    // });
    this.objects.push({
      translation : [0.65, 0.78, 0.0],
      rotation : quat.fromEuler(quat.create(), 0, 0, 90),
      scale: [12.5, 13, 13.],
      mesh_reference : "square.obj",
      material : MATERIALS.map_material
    });

    //  this.objects.push({
    //   translation : [0.0, 0.0, 0.0],
    //   rotation : quat.fromEuler(quat.create(), 0, 0, 0),
    //   scale: [5.1, 5.1, 5.1],
    //   mesh_reference : "skySphere",
    //   material : MATERIALS.gold
    // });

    this.objects.push({
      translation : [0.0, 0.0, 0.0],
      rotation : quat.fromEuler(quat.create(), 0, 0, 0),
      scale: [150., 150., 150.],
      mesh_reference : "skySphere",
      material : MATERIALS.test_sphere
    });

  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){

    // const bird = this.actors["actorBird"];
    
    // bird.evolve = (dt) => {
    //   const maxTraslation = 200.;
    //   const speed = 10.;
    //   if (bird.translation[1] < maxTraslation) {
    //     bird.translation[1] += speed * dt;
    //   }
    // }
    for (const name in this.actors) {
      // bird
      if (name.includes("bird")){
        const bird = this.actors[name];
        bird.evolve = (dt) => {
          bird.time += dt;
          const index = Number(name.substring(4, 7)) - 100; // relies on naming convention MAX bird count = 100 !!!!
    
          
          //console.log(`evolving: ${index}`);
          const velocity = evolveBoid(dt, this.posList, this.velList, index);

          const position = vec3.create();
          vec3.scaleAndAdd(position, this.posList[index], velocity, dt);

          bird.translation[0] = position[0];
          bird.translation[1] = position[1];
          //bird.translation[2] = position[2];
          bird.translation[2] = 0.; // TEMPORARY 2D!!!!

          bird.rotation = quat.rotationTo(quat.create(), vec3.fromValues(0., 1., 0.), vec3.normalize(vec3.create(), velocity));
          if (index == 3) {
            const angle = 360 * vec3.angle(vec3.fromValues(1., 0., 0.), velocity) / (2 * Math.PI);
            // console.log(angle);
          }

          animateBird(bird, bird.time);

          // change to newPosList and newVelList and uncomment paragraph undeneath to use same values for all birds in one step
          vec3.set(position, position[0], position[1], 0.) // TEMPORARY 2D!!!!
          this.posList[index] = position;
          this.velList[index] = velocity;

          this.evolvedList[index] = true;
        
        //   if (this.evolvedList.every(e => e)) {
        //     console.log(`all birds have been evolved once`);

        //     this.posList = this.newPosList.slice();
        //     this.velList = this.newVelList.slice();

        //     // for (let i = 0; i < this.posList.length; i++) {
        //     //   vec3.copy(this.posList[i], this.newPosList[i]);
        //     //   vec3.copy(this.velList[i], this.newVelList[i]);
        //     // }
        //     this.evolvedList.forEach((v, i, arr) => arr[i] = false);
        //   }
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


