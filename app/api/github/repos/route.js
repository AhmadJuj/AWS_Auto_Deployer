import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; // path relative to this file

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "Not logged in" }), { 
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const res = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${session.accessToken}`,
      },
    });

    if (!res.ok) {
      return Response.json(
        { error: `GitHub API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const repos = await res.json();
    
    // Ensure we return an array
    if (!Array.isArray(repos)) {
      return Response.json([]);
    }
    
    return Response.json(repos);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
