const storageFunc = require("../../functions/storage");
const { v4: uuid } = require('uuid');
const { spawn } = require('child_process');
const fs = require('fs')
const path = require('path')

exports.conversionHandler = async (job) =>{

    try{
        /**
         * This worker handler will only work for the file compression from the library_files or the files entity
         * Other than it will return false
         */
        if(job.data.entity !== 'library_files' && job.data.entity !== 'files') { return false }

        console.log("Starting job:", job.name);

        /**
         * Get the correct object key of the file to access the file from the storage
         */
        let objectKey = job.data.image.object_key

    
        /**
         * Get the buffer of the stored file
         */
        const fileBuffer = await storageFunc.getBuffer(objectKey)



        const fileInfo = {
            content: fileBuffer.content,
            image: job.data.image
        }
        /**
         * Call the compression algorithm on the file 
         * Store the returned buffer by the compreession back in to the storage
         * save the information in to the compress entity
         */

        // const gltf = await dracoGltf(fileBuffer.content, 7);

        // Call the function and get the compressed data
        await convertFile(fileInfo, (error, compressed_data) => {
            if (error) {
                console.error('Compression error:', error);
            } else {
                // Process the compressed data as needed (e.g., write to a file or use it in your application)
                console.log('Compressed data:', compressed_data.toString());
            }
        });

        console.log("Compression completed.");

        console.log(job);
        console.log("Finished job:", job.name);

        // return true;
    // } else {
    //     console.log("Error during compression.");
    //     // return false;
    // }
    
    // const newBuff = new Buffer.from(JSON.stringify(gltf));
    // console.log(newBuff)
    /**
     * Add the new file to the storage and store in the DB
     * To store at a location take the object key and add the compressed information and store
     */
        let newGid = uuid()
        
        let tempKey = job.data.image.object_key.split('/')
        tempKey.pop()
        tempKey.push('compression')
        tempKey.push('draco')
        tempKey.push(newGid+'.gltf')
        const compressedObjKey = tempKey.join('/')

    /**
     * Upload a file to the storage with new location and buffer
     */
    // await storageFunc.upload(compressedObjKey,newBuff,{compressed: 'Draco'})

    /**
     * Store the file information to the DB to access via API or GQL
     */
    // await db.public[entity_name].create({
    //   name: job.data.image.name,
    //   gid: newGid,
    //   size: 0,
    //   path: newGid+'.gltf',
    //   compression_algo: 'Draco',
    //   file_id: job.data.image.id
    // })
        console.log(job)
        console.log("Finished job:", job.name);
        return true;
    }catch(err){
        console.error(err)
        return false
    }
    
    
}

async function convertFile(fileInfo){
    try {

        const inputFileName = fileInfo.image.gid+'.'+fileInfo.image.extension
        const tempFilePath = path.join(__dirname,'../tmp', inputFileName);
        fs.writeFileSync(tempFilePath, fileInfo.content);

        // const conversionScript = spawn('blender', ['-b','/app/lib/conversion.py', tempFilePath]);
        const blenderArgs = [
            '-b',                          // Run Blender in background mode
            '--python',                    // Execute Python script
            '/app/lib/conversion.py',      // Path to the Python script
            tempFilePath,                  // Path to the input file
          ];
          
          const conversionScript = spawn('blender', blenderArgs);

        // Capture the output from the Python script
        let compressedData = Buffer.from('');
        conversionScript.stdout.on('data', async (data) => {
            console.log({data, compressedData})
            compressedData = Buffer.concat([compressedData, data]);
            const compressedFilePath = await fs.writeFile(path.join(__dirname, '../tmp/compressed_file.obj'), compressedData, function(err){
                if(err){
                    console.error(err)
                    console.log('Error while saving file')
                }
            });
            // await fs.writeFile(compressedFilePath, compressedData)
        });

        // Handle script completion
        return new Promise((resolve, reject) => {
            conversionScript.on('close', (code) => {
                console.log({code})
                if (code === 0) {
                    // Compression completed successfully, read the output from the temporary file
                    const compressedFilePath = path.join(__dirname, `../${fileInfo.image.gid}.gltf`);
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

            conversionScript.on('error', (err) => {
                reject(`Failed to start Python script: ${err}`);
            });

            conversionScript.on('exit', (code) => {
                if (code !== 0) {
                    reject(`Python script exited with code ${code}`);
                }
            });
        });
    } catch (error) {
        console.error(error)
        return false
    }
}
