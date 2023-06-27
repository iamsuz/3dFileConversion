
// const toGltf= require('../functions/fbxToGltf')
const convert = require('fbx2gltf');
const fs = require('fs')
const { exec } = require('child_process');
// const { objToGlb, objToGltf } = require('../functions/objToGltf');

const convertFBXToGLTF = async (req,res) =>{
    try {
        console.log(req.files.fbxFile)
        console.log('Inside a converter')
           // Write the file content to a temporary file
        const tempFilePath = './temp.fbx';
        fs.writeFileSync(tempFilePath, req.files.fbxFile.data);
        // await toGltf(req.files.fbxFile)
        const uint8Array = new Uint8Array(req.files.fbxFile.data);
        let file
        convert(uint8Array,'asg.glb', ['-d', '--khr-materials-unlit']).then(
            d=>{
                console.log({d})
                file = d
            },
            e=>{
                console.error(e)
            }
        )
        // fs.writeFile('test.glb', gldFile) 
        // console.log({gldFile})
        return res.status(200).json({file: 'asg.glb'})
    } catch (error) {
        console.error(error)
    }
}



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
    convertFBXToGLTF,
    withBlender
}