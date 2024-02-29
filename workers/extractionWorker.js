const { Queue, Worker, QueueScheduler } = require('bullmq');
const { spawnSync } = require('child_process');
const FormData = require('form-data')
// const { processAndQueueFilesForUpload } = require('./consumer');

const fse = require('fs-extra')
// const { fileQueue } = require('./queueProducer');
const path = require('path');
const { default: axios } = require('axios');
const { triggerFileUpload } = require('../functions/queueProducer');

const extractionWorker = new Worker('extractionQueue', async (job) => {
    const jobData = job.data

    // console.log({ jobData })

    // check if file exist and give the proper path
    if (!fse.existsSync(jobData.filePath)) {
        return new Error('Couldnt find requested file')
    }


    const blenderArgs = [
        '-b',
        '-P',
        'lib/extractTexture.py',
        jobData.filePath,
    ];

    // Use spawnSync to ensure the process is cleaned up properly
    const { stdout, stderr, status } = spawnSync(process.env.BLENDER_LOCATION, blenderArgs);

    if (status === 0 || status === 1) {
        // Process completed successfully, you can continue with the data
        const compressedData = stdout;
        // Rest of your processing logic here
        console.log({ status })
        console.log("Extraction is complete ")
        await triggerFileUpload({ location: jobData.outputLocation, ...jobData })
        return status;
    } else {
        // Handle the error, log it, and return an appropriate status code
        console.error(`Blender process failed with status ${status}`);
        console.error(`Error output: ${stderr.toString()}`);
        console.log({ stdout, stderr })
        return status;
    }

})


extractionWorker.on('completed', (job) => {
    console.log(`Extracton Job ${job} has been completed`);
});

extractionWorker.on('failed', (job, error) => {
    console.error(`Extraction Job ${job} has failed with error: ${error.message}`);
});