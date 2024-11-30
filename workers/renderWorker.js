const { spawnSync } = require('child_process');
const { Queue, Worker, QueueScheduler } = require('bullmq');

const renderWorker = new Worker('renderImageQueue', async (job) => {
    const jobData = job.data
    const location = JSON.parse(jobData.color_body)
    console.log({ locations: JSON.parse(jobData.color_body) })
    const blenderArgs = [
        '-b',                          // Run Blender in background mode
        '--python',                    // Execute Python script
        'lib/render.py',      // Path to the Python script
        location.camera_loc,                  // Path to the input file
        location.camera_rot,
        jobData.filePath
    ];

    // Use spawnSync to ensure the process is cleaned up properly
    const { stdout, stderr, status } = spawnSync(process.env.BLENDER_LOCATION, blenderArgs);

    if (status === 0 || status === 1) {
        // Process completed successfully, you can continue with the data
        const compressedData = stdout;
        // Rest of your processing logic here
        console.log({ status })
        console.log("Extraction is complete ")
        // await triggerFileUpload({ location: jobData.outputLocation, ...jobData })
        return status;
    } else {
        // Handle the error, log it, and return an appropriate status code
        console.error(`Blender process failed with status ${status}`);
        console.error(`Error output: ${stderr.toString()}`);
        console.log({ stdout, stderr })
        return status;
    }

})