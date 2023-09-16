import os
import bpy

# Enable the glTF 2.0 addon
bpy.ops.preferences.addon_enable(module='io_scene_gltf2')


def extract_material_textures(material):
    texture_images = []

    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE':
            texture_images.append({
                "image": node.image,
                "name": node.label
            })

    return texture_images


def save_texture_images(material_textures, output_directory):
    for material_name, texture_images in material_textures.items():
        material_dir = os.path.join(output_directory, material_name)
        os.makedirs(material_dir, exist_ok=True)
        # print(texture_images)
        for idx, texture_image in enumerate(texture_images):
            print(texture_image['name'])
            output_file = os.path.join(
                material_dir, f'{texture_image["name"]}.png')
            texture_image['image'].save_render(output_file)


def initialize(input_file, output_directory):
    # Clear existing data to prevent conflicts
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Check if the input file exists
    if not os.path.exists(input_file):
        raise FileNotFoundError(
            "Input file does not exist: {}".format(input_file))

    # Import the glTF file
    bpy.ops.import_scene.gltf(filepath=input_file, filter_glob='*.glb;*.gltf')

    material_textures = {}

    # Loop through selected objects
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            # Loop through material slots
            for slot in obj.material_slots:
                material = slot.material
                if material:
                    # Extract material textures
                    texture_images = extract_material_textures(material)

                    # Store material textures in a dictionary
                    material_textures[material.name] = texture_images

    # Save the texture images
    save_texture_images(material_textures, output_directory)


# Example usage
initialize('toteBag.glb', 'output_textures')
