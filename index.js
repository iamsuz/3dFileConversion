const express = require('express');
const os = require('os');
exports.dir = os.tmpdir();
const { exec } = require('child_process');
const expressUpload = require('express-fileupload')
const app = express();
const fs = require('fs')

app.use(expressUpload({debug: true}))

app.post('/convert/with/blender', (req, res) => {
    console.log(req.files)
  // Assuming the ZPRJ file is uploaded via multipart/form-data
  const zprjFile = req.files.zprj;

    const zprjFileContent = req.files.zprj.data
   // Write the file content to a temporary file
   const tempFilePath = './temp.zprj';
   fs.writeFileSync(tempFilePath, zprjFileContent);

  // Define the command to execute the Blender Python script
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
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
