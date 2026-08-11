"use client";

import { useState } from "react";

export function LifeGoals() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-gray-200 bg-gray-50 px-4 py-2 text-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-left font-bold"
      >
        目標・計画
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 pb-3">
          <section>
            <h3 className="font-bold mb-1">【死ぬまでに達成したことリスト】</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              <li>明るく性格が良く、色気のある美女で、無味無臭のパイパンマンコで、綺麗なアナルの女性のセックスパートナーを持った</li>
              <li>自分の特性に合い、ストレスゼロの仕事で、お金の心配をゼロにした。2026/8/1以降、お金でひもじい思いを二度としなかった。39年間お金でうんざりしていた自分におさらばした。</li>
              <li>親をロサンゼルスにドジャース観戦に連れて行った</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold mb-1">【目下の目標/2026年12月31日まで】</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              <li>マイクロSaasで1ユーザーの課金獲得</li>
              <li>HSP×稼ぐ系のnoteで1ユーザーの課金獲得</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold mb-1">【日々やること】</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              <li>マイクロSaasは5日で1つ完成(SNSの1投稿を含む)</li>
              <li>HSP×稼ぐ系は週最低6回のX・Threads投稿</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold mb-1">【肝となること】</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              <li>マーケティング力の向上</li>
              <li>試行回数を増やし、考えながら続ける</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold mb-2">マイクロSaaS(再調整版)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-1 pr-4 font-bold">時期</th>
                    <th className="py-1 font-bold">ベースケース</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-4">3ヶ月後</td>
                    <td className="py-1">1,500〜5,000円</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-4">6ヶ月後</td>
                    <td className="py-1">5,000〜13,000円</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-4">9ヶ月後</td>
                    <td className="py-1">11,000〜23,000円</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">12ヶ月後</td>
                    <td className="py-1">20,000〜38,000円</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-bold mb-2">note(HSP×稼ぐ系、X/Threads発信含む)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-1 pr-4 font-bold">時期</th>
                    <th className="py-1 font-bold">ベースケース</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-4">3ヶ月後</td>
                    <td className="py-1">1,000〜3,000円</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-4">6ヶ月後</td>
                    <td className="py-1">3,000〜7,000円</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1 pr-4">9ヶ月後</td>
                    <td className="py-1">5,000〜13,000円</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">12ヶ月後</td>
                    <td className="py-1">12,000〜20,000円</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
