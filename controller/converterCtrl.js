
// const toGltf= require('../functions/fbxToGltf')
const convert = require('fbx2gltf');
const fs = require('fs')
const { exec } = require('child_process');
// const { objToGlb, objToGltf } = require('../functions/objToGltf');

const convertFBXToGLB = async (req, res) => {
    try {
      if (!req.files || !req.files.fbxFile) {
        res.status(400).send('FBX file is missing');
        return;
      }
  
      console.log('Inside a converter');
      let conversionFilePath
      // Write the file content to a temporary file
      const tempFilePath = `./temp_${new Date()}.fbx`;
      req.files.fbxFile.mv(tempFilePath, (err) => {
        if (err) {
          console.error('Error writing file:', err);
          res.status(500).send('Failed to write file');
          return;
        }
        if(req.body.to === 'glb' || req.body.to === 'GLB'){
            conversionFilePath = `./asg_${new Date()}.glb`
        }
        if(req.body.to === 'gltf' || req.body.to === 'GLTF'){
            conversionFilePath = `./asg_${new Date()}.gltf`
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
    console.log(req.files)
  // Assuming the ZPRJ file is uploaded via multipart/form-data
  const zprjFile = req.files.zprj;

    const zprjFileContent = req.files.zprj.data
   // Write the file content to a temporary file
   const tempFilePath = './temp.zprj';
   fs.writeFileSync(tempFilePath, zprjFileContent);

  // Define the command to execute the Blender Python script
  //if you have blender defined in your PATH variable then you can use
  // blender --background --python script.py --filename
  const command = `/Applications/Blender.app/Contents/MacOS/Blender --background --python script.py -- ${tempFilePath}`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    // Assuming the output glTF file has the same name as the ZPRJ file but with a different extension
    const gltfFile = zprjFile.path.replace('.zprj', '.gltf');

    // Send the converted glTF file as a response
    res.sendFile(gltfFile);
  });
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