"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateJST, getTodayJST } from "@/lib/date-utils";

type Task = {
  id: string;
  task_text: string;
  done: boolean;
  date_jst: string;
};

type DayBlock = {
  date: string;
  tasks: Task[];
  isRest: boolean;
  workHours: number | null;
  workMinutes: number | null;
  comment: string | null;
};

const START_DATE = "2026-08-01";

function getDatesFromStartToToday(): string[] {
  const today = getTodayJST();
  const dates: string[] = [];
  const current = new Date(today + "T00:00:00");
  const start = new Date(START_DATE + "T00:00:00");

  while (current >= start) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() - 1);
  }

  return dates;
}

export default function CalendarPage() {
  const supabase = createClient();
  const [days, setDays] = useState<DayBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [tasksRes, restRes, workRes] = await Promise.all([
      supabase
        .from("daily_tasks")
        .select("id, task_text, done, date_jst")
        .gte("date_jst", START_DATE)
        .order("created_at", { ascending: true }),
      supabase
        .from("rest_days")
        .select("date_jst")
        .gte("date_jst", START_DATE),
      supabase
        .from("work_hours")
        .select("date_jst, work_hours_part, work_minutes_part, comment")
        .gte("date_jst", START_DATE),
    ]);

    const tasksByDate: Record<string, Task[]> = {};
    for (const t of tasksRes.data ?? []) {
      if (!tasksByDate[t.date_jst]) tasksByDate[t.date_jst] = [];
      tasksByDate[t.date_jst].push(t);
    }

    const restSet = new Set((restRes.data ?? []).map((r) => r.date_jst));

    const workByDate: Record<
      string,
      { h: number | null; m: number | null; comment: string | null }
    > = {};
    for (const w of workRes.data ?? []) {
      workByDate[w.date_jst] = {
        h: w.work_hours_part,
        m: w.work_minutes_part,
        comment: w.comment,
      };
    }

    const allDates = getDatesFromStartToToday();
    const blocks: DayBlock[] = [];

    for (const date of allDates) {
      const tasks = tasksByDate[date] ?? [];
      const isRest = restSet.has(date);
      const work = workByDate[date];

      if (tasks.length === 0 && !isRest && !work) continue;

      blocks.push({
        date,
        tasks,
        isRest,
        workHours: work?.h ?? null,
        workMinutes: work?.m ?? null,
        comment: work?.comment ?? null,
      });
    }

    setDays(blocks);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleTask(taskId: string, currentDone: boolean) {
    const newDone = !currentDone;
    const { error } = await supabase
      .from("daily_tasks")
      .update({
        done: newDone,
        checked_at: newDone ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (!error) {
      setDays((prev) =>
        prev.map((day) => ({
          ...day,
          tasks: day.tasks.map((t) =>
            t.id === taskId ? { ...t, done: newDone } : t
          ),
        }))
      );
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold">記録</h1>

      {days.length === 0 && (
        <p className="text-sm text-gray-400">まだ記録がありません</p>
      )}

      {days.map((day, index) => {
        const allDone =
          day.tasks.length > 0 && day.tasks.every((t) => t.done);
        const dayPoints = day.tasks.filter((t) => t.done).length;
        const cumulativePoints = days
          .slice(index)
          .reduce((sum, d) => sum + d.tasks.filter((t) => t.done).length, 0);

        let bgClass = "";
        if (day.isRest) {
          bgClass = "bg-[#ECEFF1]";
        } else if (allDone) {
          bgClass = "bg-[#E8F5E9]";
        }

        return (
          <div
            key={day.date}
            className={`rounded border border-gray-200 p-4 ${bgClass}`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-bold text-sm">
                {formatDateJST(day.date)}
              </span>
              {!day.isRest && (
                <span className="text-sm">
                  <span className="text-red-600 font-bold">{dayPoints}pt</span>
                  <span className="text-gray-400 ml-2">(累計{cumulativePoints}pt)</span>
                </span>
              )}
            </div>

            {day.isRest ? (
              <p className="text-center text-gray-500 font-medium py-2">
                休み
              </p>
            ) : (
              <div className="space-y-1">
                {day.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleTask(task.id, task.done)}
                  >
                    <span
                      className={`text-base font-bold min-w-[20px] text-center ${
                        task.done ? "text-green-500" : "text-gray-400"
                      }`}
                    >
                      {task.done ? "○" : "✕"}
                    </span>
                    <span className="text-sm">{task.task_text}</span>
                  </div>
                ))}
              </div>
            )}

            {!day.isRest &&
              (day.workHours !== null || day.workMinutes !== null) && (
                <p className="text-xs text-gray-500 mt-2">
                  だいたい
                  {day.workHours ? `${day.workHours}時間` : ""}
                  {day.workMinutes ? `${day.workMinutes}分` : ""}
                  作業
                </p>
              )}

            {!day.isRest && day.comment && (
              <p className="text-xs text-gray-600 mt-1">{day.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
