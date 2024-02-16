import math
import bpy
import os
import datetime

# Clear existing scene data
bpy.ops.wm.read_factory_settings(use_empty=True)

# Set up rendering parameters
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'

# Import your 3D model
model_file = "graphicToteBag.glb"
bpy.ops.import_scene.gltf(filepath=model_file)

# Set up lighting
bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
light = bpy.context.object

# {
#     "position": {
#         "x": 0.33794528237203536,
#         "y": -0.13159819659175015,
#         "z": 1.8909843790318928
#     },
#     "rotation": {
#         "isEuler": true,
#         "_x": -0.13367768770924784,
#         "_y": 0.19827575041341453,
#         "_z": 0.026483500996224645,
#         "_order": "XYZ"
#     },
#     "scale": {
#         "x": 1,
#         "y": 1,
#         "z": 1
#     }
# }

# {x: 0, y: 3.758862498437993e-16, z: 6.138688315774082}
# _x
# :
# -6.123233995736766e-17
# _y
# :
# 0
# _z
# :
# 0

# Set up camera
# cam_location = (0, 6.758862498437993e-16, 2.138688315774082)

# # Euler angles in radians (60 degrees and 45 degrees)
# cam_rotation = (-6.123233995736766e-17,
#                 0.1, 0.1)


# Original camera location and rotation
cam_location = (0, 6.758862498437993e-16, 2.138688315774082)
cam_rotation = (-6.123233995736766e-17, 0.1, 0.1)

# Calculate original camera direction vector
direction_vector = (math.cos(cam_rotation[1]) * math.cos(cam_rotation[2]),
                    math.sin(cam_rotation[1]) * math.cos(cam_rotation[2]),
                    math.sin(cam_rotation[2]))

# Apply rotation of 45 degrees around Z-axis
rotation_angle = math.radians(15)
new_direction_vector = (math.cos(rotation_angle) * direction_vector[0] - math.sin(rotation_angle) * direction_vector[1],
                        math.sin(
                            rotation_angle) * direction_vector[0] + math.cos(rotation_angle) * direction_vector[1],
                        direction_vector[2])

# Calculate new rotation angles from the new direction vector
new_cam_rotation = (0, math.atan2(
    new_direction_vector[1], new_direction_vector[0]), math.asin(new_direction_vector[2]))


bpy.ops.object.camera_add(location=cam_location, rotation=new_cam_rotation)
# bpy.ops.object.camera_add(enter_editmode=False, align='VIEW', location=cam_location, rotation=(
# 1.4997, 0.014534, -0.0475604), scale=(1, 1, 1))

camera = bpy.context.object
scene.camera = camera

now = datetime.datetime.now()

timestamp_str = now.strftime("%Y%m%d_%H%M%S")
# "render_%03d.png" % angle
# Set up output path
# output_path = "renderFinal_%03d.png" % now
output_path = "renderFinal_%s.png" % timestamp_str
scene.render.filepath = output_path

# Print names of all objects in the scene for debugging
for obj in bpy.context.scene.objects:
    print(obj.name)

# Select the model object
model_name = "Graphic tote bag BG6970298SK-3_Scene_Node"

if model_name in bpy.context.scene.objects:
    model_obj = bpy.data.objects[model_name]
    model_obj.select_set(True)
    bpy.context.view_layer.objects.active = model_obj
else:
    print("Model object not found in scene.")

# Set material viewport shading mode for rendering
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'

# Render the scene
bpy.ops.render.render(write_still=True)

# Optionally, close Blender after rendering
# bpy.ops.wm.quit_blender()
