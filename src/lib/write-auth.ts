import { NextRequest, NextResponse } from "next/server";

const WRITE_SECRET = process.env.WRITE_SECRET;

/**
 * Returns a 403 response if the request lacks a valid write token,
 * or null if the request is authorised.
 *
 * When WRITE_SECRET is not set, all writes are blocked.
 */
export function requireWriteToken(req: NextRequest): NextResponse | null {
  if (!WRITE_SECRET) {
    return NextResponse.json(
      { error: "Write access is disabled" },
      { status: 403 },
    );
  }

  const token = req.headers.get("x-write-token");
  if (token !== WRITE_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  return null;
}
