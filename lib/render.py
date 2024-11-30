import bpy
import os
import datetime
import math
import sys

# Clear existing scene data
bpy.ops.wm.read_factory_settings(use_empty=True)

# Get the file path from command-line arguments
model_file_path = sys.argv[-1]

print(model_file_path)

# Set up rendering parameters
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'

for obj in bpy.context.scene.objects:
    print(obj.name)

# Set rendering device to OptiX
scene.cycles.device = 'GPU'

# Enable all available GPU devices
for device in bpy.context.preferences.addons['cycles'].preferences.devices:
    if device.type == 'OPTIX':
        device.use = True
        print("OptiX device enabled")
    else:
        print("Not an OptiX device:", device.type)


# Set up lighting
bpy.ops.object.light_add(type='SUN', location=(2, 0, 0))
light = bpy.context.object
light.data.energy = 10
light.data.angle = 1.5708

# Function to convert Three.js camera rotation to Blender rotation


def convert_rotation(threejs_rotation):
    return (threejs_rotation[0], threejs_rotation[1], -threejs_rotation[2])


def convert_camera_location(threejs_location):
    # Convert from Three.js coordinates to Blender coordinates
    # Swap Y and Z coordinates and negate Y and Z
    print('location', threejs_location)
    return (threejs_location[0]+10, -threejs_location[2]+10, threejs_location[1]+10)

# Add camera with specified position and rotation


def add_camera(location, rotation):
    print(location, rotation)
    bpy.ops.object.camera_add(
        location=convert_camera_location(location), rotation=convert_rotation(rotation))
    camera = bpy.context.object
    scene.camera = camera

# Adjust camera settings based on frustum rectangle dimensions


def adjust_camera_settings(frustum_width, frustum_height):
    bpy.context.scene.camera.data.sensor_width = frustum_width
    bpy.context.scene.camera.data.sensor_height = frustum_height

# Add Track To constraint to make the camera always face the model


def add_track_to_constraint(target_name):
    track_to_constraint = bpy.context.object.constraints.new(type='TRACK_TO')
    track_to_constraint.target = bpy.data.objects[target_name]
    track_to_constraint.track_axis = 'TRACK_NEGATIVE_Z'
    track_to_constraint.up_axis = 'UP_Y'

# Set rendering output path


def set_render_output_path():
    now = datetime.datetime.now()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    output_path = "renderFinal_%s.png" % timestamp_str
    scene.render.filepath = output_path

# Set material viewport shading mode for rendering


def set_viewport_shading_mode():
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'MATERIAL'

# Render the scene


def render_scene():
    bpy.ops.render.render(write_still=True)

# Main function to setup and render scene


def main(camera_location, camera_rotation, frustum_width, frustum_height, target_name, file_path):
    # Import your 3D model
    model_file = file_path
    bpy.ops.import_scene.gltf(filepath=model_file)
    add_camera(camera_location, camera_rotation)
    adjust_camera_settings(frustum_width, frustum_height)
    add_track_to_constraint(target_name)
    set_render_output_path()
    set_viewport_shading_mode()
    render_scene()


def parse_vector(vector_str):
    # Split the string by commas and convert each part to a float
    return [float(x) for x in vector_str.split(",")]


if __name__ == "__main__":
    # Example usage: main((x, y, z), (rx, ry, rz), frustum_width, frustum_height, "target_name")
    # Get command-line arguments
    args = sys.argv[3:]
    print(args)
    # Remove the first argument (script filename)
    args.pop(0)
    print(args)
    # Parse camera location and rotation vectors
    camera_location_str = args[0]
    camera_rotation_str = args[1]
    file_path = args[2]
    print(camera_location_str, camera_rotation_str)
    camera_location = parse_vector(camera_location_str)
    camera_rotation = parse_vector(camera_rotation_str)
    target_name = bpy.context.scene.objects[0].name
    # Use the camera location and rotation in your script
    print("Camera Location:", camera_location)
    print("Camera Rotation:", camera_rotation)
    main((camera_location),
         (camera_rotation), 20, 20, target_name, file_path)
