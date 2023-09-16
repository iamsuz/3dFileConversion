const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const axios = require('axios')
const { getBuffer } = require('../functions/storage');

const initialize = async (req, res) => {
    try {
        // Initialize a 3d file and return the object
        console.log(req.query)
        // Assuming the ZPRJ file is uploaded via multipart/form-data
        // const file = req.files.toconvert;

        /**
         * Get the object key from the API
         */
        const { data } = await axios.get('http://127.0.0.1:3016/api/v1/object-key', {
            params: {
                gid: req.query.obj_id
            }
        })
        // const objectKey = req.body.object_key
        console.log({ data })
        const fileBuffer = await getBuffer(data.objectKey)
        console.log({ fileBuffer })

        //Get the extension
        const t = data.objectKey.split('.')
        const extension = t[t.length - 1]

        // Write the file content to a temporary file

        const tempFilePath = path.join(__dirname, `../tmp/${req.query.obj_id}.${extension}`);
        fs.writeFileSync(tempFilePath, fileBuffer.content);

        // Define the command to execute the Blender Python script
        //if you have blender defined in your PATH variable then you can use
        // blender --background --python script.py --filename
        // const conversionScript = spawn('blender', ['-b','/app/lib/conversion.py', tempFilePath]);
        const blenderArgs = [
            '-b',                          // Run Blender in background mode
            '--python',                    // Execute Python script
            'lib/initialize.py',      // Path to the Python script
            tempFilePath,                  // Path to the input file
        ];

        const conversionScript = spawn('/Applications/Blender.app/Contents/MacOS/Blender', blenderArgs);

        // Capture the output from the Python script
        let compressedData = Buffer.from('');
        conversionScript.stdout.on('data', async (data) => {
            console.log({ data, compressedData })
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
                    const compressedFilePath = path.join(__dirname, `../${fileInfo.image.gid}.gltf`);
                    const compressedData = fs.readFileSync(compressedFilePath);
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



        // Send the converted glTF file as a response
        res.sendFile(gltfFile);
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: 'INTERNAL ERROR'
        })
    }
}


const withBlender = async (req, res) => {
    try {

        console.log(req.files)
        // Assuming the ZPRJ file is uploaded via multipart/form-data
        const file = req.files.toconvert;
        const objectKey = req.body.object_key
        // console.log(file)
        const fileBuffer = await getBuffer(objectKey)
        // const toConvertFileContent = req.files.toconvert.data
        // Write the file content to a temporary file
        const tempFilePath = './temp.fbx';
        fs.writeFileSync(tempFilePath, fileBuffer);

        // Define the command to execute the Blender Python script
        //if you have blender defined in your PATH variable then you can use
        // blender --background --python script.py --filename
        // const conversionScript = spawn('blender', ['-b','/app/lib/conversion.py', tempFilePath]);
        const blenderArgs = [
            '-b',                          // Run Blender in background mode
            '--python',                    // Execute Python script
            'lib/initialize.py',      // Path to the Python script
            tempFilePath,                  // Path to the input file
        ];

        const conversionScript = spawn('/Applications/Blender.app/Contents/MacOS/Blender', blenderArgs);

        // Capture the output from the Python script
        let compressedData = Buffer.from('');
        conversionScript.stdout.on('data', async (data) => {
            console.log({ data, compressedData })
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
                    const compressedFilePath = path.join(__dirname, `../${fileInfo.image.gid}.gltf`);
                    const compressedData = fs.readFileSync(compressedFilePath);
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
        const gltfFile = zprjFile.path.replace('.zprj', '.gltf');

        // Send the converted glTF file as a response
        res.sendFile(gltfFile);

    } catch (error) {
        console.error(error)
        return error
    }
}


module.exports = {
    initialize
}