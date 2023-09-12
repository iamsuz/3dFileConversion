
// const toGltf= require('../functions/fbxToGltf')
const convert = require('fbx2gltf');
const fs = require('fs')
const path = require('path')
// const { exec } = require('child_process');
const { spawn } = require('child_process');
const { getBuffer } = require('../functions/storage');
// const { objToGlb, objToGltf } = require('../functions/objToGltf');

const convertFBXToGLB = async (req, res) => {
    try {
      if (!req.files || !req.files.toconvert) {
        res.status(400).send('FBX file is missing');
        return;
      }
  
      console.log('Inside a converter');
      let conversionFilePath
      // Write the file content to a temporary file
      const tempFilePath = `./temp_${new Date().getTime()}.fbx`;
      req.files.toconvert.mv(tempFilePath, (err) => {
        if (err) {
          console.error('Error writing file:', err);
          res.status(500).send('Failed to write file');
          return;
        }
        if(req.body.to === 'glb' || req.body.to === 'GLB'){
            conversionFilePath = `./asg_${new Date().getTime()}.glb`
        }
        if(req.body.to === 'gltf' || req.body.to === 'GLTF'){
            conversionFilePath = `./asg_${new Date().getTime()}.gltf`
        }
        // Convert the FBX file to GLTF
        convert(tempFilePath, conversionFilePath, ['-d', '--khr-materials-unlit'])
          .then(() => {
            // Set the content type for the response
            res.contentType('application/octet-stream');
  
            // Stream the file to the response
            const readStream = fs.createReadStream(conversionFilePath);
            readStream.pipe(res);
  
            // Delete the temporary files after the response is finished
            readStream.on('close', () => {
              fs.unlink(tempFilePath, (err) => {
                if (err) {
                  console.error('Error deleting temporary file:', err);
                } else {
                  console.log('Temporary file deleted successfully');
                }
              });
  
              fs.unlink(conversionFilePath, (err) => {
                if (err) {
                  console.error('Error deleting converted file:', err);
                } else {
                  console.log('Converted file deleted successfully');
                }
              });
            });
          })
          .catch((error) => {
            console.error('Conversion failed:', error);
            res.status(500).send('Conversion failed');
          });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };


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
      'lib/conversion.py',      // Path to the Python script
      tempFilePath,                  // Path to the input file
    ];

    const conversionScript = spawn('/Applications/Blender.app/Contents/MacOS/Blender', blenderArgs);

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

    // Assuming the output glTF file has the same name as the ZPRJ file but with a different extension
    const gltfFile = zprjFile.path.replace('.zprj', '.gltf');

    // Send the converted glTF file as a response
    res.sendFile(gltfFile);

  } catch (error) {
    console.error(error)
    return error
  }
}

const objToGlbGltf = (req,res) =>{
    try {
        console.log('Inside a converter')
        // Write the file content to a temporary file
        const tempFilePath = './temp.zprj';
        fs.writeFileSync(tempFilePath, req.files.fbxFile.data);
        // objToGlb(tempFilePath)
        res.status(200).sendFile()
    } catch (error) {
        console.error
        res.status(500).json({error})
    }
}

module.exports = {
    convertFBXToGLB,
    withBlender
}