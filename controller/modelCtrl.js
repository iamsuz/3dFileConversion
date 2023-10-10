const fs = require('fs-extra')
const path = require('path');
const { v4: uuid } = require('uuid');
const axios = require('axios');
const { getBuffer } = require('../functions/storage');
const { triggerFileUpload, addExtraction } = require('../functions/queueProducer');

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

        await addExtraction({
            filePath: tempFilePath,
            fileObjKey: objectKey,
            fileId: req.body.gid,
            outputLocation: `output_textures/${req.body.gid}`,
            extension: extension,
            e_name: req.body.ename,
            e_id: req.body.eid,
            reqId: req.body.request_id,
            extraction: {
                texture: true
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

module.exports = {
    initialize,
};
