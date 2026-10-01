"use client";

import { useEffect, useState, useCallback } from "react";

type Status = "none" | "in_progress" | "done";

function statusBgClass(status: Status): string {
  if (status === "done") return "bg-[#E8F5E9]";
  if (status === "in_progress") return "bg-[#FFF8E1]";
  return "";
}

type ProjectTask = {
  id: string;
  plan_text: string;
  impl_status: Status;
  fix_status: Status;
  marketing_prep_status: Status;
  marketing_edit_status: Status;
  position: number;
  memo1: string;
  memo2: string;
};

type NonBusinessTask = {
  id: string;
  task_text: string;
  done: boolean;
  position: number;
};

function NonBusinessTasksTab() {
  const [tasks, setTasks] = useState<NonBusinessTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/non-business-tasks");
    const data: NonBusinessTask[] = await res.json();
    setTasks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;

    const res = await fetch("/api/non-business-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_text: newTask.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setTasks((prev) => [...prev, data]);
      setNewTask("");
    }
  }

  async function toggleTask(taskId: string, currentDone: boolean) {
    const newDone = !currentDone;
    const res = await fetch(`/api/non-business-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });

    if (res.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, done: newDone } : t))
      );
    }
  }

  async function deleteTask(taskId: string) {
    const res = await fetch(`/api/non-business-tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  }

  async function updateTask(taskId: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/non-business-tasks/${taskId}`, {
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

  async function persistOrder(ordered: NonBusinessTask[]) {
    await fetch("/api/non-business-tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered.map((t) => t.id) }),
    });
  }

  function handleDragStart(id: string) {
    setDragTaskId(id);
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragTaskId(null);
    persistOrder(tasks);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.length === 0 && (
        <p className="text-sm text-gray-400">タスクがまだありません</p>
      )}
      {tasks.map((task) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => handleDragStart(task.id)}
          onDragOver={(e) => handleDragOver(e, task.id)}
          onDrop={handleDrop}
          onDragEnd={handleDrop}
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
                  onClick={() => { setEditingId(task.id); setEditText(task.task_text); }}
                  className="text-xs text-gray-400 hover:text-blue-600 px-1"
                >
                  編集
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
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
  );
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<"business" | "non_business">("business");
  const [rows, setRows] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/project-tasks");
    const data: ProjectTask[] = await res.json();
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addRow() {
    const res = await fetch("/api/project-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_text: "" }),
    });

    if (res.ok) {
      const data = await res.json();
      setRows((prev) => [...prev, data]);
    }
  }

  async function deleteRow(id: string) {
    const res = await fetch(`/api/project-tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function updatePlanText(id: string, plan_text: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, plan_text } : r)));
  }

  async function savePlanText(id: string, plan_text: string) {
    await fetch(`/api/project-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_text }),
    });
  }

  function updateMemoText(id: string, field: "memo1" | "memo2", value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function saveMemoText(id: string, field: "memo1" | "memo2", value: string) {
    await fetch(`/api/project-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function updateStatus(
    id: string,
    field: "impl_status" | "fix_status" | "marketing_prep_status" | "marketing_edit_status",
    value: Status
  ) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );

    await fetch(`/api/project-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function persistOrder(newRows: ProjectTask[]) {
    await Promise.all(
      newRows.map((r, i) =>
        fetch(`/api/project-tasks/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: i }),
        })
      )
    );
  }

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newRows = [...rows];
    const [moved] = newRows.splice(dragIndex, 1);
    newRows.splice(dropIndex, 0, moved);

    setRows(newRows);
    setDragIndex(null);
    setDragOverIndex(null);
    persistOrder(newRows);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold">タスク</h1>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("business")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "business"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          事業
        </button>
        <button
          onClick={() => setActiveTab("non_business")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "non_business"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          事業外
        </button>
      </div>

      {activeTab === "non_business" ? (
        <NonBusinessTasksTab />
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          読み込み中...
        </div>
      ) : (
      <>
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="border-collapse text-sm" style={{ tableLayout: "fixed", width: "972px" }}>
          <colgroup>
            <col style={{ width: "28px" }} />
            <col style={{ width: "192px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "96px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "32px" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 text-left text-xs text-gray-500">
              <th className="border-b border-gray-200" />
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                企画+プロンプト作成
              </th>
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                実装
              </th>
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                設定～修正
              </th>
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                マ素材準備
              </th>
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                マ編集完了
              </th>
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                メモ➀
              </th>
              <th className="border-b border-gray-200 px-3 py-2 font-medium">
                メモ➁
              </th>
              <th className="border-b border-gray-200" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b border-gray-100 ${
                  dragOverIndex === index && dragIndex !== index
                    ? "bg-blue-50"
                    : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex((prev) => (prev === index ? null : prev))}
                onDrop={() => handleDrop(index)}
              >
                <td
                  className="p-0 text-center cursor-grab select-none text-gray-300 hover:text-gray-500"
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  aria-label="並び替え"
                >
                  ⋮⋮
                </td>
                <td className="p-0">
                  <input
                    type="text"
                    value={row.plan_text}
                    onChange={(e) => updatePlanText(row.id, e.target.value)}
                    onBlur={(e) => savePlanText(row.id, e.target.value)}
                    className="w-full px-3 py-2 focus:outline-none focus:bg-blue-50"
                  />
                </td>
                <td className={`p-0 ${statusBgClass(row.impl_status)}`}>
                  <select
                    value={row.impl_status}
                    onChange={(e) =>
                      updateStatus(
                        row.id,
                        "impl_status",
                        e.target.value as Status
                      )
                    }
                    className="w-full bg-transparent px-3 py-2 focus:outline-none"
                  >
                    <option value="none"></option>
                    <option value="in_progress">途中</option>
                    <option value="done">終了</option>
                  </select>
                </td>
                <td className={`p-0 ${statusBgClass(row.fix_status)}`}>
                  <select
                    value={row.fix_status}
                    onChange={(e) =>
                      updateStatus(
                        row.id,
                        "fix_status",
                        e.target.value as Status
                      )
                    }
                    className="w-full bg-transparent px-3 py-2 focus:outline-none"
                  >
                    <option value="none"></option>
                    <option value="in_progress">途中</option>
                    <option value="done">終了</option>
                  </select>
                </td>
                <td className={`p-0 ${statusBgClass(row.marketing_prep_status)}`}>
                  <select
                    value={row.marketing_prep_status}
                    onChange={(e) =>
                      updateStatus(
                        row.id,
                        "marketing_prep_status",
                        e.target.value as Status
                      )
                    }
                    className="w-full bg-transparent px-3 py-2 focus:outline-none"
                  >
                    <option value="none"></option>
                    <option value="in_progress">途中</option>
                    <option value="done">終了</option>
                  </select>
                </td>
                <td className={`p-0 ${statusBgClass(row.marketing_edit_status)}`}>
                  <select
                    value={row.marketing_edit_status}
                    onChange={(e) =>
                      updateStatus(
                        row.id,
                        "marketing_edit_status",
                        e.target.value as Status
                      )
                    }
                    className="w-full bg-transparent px-3 py-2 focus:outline-none"
                  >
                    <option value="none"></option>
                    <option value="in_progress">途中</option>
                    <option value="done">終了</option>
                  </select>
                </td>
                <td className="p-0">
                  <input
                    type="text"
                    value={row.memo1}
                    onChange={(e) => updateMemoText(row.id, "memo1", e.target.value)}
                    onBlur={(e) => saveMemoText(row.id, "memo1", e.target.value)}
                    className="w-full px-3 py-2 focus:outline-none focus:bg-blue-50"
                  />
                </td>
                <td className="p-0">
                  <input
                    type="text"
                    value={row.memo2}
                    onChange={(e) => updateMemoText(row.id, "memo2", e.target.value)}
                    onBlur={(e) => saveMemoText(row.id, "memo2", e.target.value)}
                    className="w-full px-3 py-2 focus:outline-none focus:bg-blue-50"
                  />
                </td>
                <td className="p-0 text-center">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-xs text-gray-300 hover:text-red-600 px-2"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="rounded bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        行を追加
      </button>
      </>
      )}
    </div>
  );
}
