import bpy
import os
import datetime
import math

# Clear existing scene data
bpy.ops.wm.read_factory_settings(use_empty=True)

# Set up rendering parameters
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'

# Set rendering device to OptiX
scene.cycles.device = 'GPU'

bpy.context.scene.cycles.device = 'GPU'


# Enable all available GPU devices
for device in bpy.context.preferences.addons['cycles'].preferences.devices:
    if device.type == 'OPTIX':
        device.use = True
        print("OptiX device enabled")
    else:
        print("Not an OptiX device:", device.type)

# Import your 3D model
model_file = "graphicToteBag.glb"
bpy.ops.import_scene.gltf(filepath=model_file)

# Set up lighting
bpy.ops.object.light_add(type='SUN', location=(2, 0, 0))
light = bpy.context.object

bpy.context.object.data.energy = 10
bpy.context.object.data.angle = 1.5708


# Original camera location and rotation
cam_location = (1.5129325819153836, 2.33690597530268037, -0.956333432588234)
# Adjust rotation for side angle (rotate around Z-axis by 90 degrees)
cam_rotation = (0, 0,  0)

bpy.ops.object.camera_add(location=cam_location, rotation=cam_rotation)

camera = bpy.context.object
scene.camera = camera

for obj in bpy.context.scene.objects:
    print(obj.name)

# Add Track To constraint to make the camera always face the model
track_to_constraint = camera.constraints.new(type='TRACK_TO')
track_to_constraint.target = bpy.data.objects["Graphic tote bag BG6970298SK-3_Scene_Node"]
track_to_constraint.track_axis = 'TRACK_NEGATIVE_Z'
track_to_constraint.up_axis = 'UP_Y'

now = datetime.datetime.now()
timestamp_str = now.strftime("%Y%m%d_%H%M%S")
output_path = "renderFinal_%s.png" % timestamp_str
scene.render.filepath = output_path

# Set material viewport shading mode for rendering
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'

# Render the scene
bpy.ops.render.render(write_still=True)
