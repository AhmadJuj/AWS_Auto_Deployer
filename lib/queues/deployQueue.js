import { Queue } from "bullmq";
import connection from "../redis.js";

export const deployQueue = new Queue("build-and-deploy", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 50,
    },
  },
});
