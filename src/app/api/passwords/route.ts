import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("passwords")
    .select("id, media, email, password, note, position")
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { media, email, password, note } = body as {
    media?: string;
    email?: string;
    password?: string;
    note?: string;
  };

  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("passwords")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("passwords")
    .insert({
      media: media?.trim() ?? "",
      email: email?.trim() ?? "",
      password: password ?? "",
      note: note ?? "",
      position: nextPosition,
    })
    .select("id, media, email, password, note, position")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
