// REMOVED: This route exposed environment secrets to unauthenticated users.
// It was a debug route that leaked OPENAI_API_KEY.
// If you need to verify env vars, use the server console instead.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been disabled for security reasons." },
    { status: 403 }
  );
}
