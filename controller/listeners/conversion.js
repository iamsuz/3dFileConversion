const { Queue, Worker } = require("bullmq");
const { conversionHandler } = require("../handlers/conversionWorker");

const redisOptions = { host: "106.213.87.121", port: 6379 };

const workerOptions = {
    connection: redisOptions,
};

/**
 * This is new worker thread which will be used by compression queue
 */
const conversionWorker = new Worker("conversion", conversionHandler, workerOptions);