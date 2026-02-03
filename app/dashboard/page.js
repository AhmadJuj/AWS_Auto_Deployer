"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-blue-900 bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white">TaskFlow</h1>
          {session ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-sm text-gray-300 truncate max-w-[200px] sm:max-w-none">{session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-600 transition text-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-600 transition text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-4">
            Manage Your Tasks Like Never Before
          </h2>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 px-4">
            A powerful task management platform built for teams. Collaborate,
            organize, and achieve your goals efficiently.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center px-4">
            {session ? (
              <>
                <button 
                  onClick={() => router.push("/repos")}
                  className="px-8 py-4 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-600 transition shadow-sm"
                >
                  View Repositories
                </button>
                <button 
                  onClick={() => router.push("/repos")}
                  className="px-8 py-4 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition border border-blue-900"
                >
                  Start Deploying
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn("github")}
                  className="px-8 py-4 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-600 transition shadow-sm"
                >
                  Get Started Free
                </button>
                <button className="px-8 py-4 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition border border-blue-900">
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 md:mt-20">
          <div className="p-6 sm:p-8 rounded-xl bg-gray-900 border border-blue-900 shadow-sm hover:shadow-md transition">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚡</div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
              Lightning Fast
            </h3>
            <p className="text-sm sm:text-base text-gray-300">
              Built with Next.js for blazing fast performance and seamless
              experience.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-xl bg-gray-900 border border-blue-900 shadow-sm hover:shadow-md transition">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔒</div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
              Secure Auth
            </h3>
            <p className="text-gray-300">
              Enterprise-grade authentication powered by NextAuth and GitHub
              OAuth.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-xl bg-gray-900 border border-blue-900 shadow-sm hover:shadow-md transition">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚀</div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
              Real-time Sync
            </h3>
            <p className="text-sm sm:text-base text-gray-300">
              Collaborate with your team in real-time with instant updates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-900 bg-gray-900 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400">
          © 2025 TaskFlow. Built with Next.js & NextAuth.
        </div>
      </footer>
    </div>
  );
}