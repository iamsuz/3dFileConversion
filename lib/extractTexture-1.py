import bpy
import json
import base64
import sys
import os

# Get the file path from command-line arguments
model_file = sys.argv[-1]

# Clear existing data to prevent conflicts
bpy.ops.wm.read_factory_settings(use_empty=True)

# Check if the input file exists
if not os.path.exists(model_file):
    raise FileNotFoundError("Input file does not exist: {}".format(model_file))

# Import the 3D model based on its file type (e.g., glTF/glb, FBX, etc.)
if model_file.lower().endswith('.glb') or model_file.lower().endswith('.gltf'):
    bpy.ops.import_scene.gltf(filepath=model_file, filter_glob='*.glb;*.gltf')
elif model_file.lower().endswith('.fbx'):
    bpy.ops.import_scene.fbx(filepath=model_file)


def extract_material_textures(material):
    texture_images = []

    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE':
            texture_images.append({
                "image": node.image,
                "name": node.label
            })

    return texture_images


def process_one_material(material_name):
    material = bpy.data.materials.get(material_name)
    if material:
        texture_images = extract_material_textures(material)
        image_data = []

        for idx, texture_image in enumerate(texture_images):
            image_binary = bpy.data.images[texture_image['image'].name].pixels[:]
            image_base64 = base64.b64encode(image_binary).decode('utf-8')
            image_data.append({
                'name': texture_image['name'],
                'data': image_base64
            })

        # Print the image data as JSON for this material
        print(json.dumps({
            'material_name': material_name,
            'image_data': image_data
        }))
        # Print a signal to indicate that this material is processed
        print('READY_FOR_NEXT_MATERIAL')

# Function to send the list of materials


def send_material_list():
    materials = []
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH':
            # Loop through material slots
            for slot in obj.material_slots:
                material = slot.material
                if material:
                    materials.append(material.name)
    print(f"MATERIAL_LIST:{json.dumps(materials)}")


# Read commands from the standard input
while True:
    line = input()  # Read a line from the standard input
    if line == 'PROCESS_NEXT_MATERIAL':
        material_name = input()  # Read the name of the material to process
        process_one_material(material_name)
    elif line == 'SEND_MATERIAL_LIST':
        send_material_list()
    elif line == 'PROCESS_ALL_MATERIALS':
        # All materials processed, exit the script
        break
