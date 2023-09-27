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

# Function to extract and save material textures


def extract_and_save_material_textures(material, input_filename, output_directory, mesh_name):
    texture_info = []

    # Check if the material has a node tree
    if material.node_tree:
        # Create a folder for each material under the input filename
        material_directory = os.path.join(
            output_directory, input_filename, mesh_name, material.name)

        os.makedirs(material_directory, exist_ok=True)

        # Loop through the nodes in the shader node tree
        for node in material.node_tree.nodes:
            # Check if the node is an Image Texture node
            if node.type == 'TEX_IMAGE':
                # Get the texture image
                texture_image = node.image

                # Extract the texture type (e.g., Base, Diffuse, Roughness)
                # Use node.label if it contains the texture type, or generate a random name
                texture_type = node.label if hasattr(
                    node, 'label') and node.label else 'random_'+generate_random_name()

                # Define the output file path
                output_file = os.path.join(
                    material_directory, f'{texture_type}.png')

                # Save the texture image
                texture_image.save_render(output_file)

                # Check if UV orientation is available
                uv_orientation = node.uv_map if hasattr(
                    node, 'uv_map') else None

                # Check if UV scale is available
                uv_scale = node.scale if hasattr(node, 'scale') else None

                # Check if color space is available
                color_space = node.image.colorspace_settings.name if hasattr(
                    node.image, 'colorspace_settings') else None

                # Check if roughness factor is available (assuming it's a Principled BSDF node)
                roughness_factor = node.principled_bsdf.inputs['Roughness'].default_value if hasattr(
                    node, 'principled_bsdf') else None

                # Check if normal map strength is available (assuming it's a Principled BSDF node)
                normal_map_strength = node.principled_bsdf.inputs['Normal'].default_value if hasattr(
                    node, 'principled_bsdf') else None

                # Check if mapping details are available
                mapping_location = node.location if hasattr(
                    node, 'location') else None
                mapping_rotation = node.rotation_euler if hasattr(
                    node, 'rotation_euler') else None
                mapping_scale = node.scale if hasattr(node, 'scale') else None

                # Create a dictionary for texture information
                texture_info.append({
                    "type": texture_type,
                    "uv_orientation": [uv_orientation.x if uv_orientation else 0, uv_orientation.y if uv_orientation else 0, uv_orientation.z if hasattr(uv_orientation, 'z') else 0],
                    "uv_scale": [uv_scale.x if uv_scale else 0, uv_scale.y if uv_scale else 0, uv_scale.z if hasattr(uv_scale, 'z') else 0],
                    "color_space": color_space,
                    "roughness_factor": roughness_factor,
                    "normal_map_strength": normal_map_strength,
                    "mapping_location": [mapping_location.x if mapping_location else 0, mapping_location.y if mapping_location else 0, mapping_location.z if hasattr(mapping_location, 'z') else 0],
                    "mapping_rotation": [mapping_rotation.x if mapping_rotation else 0, mapping_rotation.y if mapping_rotation else 0, mapping_rotation.z if hasattr(mapping_rotation, 'z') else 0],
                    "mapping_scale": [mapping_scale.x if mapping_scale else 0, mapping_scale.y if mapping_scale else 0, mapping_scale.z if hasattr(mapping_scale, 'z') else 0]
                })

    return texture_info

# Function to generate a random name for textures


def generate_random_name():
    return ''.join(random.choice(string.ascii_letters) for _ in range(8))

# Function to initialize the script


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
