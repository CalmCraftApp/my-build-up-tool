"use client";

import { useEffect, useState, useCallback } from "react";

type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export default function TodosPage() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/todos");
    const data: { items: TodoItem[] } = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function persistOrder(ordered: TodoItem[]) {
    await fetch("/api/todos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered.map((i) => i.id) }),
    });
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setItems((prev) => [data, ...prev]);
      setNewText("");
    }
  }

  async function toggleItem(id: string, currentDone: boolean) {
    const newDone = !currentDone;
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: newDone }),
    });

    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, done: newDone } : i))
      );
    }
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function updateItem(id: string) {
    if (!editText.trim()) return;
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: editText.trim() }),
    });

    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, text: editText.trim() } : i))
      );
      setEditingId(null);
      setEditText("");
    }
  }

  function moveItem(id: string, direction: -1 | 1) {
    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      persistOrder(updated);
      return updated;
    });
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;

    setItems((prev) => {
      const dragIndex = prev.findIndex((i) => i.id === dragId);
      const overIndex = prev.findIndex((i) => i.id === overId);
      if (dragIndex === -1 || overIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(overIndex, 0, moved);
      return updated;
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragId(null);
    persistOrder(items);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        読み込み中...
      </div>
    );
  }

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  const progressPercent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-lg font-bold">やること</h1>

      <div className="rounded border border-gray-200 p-4 space-y-2">
        <div className="text-center text-2xl font-bold">
          {doneCount} / {total} 完了
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-green-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <form onSubmit={addItem} className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="新しいやることを入力..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
        >
          追加
        </button>
      </form>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-gray-400">やることがまだありません</p>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDrop={handleDrop}
            onDragEnd={handleDrop}
            className={`flex items-center gap-3 rounded border border-gray-200 px-3 py-2 bg-white hover:bg-gray-50 cursor-move ${
              dragId === item.id ? "opacity-50" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleItem(item.id, item.done)}
              className="h-5 w-5 min-w-[20px] accent-green-600 cursor-pointer"
            />

            {editingId === item.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); updateItem(item.id); }}
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
                  className={`flex-1 text-sm ${item.done ? "line-through text-gray-400" : ""}`}
                >
                  {item.text}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveItem(item.id, -1)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                    aria-label="上へ"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(item.id, 1)}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                    aria-label="下へ"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => { setEditingId(item.id); setEditText(item.text); }}
                    className="text-xs text-gray-400 hover:text-blue-600 px-1"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
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
      </div>
    </div>
  );
}
