import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// DELETE /api/cron/cleanup — Hard-delete lists soft-deleted more than 30 days ago.
// Called daily by Vercel Cron. Protected by CRON_SECRET env var.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createServerSupabase();

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("lists")
    .delete()
    .not("deleted_at", "is", null)
    .lt("deleted_at", cutoff)
    .select("id");

  if (error) {
    console.error("[cron/cleanup] Error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }

  const count = data?.length ?? 0;
  console.log(`[cron/cleanup] Hard-deleted ${count} list(s)`);
  return NextResponse.json({ deleted: count });
}