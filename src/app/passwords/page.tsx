"use client";

import { useEffect, useState, useCallback } from "react";

type PasswordRow = {
  id: string;
  media: string;
  email: string;
  password: string;
  note: string;
  position: number;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="コピー"
      title="コピー"
      className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
    >
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function PasswordsPage() {
  const [rows, setRows] = useState<PasswordRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/passwords");
    const data: PasswordRow[] = await res.json();
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addRow() {
    const res = await fetch("/api/passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media: "", email: "", password: "", note: "" }),
    });

    if (res.ok) {
      const data = await res.json();
      setRows((prev) => [...prev, data]);
    }
  }

  async function deleteRow(id: string) {
    const res = await fetch(`/api/passwords/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function updateField(id: string, field: "media" | "email" | "password" | "note", value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function saveField(id: string, field: "media" | "email" | "password" | "note", value: string) {
    await fetch(`/api/passwords/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-lg font-bold">パスワード</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          読み込み中...
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-gray-400">登録がまだありません</p>
            )}
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded border border-gray-200 px-3 py-2 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.media}
                    onChange={(e) => updateField(row.id, "media", e.target.value)}
                    onBlur={(e) => saveField(row.id, "media", e.target.value)}
                    placeholder="媒体"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="text-xs text-gray-300 hover:text-red-600 px-1"
                    aria-label="削除"
                  >
                    削除
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.email}
                    onChange={(e) => updateField(row.id, "email", e.target.value)}
                    onBlur={(e) => saveField(row.id, "email", e.target.value)}
                    placeholder="メールアドレス"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <CopyButton value={row.email} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={row.password}
                    onChange={(e) => updateField(row.id, "password", e.target.value)}
                    onBlur={(e) => saveField(row.id, "password", e.target.value)}
                    placeholder="パスワード"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <CopyButton value={row.password} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.note}
                    onChange={(e) => updateField(row.id, "note", e.target.value)}
                    onBlur={(e) => saveField(row.id, "note", e.target.value)}
                    placeholder="補足"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
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
