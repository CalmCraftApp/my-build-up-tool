"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDateJST, getTodayJST } from "@/lib/date-utils";

type Task = {
  id: string;
  task_text: string;
  done: boolean;
  date_jst: string;
};

type Title = {
  id: string;
  title: string;
  date_jst: string;
};

type DayBlock = {
  date: string;
  tasks: Task[];
  titles: Title[];
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

type RecordsResponse = {
  tasks: Task[];
  restDays: { date_jst: string }[];
  workHours: { date_jst: string; work_hours_part: number | null; work_minutes_part: number | null; comment: string | null }[];
  titles: Title[];
};

function getMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const [days, setDays] = useState<DayBlock[]>([]);
  const [titlesByDate, setTitlesByDate] = useState<Record<string, Title[]>>({});
  const [restDates, setRestDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const today = getTodayJST();
  const [viewYear, viewMonth] = today.split("-").map(Number);
  const [view, setView] = useState<{ year: number; month: number }>({
    year: viewYear,
    month: viewMonth,
  });

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/records?from=${START_DATE}`);
    const data: RecordsResponse = await res.json();

    const tasksByDate: Record<string, Task[]> = {};
    for (const t of data.tasks ?? []) {
      if (!tasksByDate[t.date_jst]) tasksByDate[t.date_jst] = [];
      tasksByDate[t.date_jst].push(t);
    }

    const restSet = new Set((data.restDays ?? []).map((r) => r.date_jst));

    const titlesByDate: Record<string, Title[]> = {};
    for (const t of data.titles ?? []) {
      if (!titlesByDate[t.date_jst]) titlesByDate[t.date_jst] = [];
      titlesByDate[t.date_jst].push(t);
    }

    setTitlesByDate(titlesByDate);
    setRestDates(restSet);

    const workByDate: Record<
      string,
      { h: number | null; m: number | null; comment: string | null }
    > = {};
    for (const w of data.workHours ?? []) {
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
      const titles = titlesByDate[date] ?? [];
      const isRest = restSet.has(date);
      const work = workByDate[date];

      if (
        tasks.length === 0 &&
        titles.length === 0 &&
        !isRest &&
        !work
      )
        continue;

      blocks.push({
        date,
        tasks,
        titles,
        isRest,
        workHours: work?.h ?? null,
        workMinutes: work?.m ?? null,
        comment: work?.comment ?? null,
      });
    }

    setDays(blocks);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeMonth(delta: number) {
    setView((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month < 1) {
        month = 12;
        year -= 1;
      } else if (month > 12) {
        month = 1;
        year += 1;
      }
      return { year, month };
    });
  }

  async function toggleTask(taskId: string, currentDone: boolean) {
    const newDone = !currentDone;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });

    if (res.ok) {
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

      <div className="rounded border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => changeMonth(-1)}
            className="text-sm text-gray-500 hover:text-blue-600 px-2"
          >
            ◀
          </button>
          <span className="font-bold text-sm">
            {view.year}年{view.month}月
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="text-sm text-gray-500 hover:text-blue-600 px-2"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
          {WEEKDAY_LABELS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getMonthGrid(view.year, view.month)
            .flat()
            .map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;

              const dayNum = Number(date.split("-")[2]);
              const isToday = date === today;
              const isRest = restDates.has(date);
              const titlesForDay = titlesByDate[date] ?? [];
              const hasRecord = titlesForDay.length > 0 || isRest;

              const cell = (
                <div
                  className={`min-h-[56px] rounded border p-1 text-left ${
                    isRest
                      ? "bg-[#ECEFF1] border-gray-200"
                      : "border-gray-100"
                  } ${isToday ? "ring-2 ring-blue-400" : ""}`}
                >
                  <div className="text-[11px] text-gray-400">{dayNum}</div>
                  {isRest && (
                    <div className="text-[10px] text-gray-500">休み</div>
                  )}
                  {titlesForDay.map((t) => (
                    <div
                      key={t.id}
                      className="text-[10px] leading-tight text-gray-700 break-words"
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              );

              return hasRecord ? (
                <a key={date} href={`#day-${date}`}>
                  {cell}
                </a>
              ) : (
                <div key={date}>{cell}</div>
              );
            })}
        </div>
      </div>

      {days.length === 0 && (
        <p className="text-sm text-gray-400">まだ記録がありません</p>
      )}

      {days.map((day, index) => {
        const anyDone = day.tasks.some((t) => t.done);
        const dayPoints = day.tasks.filter((t) => t.done).length;
        const cumulativePoints = days
          .slice(index)
          .reduce((sum, d) => sum + d.tasks.filter((t) => t.done).length, 0);

        let bgClass = "";
        if (day.isRest) {
          bgClass = "bg-[#ECEFF1]";
        } else if (anyDone) {
          bgClass = "bg-[#E8F5E9]";
        }

        return (
          <div
            key={day.date}
            id={`day-${day.date}`}
            className={`rounded border border-gray-200 p-4 scroll-mt-4 ${bgClass}`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-bold text-sm">
                {formatDateJST(day.date)}
              </span>
              {!day.isRest && (
                <span className="text-sm">
                  <span className="text-red-600 font-bold">{dayPoints}積上</span>
                  <span className="text-gray-400 ml-2">(累計{cumulativePoints}積上)</span>
                </span>
              )}
            </div>

            {day.isRest ? (
              <p className="text-center text-gray-500 font-medium py-2">
                休み
              </p>
            ) : (
              <div className="space-y-1">
                {day.titles.map((title) => (
                  <p key={title.id} className="text-sm font-bold text-gray-700">
                    {title.title}
                  </p>
                ))}
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

            {day.comment && (
              <p className="text-xs text-gray-600 mt-1">{day.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
