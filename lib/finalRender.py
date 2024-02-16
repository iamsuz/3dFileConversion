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
light.data.energy = 10
light.data.angle = 1.5708

# Original camera location and rotation (replace with extracted values from Three.js)
cam_location = (1.6, 3.6, 2.2)
cam_rotation = (-0.07, 0.65, 0.06)

# Add camera with extracted position and rotation
bpy.ops.object.camera_add(location=cam_location, rotation=cam_rotation)
camera = bpy.context.object
scene.camera = camera

# Add Track To constraint to make the camera always face the model
track_to_constraint = camera.constraints.new(type='TRACK_TO')
track_to_constraint.target = bpy.data.objects["Graphic tote bag BG6970298SK-3_Scene_Node"]
track_to_constraint.track_axis = 'TRACK_NEGATIVE_Z'
track_to_constraint.up_axis = 'UP_Y'

# Adjust camera settings based on frustum rectangle dimensions (replace with extracted values from Three.js)
# Example value, replace with actual frustum rectangle dimensions
camera.data.sensor_width = 3.2
# Example value, replace with actual frustum rectangle dimensions
camera.data.sensor_height = 1.8

# Set rendering output path
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
