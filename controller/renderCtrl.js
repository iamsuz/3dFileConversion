// const toGltf= require('../functions/fbxToGltf')
const convert = require('fbx2gltf');
const fs = require('fs')
const path = require('path')
// const { exec } = require('child_process');
const { spawn } = require('child_process');
const { getBuffer } = require('../functions/storage');
const { renderImage } = require('../functions/queueProducer');

const initialize = async (req, res) => {
    try {

        const objectKey = req.body.objectKey

        console.log(req.body)

        const fileBuffer = await getBuffer(objectKey);
        console.log({ fileBuffer });

        const t = objectKey.split('.');
        const extension = t[t.length - 1];

        const tempFilePath = path.join(__dirname, `../tmp/${req.body.gid}.${extension}`);

        // Ensure the directory exists, create it if necessary
        const directory = path.dirname(tempFilePath);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        fs.writeFileSync(tempFilePath, fileBuffer.content);
        console.log({ tempFilePath })
        await renderImage({
            filePath: tempFilePath,
            fileObjKey: objectKey,
            fileId: req.body.gid,
            outputLocation: `/output_render/${req.body.gid}`,
            extension: extension,
            e_name: req.body.ename,
            e_id: req.body.eid,
            reqId: req.body.request_id,
            color_body: req.body.locations,
            extraction: {
                render: true
            }
        })


        // Send the converted glTF file as a response
        // Assuming you want to send the compressedData as the response
        // await triggerFileUpload(`output_textures/${req.body.gid}`)
        res.status(200).json({
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'INTERNAL ERROR',
        });
    }
};


const withBlenderRender = async (req, res) => {
    try {
        console.log(req.body)

        const location = req.body

        // Define the command to execute the Blender Python script
        //if you have blender defined in your PATH variable then you can use
        // blender --background --python script.py --filename
        // const conversionScript = spawn('blender', ['-b','/app/lib/conversion.py', tempFilePath]);
        const blenderArgs = [
            '-b',                          // Run Blender in background mode
            '--python',                    // Execute Python script
            'lib/render.py',      // Path to the Python script
            location.camera_loc,                  // Path to the input file
            location.camera_rot
        ];

        const conversionScript = spawn('/Applications/Blender.app/Contents/MacOS/Blender', blenderArgs);

        // Capture the output from the Python script
        let compressedData = Buffer.from('');
        conversionScript.stdout.on('data', async (data) => {
            console.log({ data: data.toString(), compressedData })
            compressedData = Buffer.concat([compressedData, data]);
            const compressedFilePath = await fs.writeFile(path.join(__dirname, '../tmp/compressed_file.obj'), compressedData, function (err) {
                if (err) {
                    console.error(err)
                    console.log('Error while saving file')
                }
            });
            // await fs.writeFile(compressedFilePath, compressedData)
        });

        // Handle script completion
        return new Promise((resolve, reject) => {
            conversionScript.on('close', (code) => {
                console.log({ code })
                if (code === 0) {
                    // Compression completed successfully, read the output from the temporary file
                    // const compressedFilePath = path.join(__dirname, `../${fileInfo.image.gid}.gltf`);
                    // const compressedData = fs.readFileSync(compressedFilePath);
                    console.log({ compressedData })
                    // Delete the temporary files after reading the data
                    // fs.unlinkSync(tempFilePath);
                    // fs.unlinkSync(compressedFilePath);
                    console.log('Here is compression completed')
                    resolve('compressedData');
                } else {
                    reject(`Python script exited with code ${code}`);
                }
            });

            conversionScript.on('error', (err) => {
                reject(`Failed to start Python script: ${err}`);
            });

            conversionScript.on('exit', (code) => {
                if (code !== 0) {
                    reject(`Python script exited with code ${code}`);
                }
            });
        });

        // Assuming the output glTF file has the same name as the ZPRJ file but with a different extension
        // const gltfFile = zprjFile.path.replace('.zprj', '.gltf');

        // Send the converted glTF file as a response
        // res.sendFile();

    } catch (error) {
        console.error(error)
        return error
    }
}

module.exports = {
    withBlenderRender,
    initialize
}