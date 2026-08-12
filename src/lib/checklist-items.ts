// この日より前は毎日チェックリスト自体が無かったので表示しない
export const CHECKLIST_START_DATE = "2026-08-12";

export const CHECKLIST_ITEMS = [
  { key: "wake_5am", label: "朝5時に起きる" },
  { key: "full_effort", label: "マイルールに基づき全力を尽くせたか" },
  { key: "loving", label: "愛ある人間でいれたか" },
] as const;
