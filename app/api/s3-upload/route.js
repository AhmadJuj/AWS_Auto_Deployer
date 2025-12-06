import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Recursively get all files from a folder
 * @param {string} folderPath - The path to the folder
 * @returns {string[]} - Array of file paths
 */
function getAllFiles(folderPath) {
  let response = [];

  const allFilesAndFolders = fs.readdirSync(folderPath);

  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);

    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });

  return response;
}

/**
 * Upload a single file to S3
 * @param {string} filePath - Local file path
 * @param {string} s3Key - S3 object key (path in bucket)
 * @param {string} bucketName - S3 bucket name
 */
async function uploadFileToS3(filePath, s3Key, bucketName) {
  const fileContent = fs.readFileSync(filePath);
  
  // Determine content type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };

  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileContent,
    ContentType: contentType,
  });

  await s3.send(command);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { deploymentId, bucketName } = body;

    // Validate required fields
    if (!deploymentId) {
      return NextResponse.json(
        { error: "Deployment ID is required" },
        { status: 400 }
      );
    }

    const bucket = bucketName || process.env.AWS_S3_BUCKET_NAME || "aws-auto-deployer";

    // Get deployment path
    const deploymentPath = path.join(process.cwd(), "dist", deploymentId);

    // Check if deployment exists
    if (!fs.existsSync(deploymentPath)) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    console.log(`Starting S3 upload for deployment: ${deploymentId}`);
    console.log(`Bucket: ${bucket}`);

    // Get all files
    const allFiles = getAllFiles(deploymentPath);
    console.log(`Found ${allFiles.length} files to upload`);

    const uploadedFiles = [];
    const failedFiles = [];

    // Upload each file to S3
    for (const filePath of allFiles) {
      try {
        // Create S3 key (path in bucket)
        // Format: deploymentId/relative/path/to/file
        const relativePath = path.relative(deploymentPath, filePath);
        const s3Key = `${deploymentId}/${relativePath.replace(/\\/g, '/')}`;

        await uploadFileToS3(filePath, s3Key, bucket);
        
        uploadedFiles.push({
          localPath: relativePath,
          s3Key: s3Key,
        });

        console.log(`Uploaded: ${s3Key}`);
      } catch (uploadError) {
        console.error(`Failed to upload ${filePath}:`, uploadError);
        failedFiles.push({
          localPath: path.relative(deploymentPath, filePath),
          error: uploadError.message,
        });
      }
    }

    // Generate CloudFront/S3 URL
    const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${deploymentId}/index.html`;

    return NextResponse.json({
      success: true,
      message: "Files uploaded to S3 successfully",
      deploymentId,
      bucket,
      totalFiles: allFiles.length,
      uploadedCount: uploadedFiles.length,
      failedCount: failedFiles.length,
      uploadedFiles: uploadedFiles.slice(0, 10), // First 10 for preview
      failedFiles,
      s3Url,
      s3Path: `s3://${bucket}/${deploymentId}/`,
    });

  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json(
      {
        error: "S3 upload failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check upload status or list uploaded deployments
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const deploymentId = searchParams.get('deploymentId');

    if (deploymentId) {
      const bucket = process.env.AWS_S3_BUCKET_NAME || "aws-auto-deployer";
      const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${deploymentId}/index.html`;
      
      return NextResponse.json({
        deploymentId,
        s3Url,
        bucket,
      });
    }

    return NextResponse.json({
      message: "S3 Upload API is running",
      endpoint: "/api/s3-upload",
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}