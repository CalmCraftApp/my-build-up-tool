import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    plan_text,
    impl_status,
    fix_status,
    marketing_prep_status,
    marketing_edit_status,
    position,
    memo1,
    memo2,
  } = body as {
    plan_text?: string;
    impl_status?: "none" | "done";
    fix_status?: "none" | "done";
    marketing_prep_status?: "none" | "done";
    marketing_edit_status?: "none" | "done";
    position?: number;
    memo1?: string;
    memo2?: string;
  };

  const update: Record<string, string | number> = {};
  if (plan_text !== undefined) update.plan_text = plan_text;
  if (impl_status !== undefined) update.impl_status = impl_status;
  if (fix_status !== undefined) update.fix_status = fix_status;
  if (marketing_prep_status !== undefined) update.marketing_prep_status = marketing_prep_status;
  if (marketing_edit_status !== undefined) update.marketing_edit_status = marketing_edit_status;
  if (position !== undefined) update.position = position;
  if (memo1 !== undefined) update.memo1 = memo1;
  if (memo2 !== undefined) update.memo2 = memo2;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("project_tasks").update(update).eq("id", id);

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
  const { error } = await supabase.from("project_tasks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
