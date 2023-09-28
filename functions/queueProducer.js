const { Queue, Worker, QueueScheduler } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { spawnSync } = require('child_process');
const FormData = require('form-data')
// const { processAndQueueFilesForUpload } = require('./consumer');

const fs = require('fs');
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

// Producer function to add jobs
async function produceJob() {
    const jobData = {
        folderId: 'folder_name',
        filePath: '/path/to/file',
        operation: 'upload', // or 'delete'
    };

    await fileQueue.add(jobData);
}

// produceJob().catch(console.error);


// Producer function to add a control message
async function triggerFileUpload(location) {
    console.log('We are inside trigger!')

    const controlMessage = {
        operation: 'startUpload',
        location: String(location),
    };

    await fileQueue.add('startUpload', controlMessage);
}

async function addExtraction(data) {

    await extractionQueue.add('extraction', data)
}


const extractionWorker = new Worker('extractionQueue', async (job) => {
    const jobData = job.data

    // console.log({ jobData })

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
        await triggerFileUpload(`${jobData.outputLocation}`)
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
    const jobData = job.data;
    console.log(job.type)
    if (jobData.operation === 'startUpload') {
        // Start the file upload process for the specified location
        const location = jobData.location;
        await processAndQueueFilesForUpload(location);
    }
    if (jobData.operation === 'upload') {
        /**
         * Upload a file
         */
        console.log('Inside an upload')
        console.log({ jobData })

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

        //Get the required texture attributes and send

        // const materialObj = jsonDataValues[tmpParamFile[2]]
        console.log({ materialObj })
        const form = new FormData();
        form.append('map', fs.createReadStream(jobData.filePath))
        form.append('key', jobData.filePath)
        form.append('materialObj', JSON.stringify(materialObj))
        form.append("texture", JSON.stringify(texture))
        const endpoint = process.env.API + '/upload/texture'
        console.log({ endpoint })
        const t = await axios.post(endpoint, form)
        // console.log({ t });
        return true
    }
});

fileWorker.on('completed', (job) => {
    console.log(`Job ${job.id} has been completed`);
});

fileWorker.on('failed', (job, error) => {
    console.error(`Job ${job.id} has failed with error: ${error.message}`);
});


async function processAndQueueFilesForUpload(location) {

    async function readFilesRecursively(dir) {
        const files = await fs.promises.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);

            // console.log({ stat })

            if (stat.isDirectory()) {
                // If it's a directory, recursively read its contents
                await readFilesRecursively(filePath);
            } else {
                // If it's a file, add it to the queue

                // console.log({ filePath })

                const jobData = {
                    folderId: 'folder_name', // You can set folderId as needed
                    filePath: filePath,
                    operation: 'upload',
                };
                console.log('We have added for upload with ', filePath)
                const checkExt = filePath.split('.')

                if (checkExt[checkExt.length - 1] !== 'json') {
                    await fileQueue.add('upload', jobData);
                }
            }
        }
    }

    console.log('Scanning files in location:', location);
    await readFilesRecursively(location);
}

const serverAdapter = new ExpressAdapter();

const bullBoard = createBullBoard({
    queues: [new BullMQAdapter(fileQueue), new BullMQAdapter(extractionQueue)],
    serverAdapter: serverAdapter,
});

serverAdapter.setBasePath('/admin');

module.exports = {
    triggerFileUpload,
    produceJob,
    fileQueue: fileQueue,
    serverAdapter,
    addExtraction
}