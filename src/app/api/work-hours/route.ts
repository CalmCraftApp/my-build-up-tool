import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date_jst, work_hours_part, work_minutes_part, comment } = body as {
    date_jst?: string;
    work_hours_part?: number | null;
    work_minutes_part?: number | null;
    comment?: string | null;
  };

  if (!date_jst) {
    return NextResponse.json({ error: "date_jst is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("work_hours").upsert(
    {
      date_jst,
      work_hours_part: work_hours_part ?? null,
      work_minutes_part: work_minutes_part ?? null,
      comment: comment ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "date_jst" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
