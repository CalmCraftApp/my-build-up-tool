import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date_jst, title } = body as { date_jst?: string; title?: string };

  if (!date_jst || !title?.trim()) {
    return NextResponse.json({ error: "date_jst and title are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("daily_titles")
    .insert({ date_jst, title: title.trim() })
    .select("id, title")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
