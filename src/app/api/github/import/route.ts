import { z } from "zod";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { convex } from "@/lib/convex-client";
import { inngest } from "@/inngest/client";

import { api } from "../../../../../convex/_generated/api";

const requestSchema = z.object({
  url: z.url(),
});

function parseGitHubUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }

  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export async function POST(request: Request) {
  const { userId, has } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPro = has({ plan: "pro" });

  if (!hasPro) {
    return NextResponse.json({ error: "Pro Plan Required" }, { status: 403 });
  }

  const body = await request.json();
  const { url } = requestSchema.parse(body);

  const { owner, repo } = parseGitHubUrl(url);
  // https://github.com/AntonioErdeljac/cursor-dev
  // { owner: "AntonioErdeljac", repo: "cursor-dev" }

  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  const githubToken = tokens.data[0]?.token;

  if (!githubToken) {
    return NextResponse.json(
      {
        error:
          "GitHub Not Connected. Please Reconnect your GitHub Account with 'repo' Scope to Import Private Repositories.",
      },
      { status: 400 },
    );
  }

  // Verify token has necessary scopes
  const tokenScopes = tokens.data[0]?.scopes || [];
  const hasRepoScope =
    tokenScopes.includes("repo") || tokenScopes.includes("private_repo");

  if (!hasRepoScope) {
    return NextResponse.json(
      {
        error:
          "GitHub Account Not Connected with Proper Permissions. Please Reconnect your GitHub Account and Grant 'repo' Scope to Access Private Repositories.",
      },
      { status: 400 },
    );
  }

  const internalKey = process.env.CORTEX_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Server Configuration Error" },
      { status: 500 },
    );
  }

  const projectId = await convex.mutation(api.system.createProject, {
    internalKey,
    name: repo,
    ownerId: userId,
  });

  const event = await inngest.send({
    name: "github/import.repo",
    data: {
      owner,
      repo,
      projectId,
      githubToken,
    },
  });

  return NextResponse.json({
    success: true,
    projectId,
    eventId: event.ids[0],
  });
}
