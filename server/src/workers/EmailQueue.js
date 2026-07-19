const { Queue, Worker } = require("bullmq");
const redis = require("../services/cache/redisClient");
const env = require("../config/env");

let emailQueue = null;

if (env.features.bullmq && redis) {
  try {
    emailQueue = new Queue("EmailQueue", { connection: redis });

    const emailWorker = new Worker("EmailQueue", async job => {
      console.log("Sending email to:", job.data.to);
      // Nodemailer logic here
    }, { connection: redis });

    emailWorker.on("failed", (job, err) => {
      console.error(`Email job failed for ${job?.data?.to}:`, err);
    });
  } catch (err) {
    console.warn("WARNING: BullMQ initialization failed.", err);
    env.features.bullmq = false;
  }
} else {
  console.warn("Background jobs disabled.");
}

module.exports = { emailQueue };