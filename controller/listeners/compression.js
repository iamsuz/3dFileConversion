const { Queue, Worker } = require("bullmq");
const { compressionWorker } = require("../handlers/compressionWorker");

const redisOptions = { host: "106.213.87.121", port: 6379 };

const workerOptions = {
    connection: redisOptions,
};

/**
 * This is new worker thread which will be used by compression queue
 */
const compression = new Worker("conversion", compressionWorker, workerOptions);