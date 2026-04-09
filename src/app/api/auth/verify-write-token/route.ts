import { NextRequest, NextResponse } from "next/server";
import { requireWriteToken } from "@/lib/write-auth";

// POST /api/auth/verify-write-token — Validate a write token without side effects
export async function POST(request: NextRequest) {
  const deny = requireWriteToken(request);
  if (deny) return deny;
  return NextResponse.json({ ok: true });
}
