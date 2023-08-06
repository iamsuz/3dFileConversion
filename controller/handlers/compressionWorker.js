const storageFunc = require("../../functions/storage");
const { v4: uuid } = require('uuid');
const { spawn } = require('child_process');
const fs = require('fs')
const path = require('path')

async function compressWithQuadricError(fileInfo) {
    try {
        // Create a temporary file to store the input buffer
        console.log({fileInfo})
        const inputFileName = fileInfo.image.gid+'.'+fileInfo.image.extension
        const tempFilePath = path.join(__dirname,'/tmp', inputFileName);
        fs.writeFileSync(tempFilePath, fileInfo.content);

        const oFilePath = 'output_file'+fileInfo.image.extension

        const outputFilePath = path.join('/tmp', oFilePath)

        // Call the Python script with the temporary file path as an argument
        const pythonScript = spawn('python3', ['/app/compression/qem.py', tempFilePath]);

        // Capture the output from the Python script
        let compressedData = Buffer.from('');
        pythonScript.stdout.on('data', async (data) => {
            console.log({data, compressedData})
            compressedData = Buffer.concat([compressedData, data]);
            const compressedFilePath = await fs.writeFile(path.join(__dirname, '/tmp/compressed_file.obj'), compressedData, function(err){
                if(err){
                    console.error(err)
                    console.log('Error while saving file')
                }
            });
            // await fs.writeFile(compressedFilePath, compressedData)
        });

        // Handle script completion
        return new Promise((resolve, reject) => {
            pythonScript.on('close', (code) => {
                console.log({code})
                if (code === 0) {
                    // Compression completed successfully, read the output from the temporary file
                    const compressedFilePath = path.join(__dirname, `../${fileInfo.image.gid}.obj`);
                    const compressedData = fs.readFileSync(compressedFilePath);
                    console.log({compressedData})
                    // Delete the temporary files after reading the data
                    // fs.unlinkSync(tempFilePath);
                    // fs.unlinkSync(compressedFilePath);
                    console.log('Here is compression completed')
                    resolve('compressedData');
                } else {
                    reject(`Python script exited with code ${code}`);
                }
            });

            pythonScript.on('error', (err) => {
                reject(`Failed to start Python script: ${err}`);
            });

            pythonScript.on('exit', (code) => {
                if (code !== 0) {
                    reject(`Python script exited with code ${code}`);
                }
            });
        });
    } catch (error) {
        console.error('Error during compression:', error);
        throw error;
    }
}