import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("non_business_tasks")
    .select("id, task_text, done, position")
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task_text } = body as { task_text?: string };

  if (!task_text?.trim()) {
    return NextResponse.json({ error: "task_text is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("non_business_tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("non_business_tasks")
    .insert({ task_text: task_text.trim(), position: nextPosition })
    .select("id, task_text, done, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
