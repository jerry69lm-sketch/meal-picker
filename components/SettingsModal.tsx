"use client";

import { useState } from "react";

interface Props {
  radius: 500 | 1000;
  minRating: number;
  onSave: (r: 500 | 1000, m: number) => void;
  onClose: () => void;
}

export default function SettingsModal({ radius, onSave, onClose }: Props) {
  const [localRadius, setLocalRadius] = useState(radius);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-up space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">設定</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">搜尋範圍</p>
          <div className="flex gap-3">
            {([500, 1000] as const).map((r) => (
              <button key={r} onClick={() => setLocalRadius(r)}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all
                  ${localRadius === r ? "bg-[#4CAF50] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {r < 1000 ? `${r} 公尺` : "1 公里"}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center">
          搜尋範圍：{localRadius < 1000 ? `${localRadius} 公尺` : "1 公里"}內的所有餐廳
        </p>

        <button onClick={() => onSave(localRadius, 0)}
          className="w-full py-4 rounded-2xl bg-[#4CAF50] text-white text-base font-bold hover:bg-[#43A047] active:scale-95 transition-all">
          儲存設定
        </button>
      </div>
    </>
  );
}
