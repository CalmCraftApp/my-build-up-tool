import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateJST, getTodayJST } from "@/lib/date-utils";

function statusLabel(status: string): string {
  if (status === "done") return "終了";
  if (status === "in_progress") return "途中";
  return "未着手";
}

export async function GET() {
  const supabase = createAdminClient();

  const [titlesRes, tasksRes, restRes, workRes, projectRes, nonBizRes] =
    await Promise.all([
      supabase
        .from("daily_titles")
        .select("date_jst, title, position")
        .order("date_jst", { ascending: true })
        .order("position", { ascending: true }),
      supabase
        .from("daily_tasks")
        .select("date_jst, task_text, done, position")
        .order("date_jst", { ascending: true })
        .order("position", { ascending: true }),
      supabase
        .from("rest_days")
        .select("date_jst")
        .order("date_jst", { ascending: true }),
      supabase
        .from("work_hours")
        .select("date_jst, work_hours_part, work_minutes_part, comment")
        .order("date_jst", { ascending: true }),
      supabase
        .from("project_tasks")
        .select(
          "plan_text, impl_status, fix_status, marketing_prep_status, marketing_edit_status, memo1, memo2, position"
        )
        .order("position", { ascending: true }),
      supabase
        .from("non_business_tasks")
        .select("task_text, done, position")
        .order("position", { ascending: true }),
    ]);

  const titles = titlesRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const restDays = restRes.data ?? [];
  const workHours = workRes.data ?? [];
  const projectTasks = projectRes.data ?? [];
  const nonBusinessTasks = nonBizRes.data ?? [];

  const dateSet = new Set<string>();
  titles.forEach((t) => dateSet.add(t.date_jst));
  tasks.forEach((t) => dateSet.add(t.date_jst));
  restDays.forEach((r) => dateSet.add(r.date_jst));
  workHours.forEach((w) => dateSet.add(w.date_jst));

  const dates = Array.from(dateSet).sort();

  const titlesByDate = new Map<string, typeof titles>();
  const tasksByDate = new Map<string, typeof tasks>();
  const workByDate = new Map<string, (typeof workHours)[number]>();
  const restSet = new Set(restDays.map((r) => r.date_jst));

  for (const t of titles) {
    const list = titlesByDate.get(t.date_jst) ?? [];
    list.push(t);
    titlesByDate.set(t.date_jst, list);
  }
  for (const t of tasks) {
    const list = tasksByDate.get(t.date_jst) ?? [];
    list.push(t);
    tasksByDate.set(t.date_jst, list);
  }
  for (const w of workHours) {
    workByDate.set(w.date_jst, w);
  }

  const lines: string[] = [];
  lines.push("=".repeat(40));
  lines.push("my-build-up-tool 全データエクスポート");
  lines.push(`出力日時: ${getTodayJST()}`);
  lines.push("=".repeat(40));
  lines.push("");
  lines.push("■ 日次記録");
  lines.push("");

  for (const date of dates) {
    lines.push("-".repeat(30));
    lines.push(formatDateJST(date));
    lines.push("-".repeat(30));

    if (restSet.has(date)) {
      lines.push("休み");
    }

    const dayTitles = titlesByDate.get(date) ?? [];
    if (dayTitles.length > 0) {
      lines.push("[タイトル]");
      for (const t of dayTitles) lines.push(`- ${t.title}`);
    }

    const dayTasks = tasksByDate.get(date) ?? [];
    if (dayTasks.length > 0) {
      lines.push("[タスク]");
      for (const t of dayTasks) {
        lines.push(`${t.done ? "[x]" : "[ ]"} ${t.task_text}`);
      }
    }

    const work = workByDate.get(date);
    if (work) {
      const parts: string[] = [];
      if (work.work_hours_part) parts.push(`${work.work_hours_part}時間`);
      if (work.work_minutes_part) parts.push(`${work.work_minutes_part}分`);
      if (parts.length > 0) lines.push(`作業時間: ${parts.join("")}`);
      if (work.comment) lines.push(`コメント: ${work.comment}`);
    }

    lines.push("");
  }

  lines.push("");
  lines.push("■ タスク表(事業)");
  lines.push("");
  projectTasks.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.plan_text || "(無題)"}`);
    lines.push(
      `   実装:${statusLabel(p.impl_status)} / 設定〜修正:${statusLabel(
        p.fix_status
      )} / マ素材準備:${statusLabel(
        p.marketing_prep_status
      )} / マ編集完了:${statusLabel(p.marketing_edit_status)}`
    );
    if (p.memo1) lines.push(`   メモ➀: ${p.memo1}`);
    if (p.memo2) lines.push(`   メモ➁: ${p.memo2}`);
  });

  lines.push("");
  lines.push("■ タスク表(事業外)");
  lines.push("");
  nonBusinessTasks.forEach((t) => {
    lines.push(`${t.done ? "[x]" : "[ ]"} ${t.task_text}`);
  });

  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="all-data_${getTodayJST()}.txt"`,
    },
  });
}
