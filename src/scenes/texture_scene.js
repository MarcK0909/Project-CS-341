
import { TurntableCamera } from "../scene_resources/camera.js"
import * as MATERIALS from "../render/materials.js"
import { cg_mesh_make_uv_sphere } from "../cg_libraries/cg_mesh.js"
import { load_image, load_text, load_texture } from "../cg_libraries/cg_web.js"

import { 
  create_slider, 
  create_button_with_hotkey, 
  create_hotkey_action 
} from "../cg_libraries/cg_web.js";
import { Scene } from "./scene.js";
import { ResourceManager } from "../scene_resources/resource_manager.js";

import { evolveBoid } from "../scene_resources/boids.js";
import { vec3 } from "../../lib/gl-matrix_3.3.0/esm/index.js";

export class TextureScene extends Scene {

  /**
   * A scene to be completed, used for the introductory tutorial
   * @param {ResourceManager} resource_manager 
   */
  constructor(resource_manager){
    super();
    
    this.resource_manager = resource_manager;

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


    for (let h = 0; h < 2; h++) {
      for (let i = 0; i < 4; i++) {
        const position = [15.0 * i + 30., 0.0, 10.0 * h + 20.];
  
        const actorBird = {
          translation : position,
          scale: [5., 5., 5.],
          mesh_reference : "Bird1.obj",
          material : {
            ...MATERIALS.black,
            texture: 'BirdImage.png'
          }
        };
  
        this.objects.push(actorBird);
        this.actors[`bird${h * 4 + i}`] = actorBird;
        this.posList.push(vec3.fromValues(position[0], position[1], position[2]));
        this.velList.push(vec3.fromValues(0., 8., 0.));
        this.evolvedList.push(false);
      }
      
    }

    this.objects.push({
      translation : [20, 0.0, 0.0],
      scale: [3., 3., 3.],
      mesh_reference : "Bird1.obj",
      material : {
        ...MATERIALS.black,
        texture: 'BirdImage.png'
      }
    });
    this.objects.push({
        translation : [20, 0.0, 0.0],
        scale: [3., 3., 3.],
        mesh_reference : "Bird0001.obj",
        material : {
            ...MATERIALS.black,
            texture: 'BirdImage.png'
        }
    });

    this.objects.push({
      translation : [0., 0.0, 0.0],
      scale: [5., 5., 5.],
      mesh_reference : "Bird1.obj",
      material : MATERIALS.black
    });


    this.objects.push({
      translation : [0.0, 0.0, 0.0],
      scale: [150., 150., 150.],
      mesh_reference : "skySphere",
      material : MATERIALS.misty_forrest
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
          const index = Number(name.charAt(4)); // relies on naming convention !!!!
          
          console.log(`evolving: ${index}`);
          const velocity = evolveBoid(dt, this.posList, this.velList, index);

          const position = vec3.create();
          vec3.scaleAndAdd(position, this.posList[index], velocity, dt);

          bird.translation[0] = position[0];
          bird.translation[1] = position[1];
          bird.translation[2] = position[2];

          // change to newPosList and newVelList and uncomment paragraph undeneath to use same values for all birds in one step
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
