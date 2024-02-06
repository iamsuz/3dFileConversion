import bpy
import os

# Clear existing scene data
bpy.ops.wm.read_factory_settings(use_empty=True)

# Set up rendering parameters
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'

# Import your 3D model
model_file = "newToteBag.glb"
bpy.ops.import_scene.gltf(filepath=model_file)

# Set up lighting
bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
light = bpy.context.object

# Set up camera
cam_location = (0, -10, 5)
# Euler angles in radians (60 degrees and 45 degrees)
cam_rotation = (1.0472, 0, 0.7854)
bpy.ops.object.camera_add(location=cam_location, rotation=cam_rotation)
camera = bpy.context.object
scene.camera = camera

# Set up output path
output_path = "render1.png"
scene.render.filepath = output_path

for obj in bpy.context.scene.objects:
    print(obj.name)

# Select the model object
model_name = "UT BUCKET TOTE NATURAL _Scene_Node"

if model_name in bpy.context.scene.objects:
    bpy.context.view_layer.objects.active = bpy.context.scene.objects[model_name]
    bpy.context.object.select_set(True)
else:
    print("Model object not found in scene.")

# Render the scene
bpy.ops.render.render(write_still=True)

# Optionally, close Blender after rendering
# bpy.ops.wm.quit_blender()
