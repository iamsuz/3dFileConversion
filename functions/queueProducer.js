const { Queue, Worker, QueueScheduler } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
// const { processAndQueueFilesForUpload } = require('./consumer');

const fs = require('fs');
// const { fileQueue } = require('./queueProducer');
const path = require('path')


// Create a BullMQ queue with Redis connection details
const connection = {
    host: 'localhost', // Redis server host
    port: 6379,        // Redis server port
}

// Create a BullMQ queue
const fileQueue = new Queue('fileQueue', {
    connection: connection
});

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

const serverAdapter = new ExpressAdapter();

const bullBoard = createBullBoard({
    queues: [new BullMQAdapter(fileQueue)],
    serverAdapter: serverAdapter,
});

serverAdapter.setBasePath('/admin');


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

            console.log({ stat })

            if (stat.isDirectory()) {
                // If it's a directory, recursively read its contents
                await readFilesRecursively(filePath);
            } else {
                // If it's a file, add it to the queue

                console.log({ filePath })

                const jobData = {
                    folderId: 'folder_name', // You can set folderId as needed
                    filePath: filePath,
                    operation: 'upload',
                };
                console.log({ fileQueue })
                await fileQueue.add('upload', jobData);
            }
        }
    }

    console.log('Scanning files in location:', location);
    await readFilesRecursively(location);
}

module.exports = {
    triggerFileUpload,
    produceJob,
    fileQueue: fileQueue,
    serverAdapter
}