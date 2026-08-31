import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date_jst, title } = body as { date_jst?: string; title?: string };

  if (!date_jst || !title?.trim()) {
    return NextResponse.json({ error: "date_jst and title are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("daily_titles")
    .select("position")
    .eq("date_jst", date_jst)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("daily_titles")
    .insert({ date_jst, title: title.trim(), position: nextPosition })
    .select("id, title, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
