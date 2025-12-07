import { NextResponse } from "next/server";
import { deployQueue } from "@/lib/queues/deployQueue";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await deployQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Get logs from Redis (BullMQ stores logs with the job)
    let logs = [];
    try {
      const logKey = `bull:build-and-deploy:${jobId}:logs`;
      const redis = await import("@/lib/redis");
      const logData = await redis.default.lrange(logKey, 0, -1);
      logs = logData || [];
    } catch (err) {
      console.error("Error fetching logs from Redis:", err);
      logs = [];
    }

    return NextResponse.json({
      jobId,
      logs: logs,
    });
  } catch (error) {
    console.error("Logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs", details: error.message },
      { status: 500 }
    );
  }
}
