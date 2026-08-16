import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date_jst, task_text } = body as { date_jst?: string; task_text?: string };

  if (!date_jst || !task_text?.trim()) {
    return NextResponse.json({ error: "date_jst and task_text are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .insert({ date_jst, task_text: task_text.trim() })
    .select("id, task_text, done")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
