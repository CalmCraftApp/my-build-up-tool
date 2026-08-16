import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { done, task_text } = body as { done?: boolean; task_text?: string };

  const update: Record<string, unknown> = {};
  if (typeof done === "boolean") {
    update.done = done;
    update.checked_at = done ? new Date().toISOString() : null;
  }
  if (typeof task_text === "string") {
    if (!task_text.trim()) {
      return NextResponse.json({ error: "task_text cannot be empty" }, { status: 400 });
    }
    update.task_text = task_text.trim();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("daily_tasks").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("daily_tasks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
