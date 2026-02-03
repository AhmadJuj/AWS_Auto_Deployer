"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthButton() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 p-6 border border-blue-900 rounded-lg shadow-lg bg-gray-900 max-w-sm w-full mx-4">
        {session ? (
          <>
            <p className="text-gray-300 text-center">
              Signed in as <span className="font-semibold text-white">{session.user.email}</span>
            </p>
            <button
              onClick={() => router.push('/repos')}
              className="px-4 py-2 w-full rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View Repositories
            </button>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 w-full rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("github")}
            className="px-4 py-2 w-full rounded-lg bg-blue-700 text-white font-medium hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
          >
            Sign in with GitHub
          </button>
        )}
      </div>
    </div>
  );
}
