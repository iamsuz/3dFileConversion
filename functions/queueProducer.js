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

const renderImageQueue = new Queue('renderImageQueue', {
    connection: connection
})

// Set the maximum number of concurrent tasks
const maxConcurrentTasks = 1; // Adjust this number as needed
extractionQueue.setMaxListeners(maxConcurrentTasks);

renderImageQueue.setMaxListeners(1)



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

async function renderImage(data) {
    await renderImageQueue.add('render', data)
}


require('../workers')


const serverAdapter = new ExpressAdapter();

const bullBoard = createBullBoard({
    queues: [new BullMQAdapter(fileQueue), new BullMQAdapter(extractionQueue), new BullMQAdapter(renderImageQueue)],
    serverAdapter: serverAdapter,
});

serverAdapter.setBasePath('/admin');

module.exports = {
    triggerFileUpload,
    fileQueue: fileQueue,
    serverAdapter,
    addExtraction,
    renderImage
}