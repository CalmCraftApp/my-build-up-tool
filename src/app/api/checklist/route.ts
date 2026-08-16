import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date_jst, item_key, checked } = body as {
    date_jst?: string;
    item_key?: string;
    checked?: boolean;
  };

  if (!date_jst || !item_key || typeof checked !== "boolean") {
    return NextResponse.json(
      { error: "date_jst, item_key and checked are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("daily_checklist").upsert(
    {
      date_jst,
      item_key,
      checked,
      checked_at: checked ? new Date().toISOString() : null,
    },
    { onConflict: "date_jst,item_key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
