const { Worker } = require('bullmq');
const fs = require('fs');
const { fileQueue } = require('./queueProducer');
const path = require('path')

// // Create a BullMQ worker
// const fileWorker = new Worker('fileQueue', async (job) => {
//     const jobData = job.data;
//     console.log(job)
//     if (jobData.type === 'startUpload') {
//         // Start the file upload process for the specified location
//         const location = jobData.location;
//         await processAndQueueFilesForUpload(location);
//     }
// });

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
    processAndQueueFilesForUpload
}