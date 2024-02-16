import bpy
import os
import datetime

# Clear existing scene data
bpy.ops.wm.read_factory_settings(use_empty=True)

# Set up rendering parameters
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.image_settings.file_format = 'PNG'

# Import your 3D model
model_file = "graphicToteBag.glb"
bpy.ops.import_scene.gltf(filepath=model_file)

# Create a new world if one does not exist
if scene.world is None:
    bpy.data.worlds.new(name="World")

# Set up HDR environment texture
world = bpy.context.scene.world
if world is not None:
    world.use_nodes = True

    # Clear existing nodes
    for node in world.node_tree.nodes:
        world.node_tree.nodes.remove(node)

    # Create nodes
    bg_node = world.node_tree.nodes.new(type='ShaderNodeTexEnvironment')
    # Update with your HDR image filepath
    bg_node.image = bpy.data.images.load("bgHDR.jpg")

    output_node = world.node_tree.nodes.new(type='ShaderNodeOutputWorld')

    # Link nodes
    world.node_tree.links.new(
        bg_node.outputs['Color'], output_node.inputs['Surface'])

# Add a light source (sun lamp)
bpy.ops.object.light_add(type='SUN', location=(2, 0, 0))

bpy.context.object.data.energy = 10
bpy.context.object.data.angle = 1.5708

# Original camera location and rotation
cam_location = (0, -2.5, 2)
# Adjust rotation for side angle (rotate around Z-axis by 90 degrees)
cam_rotation = (0, 0,  0)

bpy.ops.object.camera_add(location=cam_location, rotation=cam_rotation)

camera = bpy.context.object
scene.camera = camera

# Add Track To constraint to make the camera always face the model
track_to_constraint = camera.constraints.new(type='TRACK_TO')
track_to_constraint.target = bpy.data.objects["Graphic tote bag BG6970298SK-3_Scene_Node"]
track_to_constraint.track_axis = 'TRACK_NEGATIVE_Z'
track_to_constraint.up_axis = 'UP_Y'

now = datetime.datetime.now()
timestamp_str = now.strftime("%Y%m%d_%H%M%S")
output_path = "renderFinal_%s.png" % timestamp_str
scene.render.filepath = output_path


# Select the model object
model_name = "Graphic tote bag BG6970298SK-3_Scene_Node"
if model_name in bpy.context.scene.objects:
    model_obj = bpy.data.objects[model_name]
    model_obj.select_set(True)
    bpy.context.view_layer.objects.active = model_obj
else:
    print("Model object not found in scene.")

# Set material viewport shading mode for rendering
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        for space in area.spaces:
            if space.type == 'VIEW_3D':
                space.shading.type = 'MATERIAL'

# Render the scene
bpy.ops.render.render(write_still=True)
