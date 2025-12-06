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
 * Search for a folder by name in the repository
 */
function searchForFolder(basePath, targetFolderName) {
  const visited = new Set();
  const queue = [{ currentPath: basePath, depth: 0 }];
  const MAX_DEPTH = 3;

  while (queue.length > 0) {
    const { currentPath, depth } = queue.shift();

    if (depth > MAX_DEPTH || visited.has(currentPath)) continue;
    visited.add(currentPath);

    try {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;

        const itemPath = path.join(currentPath, item);

        try {
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            // Found the target folder
            if (item === targetFolderName) {
              return itemPath;
            }
            
            // Add to search queue
            if (depth < MAX_DEPTH) {
              queue.push({ currentPath: itemPath, depth: depth + 1 });
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      continue;
    }
  }

  return null;
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
  console.log(`Build path parameter: "${buildPath}"`);
  await job.updateProgress(5);
  
  const bucket = process.env.AWS_S3_BUCKET_NAME || "aws-auto-deployer";
  const projectRoot = path.resolve(__dirname, "../..");
  const tempClonePath = path.join(projectRoot, "temp", `clone-${deploymentId}`);
  const finalDistPath = path.join(projectRoot, "dist", deploymentId);
  
  try {
    // Step 1: Clone repository
    await job.log(`Cloning repository: ${repoUrl}`);
    await fsPromises.mkdir(path.dirname(tempClonePath), { recursive: true });
    
    const cloneCommand = `git clone ${repoUrl} "${tempClonePath}"`;
    await execAsync(cloneCommand, { maxBuffer: 1024 * 1024 * 10 });
    await job.updateProgress(15);
    
    // Checkout branch
    if (branch && branch !== "main" && branch !== "master") {
      await job.log(`Checking out branch: ${branch}`);
      await execAsync(`cd "${tempClonePath}" && git checkout ${branch}`);
    }
    
    // Log repository structure
    await job.log("=== Repository Structure ===");
    const rootContents = fs.readdirSync(tempClonePath);
    await job.log(`Root contains: ${rootContents.join(", ")}`);
    
    // Determine build directory
    let buildDirectory;
    
    if (!buildPath || buildPath.trim() === "") {
      // Use root
      buildDirectory = tempClonePath;
      await job.log("Using repository root");
    } else {
      // Try direct path first
      const directPath = path.join(tempClonePath, buildPath);
      
      if (fs.existsSync(directPath) && fs.statSync(directPath).isDirectory()) {
        buildDirectory = directPath;
        await job.log(`✓ Found at direct path: ${buildPath}`);
      } else {
        // Search for folder
        await job.log(`Searching for folder: "${buildPath}"...`);
        const foundPath = searchForFolder(tempClonePath, buildPath);
        
        if (foundPath) {
          buildDirectory = foundPath;
          const relativePath = path.relative(tempClonePath, foundPath);
          await job.log(`✓ Found at: ${relativePath}`);
        } else {
          await job.log(`✗ Could not find "${buildPath}"`);
          await job.log(`Available folders: ${rootContents.filter(f => {
            try {
              return fs.statSync(path.join(tempClonePath, f)).isDirectory();
            } catch { return false; }
          }).join(", ")}`);
          throw new Error(`Folder "${buildPath}" not found in repository`);
        }
      }
    }
    
    // Verify package.json
    const packageJsonPath = path.join(buildDirectory, "package.json");
    const hasPackageJson = fs.existsSync(packageJsonPath);
    
    if (!hasPackageJson) {
      await job.log("ℹ️ No package.json found - treating as static site");
      await job.log(`Directory contains: ${fs.readdirSync(buildDirectory).join(", ")}`);
      
      // For static sites, use the directory as-is
      buildDirectory = buildDirectory; // Already set
      
      // Skip to file upload
      await job.updateProgress(75);
      
      // Copy entire directory to dist
      await job.log(`Copying static files to dist/${deploymentId}...`);
      await fsPromises.mkdir(path.dirname(finalDistPath), { recursive: true });
      await fsPromises.cp(buildDirectory, finalDistPath, { recursive: true });
      await job.log("✓ Static files copied");
      
    } else {
      await job.log("✓ package.json found");
      
      // Read package.json to check for build script
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
      const hasDependencies = packageJson.dependencies || packageJson.devDependencies;
      
      await job.log(`Has dependencies: ${!!hasDependencies ? 'Yes' : 'No'}`);
      await job.log(`Has build script: ${hasBuildScript ? 'Yes' : 'No'}`);
      
      // Install dependencies if they exist
      if (hasDependencies) {
        await job.log("Installing dependencies...");
        await job.updateProgress(20);
        
        await execAsync(`cd "${buildDirectory}" && npm install`, {
          maxBuffer: 1024 * 1024 * 50,
        });
        await job.log("✓ Dependencies installed");
        await job.updateProgress(50);
      } else {
        await job.log("ℹ️ No dependencies to install");
        await job.updateProgress(50);
      }
      
      // Build project if build script exists
      if (hasBuildScript) {
        await job.log("Building project...");
        await execAsync(`cd "${buildDirectory}" && npm run build`, {
          maxBuffer: 1024 * 1024 * 50,
        });
        await job.log("✓ Build complete");
        await job.updateProgress(70);
        
        // Find build output
        await job.log("=== Locating Build Output ===");
        const afterBuild = fs.readdirSync(buildDirectory);
        await job.log(`Build directory now contains: ${afterBuild.join(", ")}`);
        
        const possibleBuildDirs = ['dist', 'build', 'out', '.next'];
        let buildOutputDir = null;
        
        for (const dir of possibleBuildDirs) {
          const checkPath = path.join(buildDirectory, dir);
          if (fs.existsSync(checkPath)) {
            buildOutputDir = checkPath;
            await job.log(`✓ Using build output: ${dir}/`);
            break;
          }
        }
        
        if (!buildOutputDir) {
          await job.log("⚠️ No build output folder found, using project root");
          buildOutputDir = buildDirectory;
        }
        
        await job.updateProgress(75);
        
        // Copy build output to dist
        await job.log(`Copying to dist/${deploymentId}...`);
        await fsPromises.mkdir(path.dirname(finalDistPath), { recursive: true });
        await fsPromises.cp(buildOutputDir, finalDistPath, { recursive: true });
        await job.log("✓ Files copied");
        
      } else {
        await job.log("ℹ️ No build script found - treating as pre-built or static");
        await job.updateProgress(70);
        await job.updateProgress(75);
        
        // Copy entire directory to dist
        await job.log(`Copying files to dist/${deploymentId}...`);
        await fsPromises.mkdir(path.dirname(finalDistPath), { recursive: true });
        await fsPromises.cp(buildDirectory, finalDistPath, { recursive: true });
        await job.log("✓ Files copied");
      }
    }
    
    // Upload to S3
    await job.log("Uploading to S3...");
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
      
      const uploadProgress = 75 + Math.floor((uploadedCount / totalFiles) * 25);
      await job.updateProgress(uploadProgress);
      
      if (uploadedCount % 10 === 0) {
        await job.log(`Uploaded ${uploadedCount}/${totalFiles} files`);
      }
    }
    
    // Cleanup
    await job.log("Cleaning up...");
    await fsPromises.rm(tempClonePath, { recursive: true, force: true });
    
    await job.updateProgress(100);
    
    const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${deploymentId}/index.html`;
    
    await job.log(`=== SUCCESS ===`);
    await job.log(`URL: ${s3Url}`);
    
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
      uploadedFiles: uploadedFiles.slice(0, 20),
    };
    
  } catch (error) {
    await job.log(`=== ERROR ===`);
    await job.log(error.message);
    
    try {
      if (fs.existsSync(tempClonePath)) {
        await fsPromises.rm(tempClonePath, { recursive: true, force: true });
      }
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
  concurrency: 2,
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

console.log("🚀 Build & Deploy Worker started. Waiting for jobs...");