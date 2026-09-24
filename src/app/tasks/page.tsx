"use client";

import { useEffect, useState, useCallback } from "react";

type Status = "none" | "done";

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

export default function TasksPage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold">タスク</h1>

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
                <td
                  className={`p-0 ${
                    row.impl_status === "done" ? "bg-[#E8F5E9]" : ""
                  }`}
                >
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
                    <option value="done">終了</option>
                  </select>
                </td>
                <td
                  className={`p-0 ${
                    row.fix_status === "done" ? "bg-[#E8F5E9]" : ""
                  }`}
                >
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
                    <option value="done">終了</option>
                  </select>
                </td>
                <td
                  className={`p-0 ${
                    row.marketing_prep_status === "done" ? "bg-[#E8F5E9]" : ""
                  }`}
                >
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
                    <option value="done">終了</option>
                  </select>
                </td>
                <td
                  className={`p-0 ${
                    row.marketing_edit_status === "done" ? "bg-[#E8F5E9]" : ""
                  }`}
                >
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
    </div>
  );
}
