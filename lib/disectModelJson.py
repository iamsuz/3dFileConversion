import bpy
import json
import sys
import os

mesh_data = []

# Get the file path from command-line arguments
model_file_path = sys.argv[-1]


def initialize(input_file):
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


for obj in bpy.context.selected_objects:
    if obj.type == 'MESH':
        mesh_info = {
            "name": obj.name,
            "vertices": [(v.co.x, v.co.y, v.co.z) for v in obj.data.vertices],
            "faces": [list(f.vertices) for f in obj.data.polygons],
            "uv_coordinates": [(uv.x, uv.y) for uv in obj.data.uv_layers.active.data]
        }

        # Extract material information for the mesh
        materials = []
        for slot in obj.material_slots:
            material = slot.material
            if material:
                material_info = {
                    "name": material.name,
                    "color": (material.diffuse_color.r, material.diffuse_color.g, material.diffuse_color.b),
                    # Add more material properties as needed
                }
                materials.append(material_info)

        mesh_info["materials"] = materials

        mesh_data.append(mesh_info)


# Create a JSON object from mesh_data
data_to_export = {"meshes": mesh_data}

# Example usage
input_file = model_file_path
output_directory = 'output_textures'
mesh_info = initialize(input_file, output_directory)

# Export the data to a JSON file
output_file_path = '/tmp/output.json'
with open(output_file_path, 'w') as output_file:
    json.dump(data_to_export, output_file)
