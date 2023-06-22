import sys
import bpy

print(sys)

# Get the ZPRJ file path from the command-line arguments
zprj_file = sys.argv[-1]

# Load the ZPRJ file in Blender
bpy.ops.import_scene.x3d(filepath=zprj_file)

# Export the scene as glTF
gltf_file = zprj_file.replace('.zprj', '.gltf')
bpy.ops.export_scene.gltf(filepath=gltf_file)

# Quit Blender without UI
bpy.ops.wm.quit_blender()


# import bpy

# # Set the input and output file paths
# zprj_file = 
# gltf_file = '/path/to/output.gltf'

# # Clear the existing scene
# bpy.ops.wm.read_homefile(use_empty=True)

# # Import the ZPRJ file
# bpy.ops.import_scene.x3d(filepath=zprj_file)

# # Export the scene as glTF
# bpy.ops.export_scene.gltf(filepath=gltf_file)

# # Quit Blender without UI
# bpy.ops.wm.quit_blender()
