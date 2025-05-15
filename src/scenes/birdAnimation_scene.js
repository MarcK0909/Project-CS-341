
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

    
    //List all of the pines' positions
    const pinePositions = [


      //f circle 
      [51, 80, 0],
      [51, 68, 0],
      [65, 69, 0],
      [65, 59, 0],
      [82, 57, 0],
      [40, 80, 0],
      [53, 97, 0],
      [89, 72, 0],
      [60, 80, 0],
      [27, 88, 0],
      [33, 92, 0],
      [15, 99, 0],

      //o circle - outside big circle but within 120 distance
      [110, 0, 0],
      [108, 40, 0],
      [105, 65, 0],
      [90, 75, 0],
      [75, 90, 0],
      [65, 105, 0],
      [40, 108, 0],
      [20, 115, 0],
      [-40, 108, 0],
      [-65, 105, 0],
      [-75, 90, 0],
      [-90, 75, 0],
      [-105, 65, 0],
      [-108, 40, 0],
      [-110, 0, 0],
      [-108, -40, 0],
      [-105, -65, 0],
      [-90, -75, 0],
      [-75, -90, 0],
      [-65, -105, 0],
      [-40, -108, 0],
      [0, -115, 0],
      [40, -108, 0],
      [65, -105, 0],
      [75, -90, 0],
      [90, -75, 0],
      [105, -65, 0],
      [108, -40, 0],
      [115, 25, 0],
      [-115, 25, 0],
      
      //k circle
      [0, 50, 0],
      [3, 41, 0],        
      [-10, 50, 0],
      [-12, 64, 0],      
      [-6, 58, 0],
      [-15, 57, 0],

      //s circle
      [-46, 49, 0],
      [-35, 47, 0],
      [-36, 57, 0],
      [-43, 39, 0],
      [-54, 41, 0],

      //q circle
      [-37, 100, 0],
      [-44, 97, 0],
      [-42, 106, 0],

      //d1 circle
      [-97, 52, 0],
      [-93, 44, 0],
      [-98, 61, 0],
      [-105, 56, 0],
      [-102, 40, 0],

      //p circle
      [0, 0, 0],            
      [25, 0, 0],         
      [-25, 0, 0],        
      [0, 25, 0],            
      [0, -25, 0],           
      [20, 20, 0],           
      [-20, 20, 0],
      [-20, -20, 0],
      [20, -20, 0],
      [40, 10, 0],   
      [-40, 10, 0],
      [10, 40, 0],
      [-10, 40, 0],
      [40, -10, 0],
      [-40, -10, 0],
      [10, -40, 0],
      [-10, -40, 0],
      [30, 30, 0],
      [-30, 30, 0],
      [-30, -30, 0],
      [15, 12, 0],
      [-15, 12, 0],
      [15, -12, 0],
      [-15, -12, 0],
      [35, 25, 0],
      [-35, 25, 0],
      [35, -25, 0],
      [-35, -25, 0],
      [8, 32, 0],
      [-8, 32, 0],
      [32, 8, 0],
      [-32, 8, 0],
      [8, -32, 0],
      [-8, -32, 0],
      [32, -8, 0],
      [-32, -8, 0],
      [22, 35, 0],
      [-22, 35, 0],
      [22, -35, 0],
      [-22, -35, 0],
      

      //t circle
      [-80, -67, 0],
      [-74, -70, 0],
      [-70, -82,0],
      [-78, -87, 0],
      [-78,-77,0],
      [-85, -80,0],
      [-88, -70, 0],
      [-96, -80, 0],
      [-98, -72, 0],
      [-88, -87, 0],
      [-96, -59, 0],

      //e1 circle
      [-26, -54, 0],
      [-17, -47, 0],
      [-13, -57, 0],
      [-30, -40, 0],
      [0, -50, 0],
      [0, -60, 0],
      [-14, -66, 0],
      [-2, -72, 0],
      [-44, -40, 0]
      [-40, -49, 0],

      //bottom right dotted border
      [21, -50, 0],
      [20, -61, 0],
      [42, -56, 0],
      [39, -48, 0],
      [40, -40, 0],
      [55, -32, 0],
      [47, -23, 0],
      [52, -38, 0],
      [16, -67, 0],
      [62, -24, 0],
      [55, -33, 0],

      //h circle
      [54, 10, 0],
      [66, 3, 0],
      [55, -12, 0],
      [63, -7, 0],
      [44, 0, 0],
      [46, 20, 0],
      [53, 0, 0],

    ];

    //Push pines on the scene
    for (const pos of pinePositions) {

      const sizeFactor = Math.random()/2 + 0.8;
      const rotFactor = Math.random() * 360;
      this.objects.push({
        translation: [this.scale * pos[0], this.scale * pos[1], this.scale * pos[2]],
        rotation: quat.fromEuler(quat.create(), 0, 0, rotFactor),
        scale: [sizeFactor * this.scale, sizeFactor *this.scale, sizeFactor *this.scale],
        mesh_reference: "pine_3_stack.obj",
        material: MATERIALS.pine
      });
    }

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


