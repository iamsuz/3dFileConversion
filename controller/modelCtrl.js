const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const { getBuffer } = require('../functions/storage');
const { triggerFileUpload } = require('../functions/queueProducer');

const initialize = async (req, res) => {
    try {
        console.log(req.query);

        const { data } = await axios.get('http://127.0.0.1:3016/api/v1/object-key', {
            params: {
                gid: req.query.obj_id,
            },
        });

        console.log({ data });

        const fileBuffer = await getBuffer(data.objectKey);
        console.log({ fileBuffer });

        const t = data.objectKey.split('.');
        const extension = t[t.length - 1];

        const tempFilePath = path.join(__dirname, `../tmp/${req.query.obj_id}.${extension}`);
        fs.writeFileSync(tempFilePath, fileBuffer.content);

        const blenderArgs = [
            '-b',
            '--python',
            'lib/extractTexture.py',
            tempFilePath,
        ];

        const conversionScript = spawn('/Applications/Blender.app/Contents/MacOS/Blender', blenderArgs);

        let compressedData = Buffer.from('');

        conversionScript.stdout.on('data', (data) => {
            console.log({ data: data.toString(), compressedData: compressedData.toString() });
            compressedData = Buffer.concat([compressedData, data]);
        });

        const code = await new Promise((resolve, reject) => {
            conversionScript.on('close', (code) => {
                console.log({ code });
                if (code === 0 || code === 1) {
                    console.log({ compressedData: compressedData.toString() });
                    resolve(code);
                } else {
                    console.log('We are in else of the on close');
                    reject(code);
                }
            });

            conversionScript.on('error', (err) => {
                console.log('We are in error');
                reject(err);
            });

            conversionScript.on('exit', (code) => {
                if (code !== 0 && code !== 1) {
                    console.log('We are in exit');
                    reject(code);
                }
            });
        });

        // Send the converted glTF file as a response
        // Assuming you want to send the compressedData as the response
        await triggerFileUpload(`output_textures/${req.query.obj_id}`)
        res.status(200).send(compressedData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'INTERNAL ERROR',
        });
    }
};

module.exports = {
    initialize,
};
