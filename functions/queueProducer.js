const { Queue, Worker, QueueScheduler } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { spawnSync } = require('child_process');
const FormData = require('form-data')
// const { processAndQueueFilesForUpload } = require('./consumer');

const fse = require('fs-extra')
// const { fileQueue } = require('./queueProducer');
const path = require('path');
const { default: axios } = require('axios');


// Create a BullMQ queue with Redis connection details
const connection = {
    host: 'localhost', // Redis server host
    port: 6379,        // Redis server port
}

// Create a BullMQ queue
const fileQueue = new Queue('fileQueue', {
    connection: connection
});

const extractionQueue = new Queue('extractionQueue', {
    connection: connection
})

// Set the maximum number of concurrent tasks
const maxConcurrentTasks = 1; // Adjust this number as needed
extractionQueue.setMaxListeners(maxConcurrentTasks);

fileQueue.setMaxListeners(5)



// Producer function to add a control message
async function triggerFileUpload(data) {
    console.log('We are inside trigger!')
    console.log({ triggerFileUpload: data })
    const controlMessage = {
        operation: 'startUpload',
        ...data
    };
    // console.log({ controlMessage })
    await fileQueue.add('startUpload', controlMessage);
}

async function addExtraction(data) {
    console.log({ extraction: data })
    await extractionQueue.add('extraction', data)
}


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


// Create a BullMQ worker
const fileWorker = new Worker('fileQueue', async (job) => {

    try {
        let jobData = job.data;
        // console.log(job.type)
        if (jobData.operation === 'startUpload') {
            // Start the file upload process for the specified location
            const location = jobData.location;
            const fileId = jobData.fileId
            const eName = jobData.e_name
            const eId = jobData.e_id
            const extension = jobData.extension
            const reqId = jobData.reqId
            await processAndQueueFilesForUpload({ location, fileId, eName, eId, extension, reqId });
        }
        if (jobData.operation === 'upload') {
            /**
             * Upload a file
             */
            console.log('Inside an upload')

            const tmpParamFile = jobData.filePath.split('/')

            const paramFilePath = `${tmpParamFile[0]}/${tmpParamFile[1]}/${tmpParamFile[1]}.json`

            const jsonDataValues = require(path.join(__dirname, `../${paramFilePath}`))

            let materialObj = {}
            let texture = {}
            jsonDataValues.forEach((v, i) => {
                if (v.mesh_name === tmpParamFile[2]) {
                    materialObj = v.materials
                    materialObj.forEach((f, j) => {
                        if (f.name === tmpParamFile[3]) {
                            texture = f
                        }
                    })
                    return
                }
            })
            // console.log({ materialObj, texture })
            //Get the required texture attributes and send

            // const materialObj = jsonDataValues[tmpParamFile[2]]
            // console.log({ materialObj })
            const form = new FormData();
            form.append('map', fse.createReadStream(jobData.filePath))
            form.append('key', jobData.filePath)
            form.append('materialObj', JSON.stringify(materialObj))
            form.append("texture", JSON.stringify(texture))
            form.append("e_name", jobData.eName)
            form.append("e_id", jobData.eId)
            const endpoint = process.env.API + '/configurator/upload/texture'
            console.log({ endpoint })
            const t = await axios.post(endpoint, form)


            return true
        }
    } catch (error) {
        console.error(error)
        return false
    }

});

fileWorker.on('completed', async (job) => {
    const reqId = job.data.reqId;
    const jobData = job.data
    const numberOfStoreExtractionJobs = jobData.totalNumber // Determine this dynamically
    const completedStoreJobs = await fileQueue.getJobs([
        'completed',
        'failed',
    ]);
    // console.log({ completedStoreJobs })


    // Now you have an array of objects with job details and whether they match the criteria
    console.log(completedStoreJobs.length);
    // To filter jobs that match the criteria:
    const filteredJobs = completedStoreJobs.filter(
        (jobInfo) => (jobInfo.data.reqId === reqId &&
            jobInfo.data.operation === 'upload')

    );

    // console.log(filteredJobs);

    // console.log({ completedJobsForFile, numberOfStoreExtractionJobs })
    // console.log(filteredJobs.length)
    if (filteredJobs.length === numberOfStoreExtractionJobs) {
        // All store extraction jobs for this file are completed
        // You can trigger further processing here
        // upload the 
        const updateForm = new FormData()
        updateForm.append('gid', jobData?.fileId)
        updateForm.append('entity_name', jobData?.eName)
        updateForm.append('entity_id', jobData?.eId)
        updateForm.append('request_id', jobData?.reqId)
        const statusEndpoint = process.env.API + '/configurator/update-file-status'
        // console.log({ statusEndpoint })
        const updateStatus = await axios.post(statusEndpoint, updateForm)
        // console.log({ updateStatus })
        if (updateStatus.status === 200) {
            //Delete the file and folder
            const dirPath = path.join(__dirname, '../output_textures', jobData.fileId)
            fse.removeSync(dirPath);
            const rmFile = path.join(__dirname, `../tmp/${jobData.fileId}.${jobData.extension}`)
            fse.unlink(rmFile, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('File deleted successfully');
            })
        }

    }
});

fileWorker.on('failed', (job, error) => {
    console.error(`Job ${job.id} has failed with error: ${error.message}`);
});





async function processAndQueueFilesForUpload(data) {
    const storeJobs = []

    async function readFilesRecursively(data) {

        const dir = String(data.location)
        const files = await fse.promises.readdir(dir);

        /**
         * store the jobs at the beginning so we add them into queue
         * This is done because we can track the number of tasks and either it is complete or not
         */


        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fse.promises.stat(filePath);

            // console.log({ stat })

            if (stat.isDirectory()) {
                // If it's a directory, recursively read its contents
                await readFilesRecursively({ location: filePath, fileId: data.fileId, eName: data.eName, eId: data.eId, extension: data.extension, reqId: data.reqId });
            } else {
                // If it's a file, add it to the queue

                // console.log({ filePath })

                const jobData = {
                    folderId: 'folder_name', // You can set folderId as needed
                    fileId: data.fileId,
                    filePath: filePath,
                    operation: 'upload',
                    eName: data.eName,
                    eId: data.eId,
                    reqId: data.reqId,
                    extension: data.extension
                };
                console.log('We have added for upload with ', filePath)
                const checkExt = filePath.split('.')

                if (checkExt[checkExt.length - 1] !== 'json') {
                    // await fileQueue.add('upload', jobData);
                    storeJobs.push(jobData)
                }
            }
        }

        // return storeJobs

    }

    console.log('Scanning files in location:', data.location);
    await readFilesRecursively(data);

    console.log({ storeJobs })

    for (let i = 0; i < storeJobs.length; i++) {
        await fileQueue.add(
            'upload', { ...storeJobs[i], totalNumber: storeJobs.length, currentNumber: i + 1 },
        );
    }

}

const serverAdapter = new ExpressAdapter();

const bullBoard = createBullBoard({
    queues: [new BullMQAdapter(fileQueue), new BullMQAdapter(extractionQueue)],
    serverAdapter: serverAdapter,
});

serverAdapter.setBasePath('/admin');

module.exports = {
    triggerFileUpload,
    fileQueue: fileQueue,
    serverAdapter,
    addExtraction
}