import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  if (!from) {
    return NextResponse.json({ error: "from is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [tasksRes, restRes, workRes, titlesRes, checklistRes] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select("id, task_text, done, date_jst")
      .gte("date_jst", from)
      .order("created_at", { ascending: true }),
    supabase.from("rest_days").select("date_jst").gte("date_jst", from),
    supabase
      .from("work_hours")
      .select("date_jst, work_hours_part, work_minutes_part, comment")
      .gte("date_jst", from),
    supabase
      .from("daily_titles")
      .select("id, title, date_jst")
      .gte("date_jst", from)
      .order("created_at", { ascending: true }),
    supabase
      .from("daily_checklist")
      .select("date_jst, item_key, checked")
      .gte("date_jst", from),
  ]);

  return NextResponse.json({
    tasks: tasksRes.data ?? [],
    restDays: restRes.data ?? [],
    workHours: workRes.data ?? [],
    titles: titlesRes.data ?? [],
    checklist: checklistRes.data ?? [],
  });
}
