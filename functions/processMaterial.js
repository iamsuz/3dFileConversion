const { spawn } = require('child_process');
// const Flydrive = require('flydrive');

// Define paths and variables
const blenderExecutable = '/Applications/Blender.app/Contents/MacOS/Blender'; // Path to Blender executable
const blendFile = 'toteBag.glb'; // Path to your Blender file
const s3Bucket = 'virtu'; // S3 Bucket name
const s3Folder = 'textures'; // Folder in S3 where textures will be uploaded

// Spawn a child process to run Blender
const blenderProcess = spawn(blenderExecutable, ['-b', '-P', '../lib/extractTexture.py', blendFile]);

let currentMaterialName = '';
// let flydrive = new Flydrive();

blenderProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
        if (line.startsWith('MATERIAL_LIST:')) {
            // Send a command to start processing materials
            blenderProcess.stdin.write('PROCESS_NEXT_MATERIAL\n');
        } else if (line.startsWith('MATERIAL_NAME:')) {
            currentMaterialName = line.substring(14);
        } else if (line === 'READY_FOR_NEXT_MATERIAL') {
            // Process the next material if available
            blenderProcess.stdin.write('PROCESS_NEXT_MATERIAL\n');
        } else if (line === 'PROCESS_ALL_MATERIALS') {
            // All materials processed, close the Blender process
            blenderProcess.stdin.end();
        } else if (line.startsWith('{')) {
            // Handle JSON data containing material info and image data
            const materialData = JSON.parse(line);
            processMaterialData(materialData);
        }
    }
});

// Function to process material data
async function processMaterialData(materialData) {
    console.log(`Processing material: ${materialData.material_name}`);

    // Loop through image data for this material
    for (const imageData of materialData.image_data) {
        const imageName = imageData.name;
        const imageDataBase64 = imageData.data;
        const imageBuffer = Buffer.from(imageDataBase64, 'base64');
        console.log(imageBuffer)
        // Upload the image to S3
        // await uploadToS3(imageName, imageBuffer);

        console.log(`Uploaded ${imageName} to S3`);
    }
}

// Function to upload image to S3
// async function uploadToS3(imageName, imageBuffer) {
//     try {
//         await flydrive.disk(s3Folder).put(imageName, imageBuffer);
//     } catch (error) {
//         console.error(`Error uploading ${imageName} to S3: ${error.message}`);
//     }
// }

// Send a command to start processing materials
blenderProcess.stdin.write('SEND_MATERIAL_LIST\n');

// Handle process exit
blenderProcess.on('close', (code) => {
    if (code === 0) {
        console.log('Blender script executed successfully.');
    } else {
        console.error(`Blender script exited with code ${code}`);
    }
});