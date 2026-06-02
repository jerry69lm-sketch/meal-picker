"use client";

import { useState } from "react";

interface Props {
  radius: number;
  minRating: number;
  onSave: (r: number, m: number) => void;
  onClose: () => void;
}

export default function SettingsModal({ radius, onSave, onClose }: Props) {
  const [localRadius, setLocalRadius] = useState(radius);

  const label = localRadius < 1000
    ? `${localRadius} 公尺`
    : `${(localRadius / 1000).toFixed(1)} 公里`;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-up space-y-6">

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">設定</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        {/* Radius slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">搜尋範圍</p>
            <span className="text-lg font-bold text-[#4CAF50]">{label}</span>
          </div>

          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={localRadius}
            onChange={(e) => setLocalRadius(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#4CAF50] bg-gray-200"
          />

          <div className="flex justify-between text-xs text-gray-400">
            <span>100 公尺</span>
            <span>1 公里</span>
            <span>2.5 公里</span>
            <span>5 公里</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2">
            {[300, 500, 1000, 2000].map((r) => (
              <button key={r} onClick={() => setLocalRadius(r)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                  ${localRadius === r
                    ? "bg-[#4CAF50] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {r < 1000 ? `${r}m` : `${r / 1000}km`}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onSave(localRadius, 0)}
          className="w-full py-4 rounded-2xl bg-[#4CAF50] text-white text-base font-bold
            hover:bg-[#43A047] active:scale-95 transition-all shadow-[0_4px_16px_rgba(76,175,80,0.3)]">
          儲存設定
        </button>
      </div>
    </>
  );
}
