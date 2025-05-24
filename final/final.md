---
title: Final Project Report CS-341 2025
---

# In Flight

<div>
<video src="videos/demo_teaser.mp4" height="300px" autoplay loop></video>
</div>
<figcaption style="text-align: center;"></figcaption>

## Abstract

The goal of our project, "In Flight," is to create a dynamic and visually engaging 3D scene showcasing bird animation and flocking behavior. We aimed to implement the boids algorithm to simulate the behavior of a flock of birds flying through a forest filled with pines swirling in between them and dodging them to create a movie-like scene. 


## Overview

<div style="display: flex; justify-content: space-around; align-items: center;">
<div>
<img src="images/demo_detail.png" height="210px" style="vertical-align: middle;">
</div>
<div>
<video src="videos/demo_detail.mp4" height="210px" autoplay loop style="vertical-align: middle;"></video>
</div>
</div>
<figcaption style="text-align: center;">Some more visuals focusing on interesting details of your scene.</figcaption>

As described earlier in the abstract, our goal was to create a scene of birds flying through a forest in a realistic manner. To accomplish this, we first thought about implementing a boids algorithm to have better and more natural bird movement than if we had just used a linear trajectory for the birds to follow. We added the classic forces you would have in a Boids like algorithm (avoidance, cohesion, alignement and containment) while also adding some more features which will be further described in our feature validation of this effect. The second feature we decided to implement was to design our own custom meshes instead of just importing ones from the Internet. We thought this would add a more unique look to our project and we did so using Blender and tutorials on how to proceed as we had almost never used this tool. The third feature we added was Normal Mapping to have more visually complex and realistic appearance for our low-polygon models. We added this with the help of a normal map for each texture used in the scene as described in the course in more detail. The fourth feature was the implementation of fog in our scene, we thought this would give a more cinematic and mysterious look to the scene while also making it seem like a real forest which also works well with the way that the boids behave where one can see them go in and out of the fog seamlessly. The fifth and final feature were Bezier curves to have smoother camera movement and thus a nicer visual result in the end which proved to further enhance our result.


## Feature validation

<table>
	<caption>Feature Summary</caption>
	<thead>
		<tr>
			<th>Feature</th>
			<th>Adapted Points</th>
			<th>Status</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Mesh and Scene Design</td>
			<td>5</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Normal mapping</td>
			<td>10</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Fog</td>
			<td>5</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Boids</td>
			<td>20</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
		<tr>
			<td>Bezier curves</td>
			<td>10</td>
			<td style="background-color: #d4edda;">Completed</td>
		</tr>
	</tbody>
</table>


### Mesh Design

#### Implementation

