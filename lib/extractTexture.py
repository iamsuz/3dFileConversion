import os
import bpy
import sys
import random
import string  # Import the string module for generating random names

# Get the file path from command-line arguments
model_file_path = sys.argv[-1]

# Enable the glTF 2.0 Addon
bpy.ops.preferences.addon_enable(module='io_scene_gltf2')

# Function to extract and save material textures


def extract_and_save_material_textures(material, input_filename, output_directory):
    # Check if the material has a node tree
    if material.node_tree:
        # Create a folder for each material under the input filename
        material_directory = os.path.join(
            output_directory, input_filename, material.name)
        os.makedirs(material_directory, exist_ok=True)

        # Loop through the nodes in the shader node tree
        for node in material.node_tree.nodes:
            # Check if the node is an Image Texture node
            if node.type == 'TEX_IMAGE':
                # Get the texture image
                texture_image = node.image

                # Extract the texture type (e.g., Base, Diffuse, Roughness)
                # Use node.label if it contains the texture type, or generate a random name
                texture_type = node.label if node.label else 'random_'+generate_random_name()

                # Define the output file path
                output_file = os.path.join(
                    material_directory, f'{texture_type}.png')
                # Save the texture image
                texture_image.save_render(output_file)


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

    # Loop through selected objects (assumes objects are meshes)
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            # Loop through material slots
            for slot in obj.material_slots:
                # Get the material
                material = slot.material
                # Check if a material exists
                if material:
                    # Extract and save material textures with their original names
                    extract_and_save_material_textures(
                        material, input_filename, output_directory)


# Example usage
input_file = model_file_path
output_directory = 'output_textures'
initialize(input_file, output_directory)
