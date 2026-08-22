// この日より前は毎日チェックリスト自体が無かったので表示しない
export const CHECKLIST_START_DATE = "2026-08-12";

// startDate を持つ項目は、その日以降だけ表示する（途中から追加した項目用）
export const CHECKLIST_ITEMS = [
  {
    key: "work_1h",
    label: "1日1時間の作業。これ以上できたらラッキー！これが大量行動の最大化法",
    startDate: "2026-08-23",
  },
  {
    key: "ignore_metrics",
    label: "集客数やSNSのいいね数などをいちいち気にしない",
    startDate: "2026-08-23",
  },
  { key: "wake_5am", label: "朝5時に起きる" },
  { key: "full_effort", label: "マイルールに基づき全力を尽くせたか" },
  { key: "loving", label: "愛ある人間でいれたか" },
  { key: "no_porn", label: "ポルノ断ち" },
] as const;

export function checklistItemsForDate(date: string) {
  return CHECKLIST_ITEMS.filter(
    (item) => !("startDate" in item) || date >= item.startDate
  );
}
