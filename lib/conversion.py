import os
import sys

# Set the environment variable to include the Blender Python path
# blender_python_path = "/usr/share/blender/scripts/modules"
# os.environ["PYTHONPATH"] = blender_python_path

# Now you can import Blender and NumPy
import bpy

bpy.ops.preferences.addon_enable(module='io_scene_gltf2')

def convert_and_compress_fbx(input_file):
    # Clear existing data to prevent conflicts
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Check if the input file exists
    if not os.path.exists(input_file):
        raise FileNotFoundError("Input file does not exist: {}".format(input_file))

    # Import the GLTF file
    bpy.ops.import_scene.fbx(filepath='temp.fbx')

    # Create the output file path with ".gltf" extension
    output_file = os.path.splitext(input_file)[0] + ".glb"

    # Export the GLTF file with compression
    bpy.ops.export_scene.gltf(filepath=output_file, export_format='GLB', export_image_format='AUTO', export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=3)

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
        convert_and_compress_fbx('temp.fbx')
