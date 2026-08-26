import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("todo_items")
    .select("id, text, done, position")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text } = body as { text?: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: minRow } = await supabase
    .from("todo_items")
    .select("position")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextPosition = (minRow?.position ?? 1) - 1;

  const { data, error } = await supabase
    .from("todo_items")
    .insert({ text: text.trim(), position: nextPosition })
    .select("id, text, done, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
