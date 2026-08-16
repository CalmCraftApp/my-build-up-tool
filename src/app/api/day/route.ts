import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const [tasksRes, pointsRes, restRes, workRes, titlesRes, checklistRes] =
    await Promise.all([
      supabase
        .from("daily_tasks")
        .select("id, task_text, done")
        .eq("date_jst", date)
        .order("created_at", { ascending: true }),
      supabase.from("daily_tasks").select("id", { count: "exact" }).eq("done", true),
      supabase.from("rest_days").select("id").eq("date_jst", date),
      supabase
        .from("work_hours")
        .select("work_hours_part, work_minutes_part, comment")
        .eq("date_jst", date)
        .maybeSingle(),
      supabase
        .from("daily_titles")
        .select("id, title")
        .eq("date_jst", date)
        .order("created_at", { ascending: true }),
      supabase.from("daily_checklist").select("item_key, checked").eq("date_jst", date),
    ]);

  return NextResponse.json({
    tasks: tasksRes.data ?? [],
    totalPoints: pointsRes.count ?? 0,
    isRest: (restRes.data ?? []).length > 0,
    workHours: workRes.data ?? null,
    titles: titlesRes.data ?? [],
    checklist: checklistRes.data ?? [],
  });
}
