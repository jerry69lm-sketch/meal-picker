"use client";

import { useState } from "react";
import type { Restaurant } from "@/app/page";
import { getProteinSuggestions } from "@/lib/proteinSuggestions";

function displayDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} 公尺` : `${(m / 1000).toFixed(1)} 公里`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-amber-400 text-lg leading-none">
          {rating >= i ? "★" : rating >= i - 0.5 ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
}

interface Props {
  restaurant: Restaurant;
  onPickAgain: () => void;
  onClose: () => void;
}

export default function ResultCard({ restaurant, onPickAgain, onClose }: Props) {
  const [imgError, setImgError] = useState(false);

  const photoSrc =
    restaurant.photo &&
    !imgError &&
    restaurant.photo.startsWith("https://")
      ? restaurant.photo
      : null;

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    restaurant.name
  )}&ll=${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}`;

  const isHighProtein = (restaurant.proteinScore ?? 0) > 0;

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90dvh] overflow-y-auto animate-pop">

      <div className="relative w-full h-52 bg-gray-100 flex items-center justify-center overflow-hidden">
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-7xl opacity-20">🍴</span>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full text-white
            flex items-center justify-center hover:bg-black/60 transition z-10"
          aria-label="關閉"
        >
          ✕
        </button>

        {isHighProtein && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white
            text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            💪 高蛋白
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">

        <h2 className="text-2xl font-bold text-gray-900 leading-snug">
          {restaurant.name}
        </h2>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {restaurant.rating !== null && restaurant.rating !== undefined ? (
              <>
                <StarRow rating={restaurant.rating} />
                <span className="font-semibold text-gray-800">
                  {Number(restaurant.rating_raw).toFixed(1)}
                  <span className="text-gray-400 font-normal text-sm"> / 10</span>
                </span>
                {restaurant.user_ratings_total > 0 && (
                  <span className="text-sm text-gray-400">
                    ({restaurant.user_ratings_total.toLocaleString()})
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400">暫無評分</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="text-[#4CAF50]">📍</span>
            {displayDistance(restaurant.distance ?? 0)}
          </div>
        </div>

        {restaurant.vicinity ? (
          <p className="text-sm text-gray-500">{restaurant.vicinity}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {isHighProtein && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-500">
              💪 高蛋白選擇
            </span>
          )}
          {restaurant.types?.slice(0, 3).map((t) => (
            <span
              key={t}
              className="px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-[#4CAF50]"
            >
              {t}
            </span>
          ))}
        </div>

        {/* High-protein suggestions */}
        <div className="bg-green-50/60 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-[#388E3C] flex items-center gap-1">
            💪 高蛋白之選
          </p>
          {getProteinSuggestions(restaurant.types).map((s) => (
            <div key={s.dish} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{s.dish}</span>
              <span className="font-semibold text-[#4CAF50]">{s.protein}</span>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 pt-1">* 估算值，實際因分量而異</p>
        </div>

        <div className="pt-1 border-t border-gray-100" />

        <div className="flex gap-3">
          <button
            onClick={onPickAgain}
            className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-800 font-semibold text-sm
              flex items-center justify-center gap-1.5 hover:bg-gray-200 active:scale-95 transition-all"
          >
            🔄 再抽一次
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3.5 rounded-xl bg-[#4CAF50] text-white font-semibold text-sm
              flex items-center justify-center gap-1.5 hover:bg-[#43A047] active:scale-95 transition-all"
          >
            🗺️ 導航前往
          </a>
        </div>
      </div>
    </div>
  );
}
