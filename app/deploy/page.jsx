"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function DeployContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const repoName = searchParams.get("repo");
  const repoUrl = searchParams.get("url");

  const [copied, setCopied] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [buildPath, setBuildPath] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    setDeploymentResult(null);

    try {
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          repoName: repoName || "repository",
          branch: "main",
          buildPath: buildPath.trim() || "",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDeploymentResult(data);
      } else {
        setError(data.error || data.details || "Deployment failed");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setDeploying(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Deploy Repository</h1>
          <p className="text-blue-200 text-lg">Clone and deploy your project locally</p>
        </div>

        {/* Repository Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-14 h-14 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">{repoName}</h2>
              <div className="bg-slate-900/50 rounded-lg p-3 mb-2">
                <code className="text-green-400 text-sm break-all">{repoUrl}</code>
              </div>
              <button
                onClick={() => handleCopy(repoUrl)}
                className="text-xs px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                {copied ? '✓ Copied!' : '📋 Copy URL'}
              </button>
            </div>
          </div>
        </div>

        {/* Build Path Configuration */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
          <label className="block text-white font-semibold mb-3">
            Build Path (Optional)
            <span className="text-blue-300 text-sm font-normal ml-2">For monorepos or nested projects</span>
          </label>
          <input
            type="text"
            value={buildPath}
            onChange={(e) => setBuildPath(e.target.value)}
            placeholder="e.g., frontend, packages/web, data-analysis_Agent/Frontend"
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50"
          />
          <p className="text-blue-200 text-sm mt-2">
            Leave empty if package.json is in the repository root. Enter the subdirectory path if your project is in a subfolder.
          </p>
        </div>

        {/* Main Deploy Button */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-10 mb-8 text-center shadow-2xl">
          <h3 className="text-3xl font-bold text-white mb-3">🚀 Clone Repository</h3>
          <p className="text-blue-100 mb-8 text-lg">
            Clone this repository to your server's dist folder
          </p>
          
          {!deploymentResult && !error && (
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deploying ? (
                <>
                  <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cloning...
                </>
              ) : (
                <>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Clone Now
                </>
              )}
            </button>
          )}

          {deploymentResult && (
            <div className="bg-green-500 text-white p-6 rounded-xl">
              <div className="text-2xl font-bold mb-3">✅ Clone Successful!</div>
              <p className="mb-4">{deploymentResult.message}</p>
              
              <div className="space-y-3 bg-white/20 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Deployment ID:</span>
                  <code className="bg-white/30 px-3 py-1 rounded">{deploymentResult.deploymentId}</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Location:</span>
                  <code className="bg-white/30 px-3 py-1 rounded text-xs break-all max-w-md">{deploymentResult.path}</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Repository:</span>
                  <code className="bg-white/30 px-3 py-1 rounded">{deploymentResult.repoName}</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Files Count:</span>
                  <code className="bg-white/30 px-3 py-1 rounded">{deploymentResult.filesCount}</code>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold">Timestamp:</span>
                  <code className="bg-white/30 px-3 py-1 rounded text-xs">
                    {new Date(deploymentResult.timestamp).toLocaleString()}
                  </code>
                </div>
              </div>

              {/* Files List Section */}
              {deploymentResult.files && deploymentResult.files.length > 0 && (
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Repository Files
                    </h4>
                    <button
                      onClick={() => setShowAllFiles(!showAllFiles)}
                      className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded transition"
                    >
                      {showAllFiles ? 'Hide Files' : 'Show All Files'}
                    </button>
                  </div>
                  
                  {showAllFiles && (
                    <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <ul className="space-y-1 text-left text-xs font-mono">
                        {deploymentResult.files.map((file, index) => (
                          <li key={index} className="flex items-start gap-2 text-green-300 hover:text-green-200 transition">
                            <span className="text-blue-400 flex-shrink-0">├─</span>
                            <span className="break-all">{file}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {!showAllFiles && (
                    <div className="bg-slate-900 rounded-lg p-3 text-left text-xs font-mono">
                      <div className="space-y-1">
                        {deploymentResult.files.slice(0, 5).map((file, index) => (
                          <div key={index} className="flex items-start gap-2 text-green-300">
                            <span className="text-blue-400 flex-shrink-0">├─</span>
                            <span className="break-all">{file}</span>
                          </div>
                        ))}
                        {deploymentResult.files.length > 5 && (
                          <div className="text-blue-300 mt-2 pl-4">
                            ... and {deploymentResult.files.length - 5} more files
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => { setDeploymentResult(null); setError(null); setShowAllFiles(false); }}
                className="px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition"
              >
                Clone Another Repository
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-500 text-white p-6 rounded-xl">
              <div className="text-xl font-bold mb-2">❌ Clone Failed</div>
              <p className="text-sm mb-4">{error}</p>
              <button
                onClick={() => { setError(null); setDeploymentResult(null); }}
                className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition"
              >
                Try Again
              </button>
            </div>
          )}
          
          {!deploymentResult && !deploying && (
            <p className="text-xs text-blue-100 mt-5">
              This will clone your repository to a unique folder in the dist directory
            </p>
          )}
        </div>

        {/* Steps Guide */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white text-sm rounded-full">?</span>
            How It Works
          </h3>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Generate Unique ID</h4>
                <p className="text-blue-200 text-sm">
                  A random 16-character deployment ID is generated for your repository
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Clone Repository</h4>
                <div className="bg-slate-900/50 rounded-lg p-4 mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Destination:</span>
                    <span className="text-white font-mono">dist/[deployment-id]</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Method:</span>
                    <span className="text-white font-mono">git clone</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300">Branch:</span>
                    <span className="text-white font-mono">main</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Scan & Index Files</h4>
                <p className="text-blue-200 text-sm">
                  The system recursively scans all files and folders in the repository
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1 text-lg">Ready to Use!</h4>
                <p className="text-blue-200 text-sm">
                  Your repository is now available with a complete file listing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>💡</span>
            Additional Information
          </h3>
          <p className="text-blue-200 text-sm mb-3">
            Each deployment creates an isolated copy of your repository with a unique identifier. 
            This allows multiple deployments without conflicts. You'll get a complete list of all files in the repository.
          </p>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <code className="text-green-400 text-xs">
              Example path: /your-server/dist/a3f2c9d8e1b4f567/
            </code>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="text-blue-300 hover:text-white transition flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to repositories
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeployPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <DeployContent />
    </Suspense>
  );
}