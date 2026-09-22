import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_tasks")
    .select("id, plan_text, impl_status, marketing_status, position")
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { plan_text } = body as { plan_text?: string };

  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("project_tasks")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({ plan_text: plan_text?.trim() ?? "", position: nextPosition })
    .select("id, plan_text, impl_status, marketing_status, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
