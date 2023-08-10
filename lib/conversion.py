import os
import sys

# Set the environment variable to include the Blender Python path
# blender_python_path = "/usr/share/blender/scripts/modules"
# os.environ["PYTHONPATH"] = blender_python_path

# Now you can import Blender and NumPy
import bpy
import json
bpy.ops.preferences.addon_enable(module='io_scene_gltf2')

def convert_and_compress_fbx(input_file):
    # Clear existing data to prevent conflicts
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Check if the input file exists
    if not os.path.exists(input_file):
        raise FileNotFoundError("Input file does not exist: {}".format(input_file))

    # Import the GLTF file
    bpy.ops.import_scene.fbx(filepath=input_file)

    # Apply Decimate Modifier to all mesh objects
    for obj in bpy.context.scene.objects:
        # object_dict = vars(obj)
        # object_json = json.dumps(obj, indent=4)  # Convert to JSON-like format with indentation
        # print("Object details:\n", object_json)
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj  # Set the active object
            bpy.ops.object.modifier_add(type='DECIMATE')  # Add the Decimate Modifier
            bpy.context.object.modifiers["Decimate"].decimate_type = 'COLLAPSE'  # Set decimation type
            bpy.context.object.modifiers["Decimate"].ratio = 0.5  # Set the ratio
    
    # Switch the Decimate Modifier to Weighted Normal just before exporting
    # Switch the Decimate Modifier to Weighted Normal just before exporting
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            decimate_modifier = obj.modifiers.get('Decimate')  # Use 'Decimate' instead of 'DECIMATE'
            if decimate_modifier:
                print("Removing Decimate Modifier and adding Weighted Normal for object:", obj.name)
                bpy.ops.object.modifier_remove(modifier=decimate_modifier.name)
                obj.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')


    # Create the output file path with ".gltf" extension
    output_file = os.path.splitext(input_file)[0] + "_output.fbx"
    # Export the GLTF file with compression
    bpy.ops.export_scene.fbx(filepath=output_file, embed_textures=True, path_mode="COPY")

    # Optional: Delete temporary objects created during conversion
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Optional: Quit Blender (useful in background mode)
    bpy.ops.wm.quit_blender()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py input_file")
    else:
        # input_file_path = sys.argv[1]
        convert_and_compress_fbx('wash_bucket.fbx')
