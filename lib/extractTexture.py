import os
import bpy

# Enable the glTF 2.0 Addon
bpy.ops.preferences.addon_enable(module='io_scene_gltf2')

# Function to extract and save material textures


def extract_and_save_material_textures(material, output_directory):
    # Check if the material has a node tree
    if material.node_tree:
        # Loop through the nodes in the shader node tree
        for node in material.node_tree.nodes:
            # Check if the node is an Image Texture node
            if node.type == 'TEX_IMAGE':
                # Get the texture image
                texture_image = node.image
                # Extract the texture type (e.g., Base, Diffuse, Roughness)
                texture_type = node.label  # Use node.label if it contains the texture type
                # Define the output file path
                output_file = os.path.join(
                    output_directory, f'{texture_type}.png')
                # Save the texture image
                texture_image.save_render(output_file)

# Function to initialize the script


def initialize(input_file, output_directory):
    # Clear existing data
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Check if the input file exists
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Input file does not exist: {input_file}")

    # Import the glTF 2.0 model
    bpy.ops.import_scene.gltf(filepath=input_file, filter_glob='*.glb;*.gltf')

    # Loop through selected objects (assumes objects are meshes)
    for obj in bpy.context.selected_objects:
        # Loop through material slots
        for slot in obj.material_slots:
            # Get the material
            material = slot.material
            # Check if a material exists
            if material:
                # Extract and save material textures with their original names
                extract_and_save_material_textures(material, output_directory)


# Example usage
input_file = 'your_model.glb'
output_directory = 'output_textures'
initialize(input_file, output_directory)
