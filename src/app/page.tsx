"use client";

import { useEffect, useState, useCallback } from "react";
import { getTodayJST, formatDateJST } from "@/lib/date-utils";

type Task = {
  id: string;
  task_text: string;
  done: boolean;
  position: number;
};

type Title = {
  id: string;
  title: string;
  position: number;
};

type WorkHoursRecord = {
  work_hours_part: number | null;
  work_minutes_part: number | null;
  comment: string | null;
};

type DayResponse = {
  tasks: Task[];
  totalPoints: number;
  isRest: boolean;
  workHours: WorkHoursRecord | null;
  titles: Title[];
};

export default function HomePage() {
  const today = getTodayJST();

  const [selectedDate, setSelectedDate] = useState(today);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [titles, setTitles] = useState<Title[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragTitleId, setDragTitleId] = useState<string | null>(null);
  const [isRest, setIsRest] = useState(false);
  const [workHours, setWorkHours] = useState("");
  const [workMinutes, setWorkMinutes] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/day?date=${selectedDate}`);
    const data: DayResponse = await res.json();

    setTasks(data.tasks ?? []);
    setTotalPoints(data.totalPoints ?? 0);
    setTitles(data.titles ?? []);
    setIsRest(data.isRest ?? false);

    if (data.workHours) {
      setWorkHours(data.workHours.work_hours_part?.toString() ?? "");
      setWorkMinutes(data.workHours.work_minutes_part?.toString() ?? "");
      setComment(data.workHours.comment ?? "");
    }

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeDate(date: string) {
    setSelectedDate(date);
    setTasks([]);
    setTitles([]);
    setIsRest(false);
    setWorkHours("");
    setWorkMinutes("");
    setComment("");
    setLoading(true);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_jst: selectedDate, task_text: newTask.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => [...prev, data]);
      setNewTask("");
    }
  }

  async function toggleTask(taskId: string, currentDone: boolean) {
    const newDone = !currentDone;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t))
      );
      setTotalPoints((prev) => prev + (newDone ? 1 : -1));
    }
  }

  async function deleteTask(taskId: string, wasDone: boolean) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });

    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (wasDone) setTotalPoints((prev) => prev - 1);
    }
  }

  async function updateTask(taskId: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_text: editText.trim() }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, task_text: editText.trim() } : t))
      );
      setEditingId(null);
      setEditText("");
    }
  }

  async function persistTaskOrder(ordered: Task[]) {
    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered.map((t) => t.id) }),
    });
  }

  function moveTask(id: string, direction: -1 | 1) {
    setTasks((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      persistTaskOrder(updated);
      return updated;
    });
  }

  function handleTaskDragStart(id: string) {
    setDragTaskId(id);
  }

  function handleTaskDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragTaskId || dragTaskId === overId) return;

    setTasks((prev) => {
      const dragIndex = prev.findIndex((t) => t.id === dragTaskId);
      const overIndex = prev.findIndex((t) => t.id === overId);
      if (dragIndex === -1 || overIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(overIndex, 0, moved);
      return updated;
    });
  }

  function handleTaskDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragTaskId(null);
    persistTaskOrder(tasks);
  }

  async function addTitle(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const res = await fetch("/api/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date_jst: selectedDate, title: newTitle.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setTitles((prev) => [...prev, data]);
      setNewTitle("");
    }
  }

  async function deleteTitle(titleId: string) {
    const res = await fetch(`/api/titles/${titleId}`, { method: "DELETE" });

    if (res.ok) {
      setTitles((prev) => prev.filter((t) => t.id !== titleId));
    }
  }

  async function updateTitle(titleId: string) {
    if (!editTitleText.trim()) return;
    const res = await fetch(`/api/titles/${titleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitleText.trim() }),
    });

    if (res.ok) {
      setTitles((prev) =>
        prev.map((t) =>
          t.id === titleId ? { ...t, title: editTitleText.trim() } : t
        )
      );
      setEditingTitleId(null);
      setEditTitleText("");
    }
  }

  async function persistTitleOrder(ordered: Title[]) {
    await fetch("/api/titles/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered.map((t) => t.id) }),
    });
  }

  function moveTitle(id: string, direction: -1 | 1) {
    setTitles((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      persistTitleOrder(updated);
      return updated;
    });
  }

  function handleTitleDragStart(id: string) {
    setDragTitleId(id);
  }

  function handleTitleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragTitleId || dragTitleId === overId) return;

    setTitles((prev) => {
      const dragIndex = prev.findIndex((t) => t.id === dragTitleId);
      const overIndex = prev.findIndex((t) => t.id === overId);
      if (dragIndex === -1 || overIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(overIndex, 0, moved);
      return updated;
    });
  }

  function handleTitleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragTitleId(null);
    persistTitleOrder(titles);
  }

  async function toggleRest() {
    if (isRest) {
      await fetch(`/api/rest-days?date=${selectedDate}`, { method: "DELETE" });
      setIsRest(false);
    } else {
      await fetch("/api/rest-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_jst: selectedDate }),
      });
      setIsRest(true);
    }
  }

  async function saveWorkHours(h: string, m: string) {
    const hoursVal = h === "" ? null : parseInt(h, 10);
    const minsVal = m === "" ? null : parseInt(m, 10);

    await fetch("/api/work-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_jst: selectedDate,
        work_hours_part: hoursVal,
        work_minutes_part: minsVal,
        comment,
      }),
    });
  }

  async function saveComment(newComment: string) {
    const hoursVal = workHours === "" ? null : parseInt(workHours, 10);
    const minsVal = workMinutes === "" ? null : parseInt(workMinutes, 10);

    await fetch("/api/work-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_jst: selectedDate,
        work_hours_part: hoursVal,
        work_minutes_part: minsVal,
        comment: newComment,
      }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="space-y-1.5 rounded border border-gray-200 px-3 py-2 text-[10px] leading-snug text-gray-600">
        <div>
          <p className="font-bold">「ワクワクする目標」</p>
          <p>来年4月、響人の入学祝いとして本人に10万円、さらに大阪茨木キャンパスまで来る親の交通費・ホテル代・食事代も含めて合計30万円を自分の事業で用意する</p>
        </div>
        <div>
          <p className="font-bold">「そのための行動」</p>
          <p>
            5日に1本のペースで新しいサービスを公開し、各サービスにつき通常動画1本+ショート動画1本を投稿する。課金を狙う、そうでなくても受託開発の窓口として機能させる。
          </p>
        </div>
        <div>
          <p className="font-bold">「ワクワクする戦略」</p>
          <p>
            自分自身がワクワクすること・関心があること・興味があること
            ✕ 困っている人・業務効率の悪い現場を見ると助けたくなる・作りたくなる私の特性を活用する
            ✕ 多くの人が使っているツールと組み合わせる
            ✕ 市場性がある(長期的にも)
            ✕ とりあえず作る・試行回数
            ✕ データが溜まり、継続して課金されやすい
            ✕ 生成AIに簡単に乗っ取られない
            ✕ 独自の世界観
            ✕ 2週間以内に作る(企画も含めて)
            ✕ 生成AIAPIとの相性が良い
          </p>
        </div>
        <div>
          <p className="font-bold">「マインド」</p>
          <p>1. 「確信は後から来る」</p>
          <p>→ 今「これで合ってるか」と不安になるのは普通のこと。答えは、動いた後にしかわからない。今わからなくて当然。</p>
          <p>2. 「これは100個のうちの1個」</p>
          <p>→ 1個1個を正解にしようとしない。当たるかどうかより、数をこなすこと自体が目的。外れても失敗じゃない。</p>
          <p>3. 「AIに聞くのは、もう終わり」</p>
          <p>→ AIに聞いても正確な答えはでない。結局は手を動かして、自分自身で確認するしかない。</p>
          <p>4. 「今日、これをやった」</p>
          <p>→ 成果を求めるのは大事。だが1日ごと成果にフォーカスしたら身が持たない。今日手を動かしたか、今日を楽しめたか、を見る。それだけで十分。</p>
        </div>
      </div>

      <div className="text-center">
        <span className="text-3xl font-bold">累計 {totalPoints}pt</span>
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold">{formatDateJST(selectedDate)}</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => changeDate(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
        {selectedDate !== today && (
          <button
            onClick={() => changeDate(today)}
            className="text-xs text-blue-600 hover:underline"
          >
            今日に戻す
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">日のタイトル</h3>
        {titles.map((t) => (
          <div
            key={t.id}
            draggable
            onDragStart={() => handleTitleDragStart(t.id)}
            onDragOver={(e) => handleTitleDragOver(e, t.id)}
            onDrop={handleTitleDrop}
            onDragEnd={handleTitleDrop}
            className={`flex items-center gap-3 rounded border border-gray-200 px-3 py-2 hover:bg-gray-50 cursor-move ${
              dragTitleId === t.id ? "opacity-50" : ""
            }`}
          >
            {editingTitleId === t.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); updateTitle(t.id); }}
                className="flex flex-1 gap-2"
              >
                <input
                  type="text"
                  value={editTitleText}
                  onChange={(e) => setEditTitleText(e.target.value)}
                  autoFocus
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button type="submit" className="text-xs text-blue-600 hover:underline">保存</button>
                <button type="button" onClick={() => setEditingTitleId(null)} className="text-xs text-gray-400 hover:underline">取消</button>
              </form>
            ) : (
              <>
                <span draggable={false} className="flex-1 text-sm font-medium select-text">
                  {t.title}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveTitle(t.id, -1)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                    aria-label="上へ"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveTitle(t.id, 1)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                    aria-label="下へ"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => { setEditingTitleId(t.id); setEditTitleText(t.title); }}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteTitle(t.id)}
                    className="text-xs text-gray-400 hover:text-red-600 px-1"
                  >
                    削除
                  </button>
                  <span className="text-gray-300 select-none px-1">⠿</span>
                </div>
              </>
            )}
          </div>
        ))}
        <form onSubmit={addTitle} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="今日やること..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 whitespace-nowrap"
          >
            追加
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">タスク</h3>
        {tasks.length === 0 && (
          <p className="text-sm text-gray-400">タスクがまだありません</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={() => handleTaskDragStart(task.id)}
            onDragOver={(e) => handleTaskDragOver(e, task.id)}
            onDrop={handleTaskDrop}
            onDragEnd={handleTaskDrop}
            className={`flex items-center gap-3 rounded border border-gray-200 px-3 py-2 hover:bg-gray-50 cursor-move ${
              dragTaskId === task.id ? "opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => toggleTask(task.id, task.done)}
              className="h-5 w-5 min-w-[20px] accent-green-600 cursor-pointer"
            />
            {editingId === task.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); updateTask(task.id); }}
                className="flex flex-1 gap-2"
              >
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button type="submit" className="text-xs text-blue-600 hover:underline">保存</button>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:underline">取消</button>
              </form>
            ) : (
              <>
                <span
                  draggable={false}
                  className={`flex-1 text-sm select-text ${task.done ? "line-through text-gray-400" : ""}`}
                >
                  {task.task_text}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveTask(task.id, -1)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                    aria-label="上へ"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveTask(task.id, 1)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                    aria-label="下へ"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => { setEditingId(task.id); setEditText(task.task_text); }}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteTask(task.id, task.done)}
                    className="text-xs text-gray-400 hover:text-red-600 px-1"
                  >
                    削除
                  </button>
                  <span className="text-gray-300 select-none px-1">⠿</span>
                </div>
              </>
            )}
          </div>
        ))}
        <form onSubmit={addTask} className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
          >
            追加
          </button>
        </form>
      </div>

      <button
        onClick={toggleRest}
        className={`w-full rounded py-2 text-sm font-medium ${
          isRest
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "border border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {isRest ? "休みを解除する" : "今日は休みにする"}
      </button>

      <div className="space-y-3 rounded border border-gray-200 p-4">
        <h3 className="text-sm font-bold">作業時間</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="24"
            value={workHours}
            onChange={(e) => {
              setWorkHours(e.target.value);
              saveWorkHours(e.target.value, workMinutes);
            }}
            placeholder="0"
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm">時間</span>
          <input
            type="number"
            min="0"
            max="59"
            value={workMinutes}
            onChange={(e) => {
              setWorkMinutes(e.target.value);
              saveWorkHours(workHours, e.target.value);
            }}
            placeholder="0"
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
          />
          <span className="text-sm">分</span>
        </div>

        <h3 className="text-sm font-bold">一言コメント</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={(e) => saveComment(e.target.value)}
          placeholder="今日の振り返りなど..."
          rows={2}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}
