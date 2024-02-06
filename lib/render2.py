import bpy
import os
import math

# Clear existing scene data
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import your 3D model
model_file = "nylon.glb"
bpy.ops.import_scene.gltf(filepath=model_file)

# Set up rendering parameters
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.resolution_x = 2560
scene.render.resolution_y = 1440
scene.render.image_settings.file_format = 'PNG'

# Set up lighting
bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))

# Set up camera
cam_location = (0, -10, 5)
cam_rotation = (1.0472, 0, 0.7854)  # Euler angles in radians
bpy.ops.object.camera_add(location=cam_location, rotation=cam_rotation)
camera = bpy.context.object
scene.camera = camera

# Set camera field of view (FOV)
camera.data.angle = 0.9  # Adjust this value as needed to fit the entire model in frame

# Select the model object
model_name = "AND NS NYLONE TOTE VSO2_Scene_Node"
model_obj = bpy.data.objects.get(model_name)

if model_obj:
    # Position camera to focus on the model
    camera.location = (0, -10, 5)  # Adjust if necessary
    camera.rotation_euler = (1.0472, 0, 0.7854)  # Adjust if necessary

    # Add Track To constraint to make the camera always face the model
    track_to_constraint = camera.constraints.new(type='TRACK_TO')
    track_to_constraint.target = model_obj
    track_to_constraint.track_axis = 'TRACK_NEGATIVE_Z'
    track_to_constraint.up_axis = 'UP_Y'

    # Rotate camera 360 degrees in increments of 10 degrees and render picture
    for angle in range(0, 360, 10):
        camera.rotation_euler[2] = math.radians(angle)
        scene.render.filepath = "render_%03d.png" % angle
        bpy.ops.render.render(write_still=True)

else:
    print("Model object not found in scene.")
