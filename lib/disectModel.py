# Author awesomeguy

import os
import bpy
import sys
import random
import string  # Import the string module for generating random names
import json

# Get the file path from command-line arguments
model_file_path = sys.argv[-1]

# Enable the glTF 2.0 Addon
bpy.ops.preferences.addon_enable(module='io_scene_gltf2')


def initialize(input_file, output_directory):
    # Clear existing data
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Check if the input file exists
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file does not exist: {input_file}")

    # Extract the filename without extension
    input_filename = os.path.splitext(os.path.basename(input_file))[0]

    # Import the model based on the file format
    if input_file.lower().endswith('.gltf') or input_file.lower().endswith('.glb'):
        bpy.ops.import_scene.gltf(
            filepath=input_file, filter_glob='*.glb;*.gltf')
    elif input_file.lower().endswith('.fbx'):
        bpy.ops.import_scene.fbx(
            filepath=input_file)
    elif input_file.lower().endswith('.mtl'):
        bpy.ops.import_scene.mtl(
            filepath=input_file)
    elif input_file.lower().endswith('.obj'):
        bpy.ops.import_scene.obj(
            filepath=input_file)
    else:
        print(f"Unsupported file format: {input_file}")
        return

    mesh_data = []

    # Loop through selected objects (assumes objects are meshes)
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            vertices = len(obj.data.vertices)
            faces = len(obj.data.polygons)

            # Loop through material slots
            material_data = []
            for slot in obj.material_slots:
                # Get the material
                material = slot.material
                # Check if a material exists
                if material:
                    # Extract and save material textures with their original names
                    texture_info = extract_and_save_material_textures(
                        material, input_filename, output_directory, obj.name)
                    material_data.append({
                        "name": material.name,
                        "maps": texture_info
                    })

            # Add mesh data to the list
            mesh_data.append({
                "mesh_name": obj.name,
                "materials": material_data
            })

    return mesh_data


# Example usage
input_file = model_file_path
output_directory = 'output_textures'
mesh_info = initialize(input_file, output_directory)

output_json_name = os.path.splitext(os.path.basename(input_file))[0]


# Define the output file path
output_file_path = os.path.join(
    output_directory, output_json_name, f'{output_json_name}.json')

os.makedirs(os.path.dirname(output_file_path), exist_ok=True)

# Serialize and write the data to a JSON file
with open(output_file_path, 'w') as output_file:
    json.dump(mesh_info, output_file)


# Print or use the mesh information as needed
print(mesh_info)
