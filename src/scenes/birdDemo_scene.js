
import { TurntableCamera } from "../scene_resources/camera.js"
import { BezierCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere, cg_mesh_make_plane } from "../cg_libraries/cg_mesh.js"

import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action 
} from "../cg_libraries/cg_web.js";
import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";

import { evolveBoid } from "../scene_resources/boids.js";
import { mat4, quat, vec3 } from "../../lib/gl-matrix_3.3.0/esm/index.js";

export class BirdDemo extends Scene {

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
      position : [0.0 , 0.0, 50.],
      color: [1.0, 1.0, 0.9]
    });

    const actorBird = {
      translation : [0., 0., 0.],
      rotation : quat.fromEuler(quat.create(), 0, 0, 0),
      scale: [3., 3., 3.],
      mesh_reference : "BirdCoastStartOndrej0082.obj",
      material : MATERIALS.bird,
      time : 2.
    };

    this.objects.push(actorBird);
    this.actors[`bird${100}`] = actorBird;
    this.posList.push(vec3.fromValues(0., 0., 0.));
    this.velList.push(vec3.fromValues(0., 0., 0.));
    this.evolvedList.push(false);


    this.objects.push({
      translation : [0.0, 0.0, 0.0],
      rotation : quat.fromEuler(quat.create(), 0, 0, 0),
      scale: [200., 200., 200.],
      mesh_reference : "skySphere",
      material : MATERIALS.sunset_sky
    });


    this.actors["camera"] = {cam: this.camera, time: 0.};

  }

  /**
   * Initialize the evolve function that describes the behaviour of each actor 
   */
  initialize_actor_actions(){

    for (const name in this.actors) {
      if (name.includes("camera")) {
        const camera = this.actors[name];
        camera.evolve = (dt) => {
          camera.time += dt;
          camera.cam.rotate_action(2.5, 0.);
          if (camera.time > 10.) {
            camera.cam.zoom_action(1.);
          }

        }
      } else if (name.includes("bird")){
        const bird = this.actors[name];
        bird.evolve = (dt) => {
          bird.time += dt;
          const index = Number(name.substring(4, 7)) - 100; // relies on naming convention MAX bird count = 100 !!!!
    
          bird.translation[2] = 0.;
          if (bird.time > 6.) {
            animateBird(bird, bird.time + 1.7, 1.);
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
  console.log(`frame: ${frame}`);
  const heightVar = 0.00015 * scale;
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
    bird.mesh_reference = `BirdCoastStartOndrej0082.obj`;
    bird.translation[2] += (117 - (frame - 78)) * 78 * heightVar;
  }

  
  
}


