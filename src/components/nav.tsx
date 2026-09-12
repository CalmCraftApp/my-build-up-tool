"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-6">
        <Link
          href="/"
          className={`text-sm font-medium ${
            pathname === "/"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ホーム
        </Link>
        <Link
          href="/calendar"
          className={`text-sm font-medium ${
            pathname === "/calendar"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          記録
        </Link>
      </div>
    </nav>
  );
}