We designed our meshes in Blender, mainly by following tutorials on youtube ([Pine tree tutorial](https://www.youtube.com/watch?v=mgJxH_Jc2DI), [Tree tutorial](https://www.youtube.com/watch?v=hvxoAX_poI0), [Bird tutorial](https://www.youtube.com/watch?v=eSL98LLr1kw&list=WL&index=29)). These were very helpful as it was our first/second time working with Blender and helped us achieve a good visual result while managing the object complexity.

#### Validation

<div style="display: flex; justify-content: center; gap: 10px;">

<figure style="text-align: center;">
    <img src="images/Pine_in_Blender.png" alt="Our pine design in Blender" height="250">
    <figcaption>Our pine design in Blender</figcaption>
</figure>

<figure style="text-align: center;">
    <img src="images/Pine_render.png" alt="Our pine mesh rendered by the project framework" height="250">
    <figcaption>Our pine mesh rendered by the project framework</figcaption>
</figure>

<figure style="text-align: center;">
    <img src="images/Pine_ytb_tuto.png" alt="Pine design in the YouTube tutorial" height="250">
    <figcaption>Pine in the YouTube tutorial</figcaption>
</figure>

</div>

<div style="display: flex; justify-content: center; gap: 10px;">

<figure style="text-align: center;">
    <img src="images/Low_poly_tree.png" alt="A second tree design in Blender" height="170">
    <figcaption>A second tree design in Blender</figcaption>
</figure>

<figure style="text-align: center;">
    <img src="images/Tree_render.png" alt="Second tree design rendered by the project framework" height="170">
    <figcaption>Second tree design rendered by the project framework</figcaption>
</figure>

<figure style="text-align: center;">
    <img src="images/Tree_ytb_tuto.png" alt="Tree design in the YouTube tutorial" height="170">
    <figcaption>Tree design in the YouTube tutorial</figcaption>
</figure>

</div>

<div style="display: flex; justify-content: center; gap: 10px;">

<figure style="text-align: center;">
    <img src="images/bird_blender1.png" alt="Our bird mesh in Blender" height="170">
    <figcaption>Our bird mesh in Blender</figcaption>
</figure>

<figure style="text-align: center;">
    <img src="images/Bird_render.png" alt="Our bird design rendered by the project framework" height="170">
    <figcaption>Our bird design rendered by the project framework</figcaption>
</figure>

<figure style="text-align: center;">
    <img src="images/Bird_ytb_tuto.png" alt="Bird design in the YouTube tutorial" height="170">
    <figcaption>Bird design in the YouTube tutorial</figcaption>
</figure>

</div>

*Note: The above objects are not exhaustive of all the meshes we created.*


### Feature 2

#### Implementation

TODO

#### Validation

TODO


### Feature 3

#### Implementation

TODO

#### Validation

TODO


### Feature 4

#### Implementation

TODO

#### Validation

TODO


### Feature 5

#### Implementation

TODO

#### Validation

TODO


## Discussion

### Additional Components

TODO

### Failed Experiments

TODO

### Challenges

Our first big challenge to face was the implementation of a general trajectory for the boids. Our first step was to create 2 containment cylinders both centered at the origin and of different radiuses to have the birds fly around the origin in a circle. These were not actual cylinders but were checks on the distance of the birds. If a bird was too far from the origin (ie. "outside" of our large cylinder) we would push it back closer and conversely if a bird got too close to it. Then we thought to implement a more complex trajectory in the following way : using the angle the birds formed with the Z axis to locate the bird we applied some effects to it (ex. a force vector of (0, 0, 1) to make the bird "fly" up) but the results of this proved to be robotic and unnatural, not at all what we were wishing for in the beginning. We thus opted for another approach which was to place "cylinders" across our scene as these seemed to provide the best results as the boids would dodge the obstacles in a much more natural manner. We placed the cylinders on Geogebra and thus could easily represent what was happening in our scene. 
<div style="text-align: center;">
<img src="images/trajectory_on_ggb.png" height="300px">
<figcaption style="text-align: center;">The trajectory we implemented using Geogebra</figcaption>
</div>

Using our visualization we made on GGB, we then were able to manually place the pine trees inside/close to the cylinders we placed to give the illusion that the birds were dodging them which created the look we were going for. This proved to be quite challenging as the process of placing the trees was quite tedious and the existing code for the birds' trajectory had to be extensively modified (mainly the containment force which was fully reworked).  


## Contributions

<table>
	<caption>Worked hours</caption>
	<thead>
		<tr>
			<th>Name</th>
			<th>Week 1</th>
			<th>Week 2</th>
			<th>Week 3</th>
			<th>Week 4</th>
			<th>Week 5</th>
			<th>Week 6</th>
			<th>Week 7</th>
			<th>Total</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Ondrej</td>
			<td></td>
			<td style="background-color: #f0f0f0;"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>Marc</td>
			<td></td>
			<td style="background-color: #f0f0f0;"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
		<tr>
			<td>Clemens</td>
			<td></td>
			<td style="background-color: #f0f0f0;"></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
			<td></td>
		</tr>
	</tbody>
</table>

<table>
	<caption>Individual contributions</caption>
	<thead>
		<tr>
			<th>Name</th>
			<th>Contribution</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Ondrej</td>
			<td>1/3</td>
		</tr>
		<tr>
			<td>Marc</td>
			<td>1/3</td>
		</tr>
		<tr>
			<td>Clemens</td>
			<td>1/3</td>
		</tr>
	</tbody>
</table>


#### Comments

TODO


## References

[Example scene from the Lord of the Rings](youtube.com/watch?v=YH4Xr6GIp4U) from 1:22 to 1:35

[Bezier curves](https://www.shadertoy.com/view/XtBGDR)

[Boids explanation](https://en.wikipedia.org/wiki/Boids)

[Boids Algorithm](https://observablehq.com/@rreusser/gpgpu-boids)

[Normal mapping](https://lettier.github.io/3d-game-shaders-for-beginners/normal-mapping.html)

[Fog implementation](https://lettier.github.io/3d-game-shaders-for-beginners/fog.html)

[Bird design](https://www.youtube.com/watch?v=eSL98LLr1kw&list=WL&index=29)

[Pine tree](https://www.youtube.com/watch?v=mgJxH_Jc2DI)

[Low Poly](https://www.youtube.com/watch?v=hvxoAX_poI0)

[Rock blend](https://free3d.com/3d-model/low-poly-rock-4631.html)

[Free to use textures](https://polyhaven.com/)