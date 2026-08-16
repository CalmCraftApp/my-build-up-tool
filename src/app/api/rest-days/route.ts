import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date_jst } = body as { date_jst?: string };

  if (!date_jst) {
    return NextResponse.json({ error: "date_jst is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("rest_days").insert({ date_jst });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("rest_days").delete().eq("date_jst", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
