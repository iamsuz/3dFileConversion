import bpy

# Set the path where you want to save the screenshot
output_path = "/path/to/save/screenshot.png"

# Set the resolution percentage (100% for original size)
resolution_percentage = 100

# Set the rendering engine to use (e.g., 'BLENDER_WORKBENCH', 'CYCLES')
render_engine = 'BLENDER_WORKBENCH'

# Set the display mode (e.g., 'WIREFRAME', 'SOLID', 'MATERIAL', 'RENDERED')
display_mode = 'SOLID'

# Set the file format (e.g., 'PNG', 'JPEG')
file_format = 'PNG'

# Set the compression quality for JPEG (0 to 100)
jpeg_quality = 90

# Set the frame to render (use -1 to render the current frame)
frame_to_render = -1

# Set the background color (R, G, B, A)
background_color = (1.0, 1.0, 1.0, 1.0)

# Set up rendering settings
bpy.context.scene.render.engine = render_engine
bpy.context.space_data.shading.type = display_mode
bpy.context.scene.render.image_settings.file_format = file_format
bpy.context.scene.render.image_settings.quality = jpeg_quality if file_format == 'JPEG' else 100

# Set resolution
bpy.context.scene.render.resolution_percentage = resolution_percentage

# Set background color
bpy.context.scene.view_settings.view_transform.display_settings.display_device = 'sRGB'
bpy.context.scene.view_settings.view_transform.display_settings.see_curve = background_color

# Render the frame
bpy.context.scene.frame_set(frame_to_render)
bpy.ops.render.opengl(write_still=True)

# Save the screenshot
bpy.data.images['Render Result'].save_render(output_path)
