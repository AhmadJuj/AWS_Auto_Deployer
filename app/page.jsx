"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 sm:px-6">
      <header className="w-full max-w-md mb-8 sm:mb-12 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 text-center sm:text-left">Welcome to TeamTasks</h1>
        {session ? (
          <button onClick={() => signOut()}
            className="w-full sm:w-auto sm:ml-auto rounded bg-gray-800 text-white px-6 py-2.5 hover:bg-gray-900 transition font-medium">
            Sign out
          </button>
        ) : (
          <button onClick={() => signIn("github")}
            className="w-full sm:w-auto sm:ml-auto rounded bg-gray-800 text-white px-6 py-2.5 hover:bg-gray-900 transition font-medium">
            Sign in
          </button>
        )}
      </header>

      <main className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 sm:p-8 text-center mx-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          Organize your tasks, simply.
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Stay on top of teamwork and deadlines without distractions. Log in and start managing your day—all from one place.
        </p>
        {session ? (
          <a href="/dashboard" className="inline-block w-full sm:w-auto bg-black text-white rounded-lg px-8 py-3 font-medium hover:bg-gray-800 transition">
            Go to your dashboard
          </a>
        ) : (
          <button onClick={() => signIn("github")}
            className="w-full sm:w-auto bg-black text-white rounded-lg px-8 py-3 font-medium hover:bg-gray-800 transition">
            Sign in with GitHub
          </button>
        )}
      </main>

      <footer className="mt-8 sm:mt-12 text-xs sm:text-sm text-gray-500 text-center px-4">
        Built for teams that care about getting things done.
      </footer>
    </div>
  );
}
