const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

export function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const d = String(jst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateJST(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = DAY_NAMES[date.getDay()];
  return `${y}年${m}月${d}日(${dow})`;
}
