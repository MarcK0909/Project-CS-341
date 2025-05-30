// import { normalFromMat4 } from "../../lib/gl-matrix_3.3.0/esm/mat3";

const default_texture = null; 
const default_base_color = [1.0, 0.0, 1.0];  // magenta, used when no texture is provided
const default_shininess = 0.1;


/*---------------------------------------------------------------
	Materials
---------------------------------------------------------------*/
/**
 * Materials are defined by parameters that describe how 
 * different objects interact with light.
 * 
 * The `properties` array can be used to indicate by 
 * which shaders will process this material. 
 * ShaderRenderer classes have an `exclude()` function whose
 * behavior can be customized to adapt to different material properties.
 */

class Material {

    constructor(){
        this.texture = default_texture;
        this.color = default_base_color;
        this.shininess = default_shininess;
        this.properties = [];
    }

}

class BackgroundMaterial extends Material {

    constructor({texture = default_texture}){
        super()
        this.texture = texture;
        this.properties.push("environment");
        this.properties.push("no_blinn_phong");
    }
}
class TexturedObjectMaterial extends Material {
    constructor({texture = default_texture}){
        super()
        this.texture = texture;
        this.properties.push("environment");
    }
}

class NormalTexturedMaterial extends Material {
    constructor({texture = default_texture, normal_map = default_texture}){
        super();
        this.texture = texture;
        this.normal_map = normal_map;
    }
}

class DiffuseMaterial extends Material {

    constructor({
        texture = null, 
        color = default_base_color, 
        shininess = default_shininess
    }){
        super()
        this.properties.push("no_normals");
        this.texture = texture;
        this.color = color;
        this.shininess = shininess;
    }
}

class ReflectiveMaterial extends Material {
    constructor(){
        super()
        this.properties.push("reflective");
    }
}

class TerrainMaterial extends Material {
    constructor({
        water_color = [0.29, 0.51, 0.62],
        water_shininess = 30.,
        grass_color = [0.33, 0.43, 0.18],
        grass_shininess = 5.,
        peak_color = [0.9, 0.9, 0.9],
        peak_shininess = 10.
    }){
        super()
        this.water_color = water_color;
        this.water_shininess = water_shininess;
        this.grass_color = grass_color 
        this.grass_shininess = grass_shininess;
        this.peak_color = peak_color;
        this.peak_shininess = peak_shininess;

        this.properties.push("terrain");
        this.properties.push("no_blinn_phong");
    }
}

/*---------------------------------------------------------------
	Material Instantiation
---------------------------------------------------------------*/
/**
 * Here materials are defined to later be assigned to objects.
 * Choose the material class, and specify its customizable parameters.
 */
export const sunset_sky = new BackgroundMaterial({
    texture: 'kloppenheim_07_puresky_blur.jpg'
});
export const map_material = new TexturedObjectMaterial({
    texture: 'map.png'
});
export const bird = new TexturedObjectMaterial({
    texture: 'BirdImageDarker.png'
});

export const WhiteBackground = new BackgroundMaterial({
    texture: 'WhiteBackground.png'
});

export const ground_test = new TexturedObjectMaterial({
    texture: 'ground_blurr4.png'
});

export const misty_forrest = new BackgroundMaterial({
    texture: 'misty_pines.jpg'
});

export const test_sphere = new BackgroundMaterial({
    texture: 'testSkySphere.jpg'
});

export const normal_ground_forest = new NormalTexturedMaterial({
    normal_map: 'ground_normal.png',
    texture: 'ground.jpg'
});
export const ground2 = new NormalTexturedMaterial({
    normal_map: 'ground_normal.png',
    texture: 'ground_blurr4.png'
})

export const gray = new DiffuseMaterial({
    color: [0.4, 0.4, 0.4],
    shininess: 0.5
});

export const gold = new DiffuseMaterial({
    texture: 'tex_gold',
    shininess: 14.0
});

export const black = new DiffuseMaterial({
    texture: 'tex_black',
    shininess: 5.0
});

export const pine = new DiffuseMaterial({
    texture: 'text.jpg',
    shininess: 0.5
});

export const pine_norm = new NormalTexturedMaterial({
    normal_map :  'pine_texture_2_normal_blurr2.jpg',
    texture :  'pine_texture_2_blurr2.jpg'
})

export const pine_test = new TexturedObjectMaterial({
    texture : 'pine_texture_2_blurr2.jpg'
})



export const terrain = new TerrainMaterial({
    water_color: [0.29, 0.51, 0.62],
    grass_color: [0.33, 0.43, 0.18],
    peak_color: [0.8, 0.5, 0.4]
});

export const ground = new BackgroundMaterial({
    texture: 'ground.jpg'
})

export const mirror = new ReflectiveMaterial({})
