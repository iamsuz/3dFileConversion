import os
import sys

# Set the environment variable to include the Blender Python path
# blender_python_path = "/usr/share/blender/scripts/modules"
# os.environ["PYTHONPATH"] = blender_python_path

# Now you can import Blender and NumPy
import bpy
import json

bpy.ops.preferences.addon_enable(module='io_scene_gltf2')

def initialize(input_file):
    print("Intialization started")
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Check if the input file exists
    if not os.path.exists(input_file):
        raise FileNotFoundError("Input file does not exist: {}".format(input_file))

    # Import the input file
    bpy.ops.import_scene.fbx(filepath=input_file)

    # Apply Decimate Modifier to all mesh objects
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_add(type='DECIMATE')
            bpy.context.object.modifiers["Decimate"].decimate_type = 'COLLAPSE'
            bpy.context.object.modifiers["Decimate"].ratio = 0.5
    
    # Switch the Decimate Modifier to Weighted Normal just before exporting
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            decimate_modifier = obj.modifiers.get('Decimate')
            if decimate_modifier:
                print("Removing Decimate Modifier and adding Weighted Normal for object:", obj.name)
                bpy.ops.object.modifier_remove(modifier=decimate_modifier.name)
                obj.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')

    return input_file
