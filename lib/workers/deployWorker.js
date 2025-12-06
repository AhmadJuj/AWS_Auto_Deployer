import { Worker } from "bullmq";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import connection from "../redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Get all files recursively
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
 */
async function uploadFileToS3(filePath, s3Key, bucketName) {
  const fileContent = fs.readFileSync(filePath);
  
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

/**
 * Main build and deploy process
 */
async function buildAndDeploy(job) {
  const { repoUrl, deploymentId, repoName, branch = "main", buildPath = "" } = job.data;
  
  console.log(`Starting build & deploy for: ${deploymentId}`);
  await job.updateProgress(5);
  
  const bucket = process.env.AWS_S3_BUCKET_NAME || "aws-auto-deployer";
  
  // Get project root (2 levels up from workers folder)
  const projectRoot = path.resolve(__dirname, "../..");
  
  // Temporary folder for cloning (will be deleted)
  const tempClonePath = path.join(projectRoot, "temp", `clone-${deploymentId}`);
  
  // Final dist folder where ONLY build output will be stored
  const finalDistPath = path.join(projectRoot, "dist", deploymentId);
  
  try {
    // Step 1: Clone repository to temp folder (5-15%)
    await job.log(`Cloning repository: ${repoUrl}`);
    await fsPromises.mkdir(path.dirname(tempClonePath), { recursive: true });
    
    const cloneCommand = `git clone ${repoUrl} "${tempClonePath}"`;
    await execAsync(cloneCommand, { maxBuffer: 1024 * 1024 * 10 });
    await job.updateProgress(15);
    
    // Checkout branch if specified
    if (branch && branch !== "main" && branch !== "master") {
      await job.log(`Checking out branch: ${branch}`);
      await execAsync(`cd "${tempClonePath}" && git checkout ${branch}`);
    }
    
    // Determine the build directory (support monorepos)
    const buildDirectory = buildPath 
      ? path.join(tempClonePath, buildPath)
      : tempClonePath;
    
    // Check if package.json exists in build directory
    const packageJsonPath = path.join(buildDirectory, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found in ${buildPath || "root"}. Check your buildPath configuration.`);
    }
    
    await job.log(`Build directory: ${buildPath || "root"}`);
    
    // Step 2: Install dependencies (15-50%)
    await job.log("Installing dependencies (npm install)...");
    await job.updateProgress(20);
    
    try {
      await execAsync(`cd "${buildDirectory}" && npm install`, {
        maxBuffer: 1024 * 1024 * 50,
      });
      await job.log(`Dependencies installed successfully`);
    } catch (installError) {
      throw new Error(`npm install failed: ${installError.message}`);
    }
    
    await job.updateProgress(50);
    
    // Step 3: Build project (50-70%)
    await job.log("Building project (npm run build)...");
    
    try {
      await execAsync(`cd "${buildDirectory}" && npm run build`, {
        maxBuffer: 1024 * 1024 * 50,
      });
      await job.log(`Build completed successfully`);
    } catch (buildError) {
      throw new Error(`npm run build failed: ${buildError.message}`);
    }
    
    await job.updateProgress(70);
    
    // Step 4: Find build output directory (70-75%)
    await job.log("Locating build output...");
    const possibleBuildDirs = ['dist', 'build', 'out', '.next'];
    let buildDir = null;
    
    for (const dir of possibleBuildDirs) {
      const checkPath = path.join(buildDirectory, dir);
      if (fs.existsSync(checkPath)) {
        buildDir = checkPath;
        await job.log(`Found build output in: ${dir}/`);
        break;
      }
    }
    
    if (!buildDir) {
      throw new Error("Could not find build output directory (dist, build, out, or .next)");
    }
    
    // Step 5: Copy ONLY build output to dist/deploymentId folder
    await job.log(`Copying build output to dist/${deploymentId}...`);
    await fsPromises.mkdir(path.dirname(finalDistPath), { recursive: true });
    await fsPromises.cp(buildDir, finalDistPath, { recursive: true });
    await job.log(`Build files copied to: dist/${deploymentId}`);
    
    await job.updateProgress(75);
    
    // Step 6: Upload build files to S3 (75-100%)
    await job.log("Uploading build files to S3...");
    const allFiles = getAllFiles(finalDistPath);
    const totalFiles = allFiles.length;
    let uploadedCount = 0;
    const uploadedFiles = [];
    
    for (const filePath of allFiles) {
      const relativePath = path.relative(finalDistPath, filePath);
      const s3Key = `${deploymentId}/${relativePath.replace(/\\/g, '/')}`;
      
      await uploadFileToS3(filePath, s3Key, bucket);
      
      uploadedCount++;
      uploadedFiles.push(relativePath);
      
      // Update progress from 75% to 100%
      const uploadProgress = 75 + Math.floor((uploadedCount / totalFiles) * 25);
      await job.updateProgress(uploadProgress);
      
      if (uploadedCount % 10 === 0) {
        await job.log(`Uploaded ${uploadedCount}/${totalFiles} files...`);
      }
    }
    
    // Step 7: Cleanup temp clone folder (keep dist folder)
    await job.log("Cleaning up temporary files...");
    await fsPromises.rm(tempClonePath, { recursive: true, force: true });
    await job.log(`Temporary clone deleted. Build files kept in dist/${deploymentId}`);
    
    await job.updateProgress(100);
    
    // Generate URLs
    const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${deploymentId}/index.html`;
    
    await job.log(`Deployment complete! URL: ${s3Url}`);
    
    return {
      success: true,
      deploymentId,
      repoName,
      bucket,
      totalFiles,
      uploadedCount,
      s3Url,
      s3Path: `s3://${bucket}/${deploymentId}/`,
      localPath: finalDistPath,
      uploadedFiles: uploadedFiles.slice(0, 20), // First 20 for preview
    };
    
  } catch (error) {
    // Cleanup on failure
    await job.log(`Error occurred: ${error.message}`);
    
    try {
      // Clean up temp clone
      if (fs.existsSync(tempClonePath)) {
        await fsPromises.rm(tempClonePath, { recursive: true, force: true });
      }
      // Clean up partial dist folder
      if (fs.existsSync(finalDistPath)) {
        await fsPromises.rm(finalDistPath, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
    
    throw error;
  }
}

export const deployWorker = new Worker("build-and-deploy", buildAndDeploy, {
  connection,
  concurrency: 2, // Process 2 builds simultaneously
});

deployWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully!`);
});

deployWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

deployWorker.on("progress", (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});