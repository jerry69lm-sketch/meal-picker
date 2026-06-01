"use client";

import Image from "next/image";
import { useState } from "react";
import type { Restaurant } from "@/app/page";

function displayDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} 公尺` : `${(m / 1000).toFixed(1)} 公里`;
}

// Render filled/half/empty stars from a 0–5 rating
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const half = !filled && rating >= i - 0.5;
        return (
          <span key={i} className="text-amber-400 text-lg leading-none">
            {filled ? "★" : half ? "½" : "☆"}
          </span>
        );
      })}
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

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(restaurant.name)}&ll=${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}`;

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[90dvh] overflow-y-auto animate-pop">

      {/* Photo */}
      <div className="relative w-full h-52 bg-gray-100 flex items-center justify-center">
        {restaurant.photo && !imgError ? (
          <Image
            src={restaurant.photo}
            alt={restaurant.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span className="text-7xl opacity-20">🍴</span>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full text-white flex items-center justify-center hover:bg-black/60 transition"
          aria-label="關閉"
        >✕</button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">

        {/* Name */}
        <h2 className="text-2xl font-bold text-gray-900 leading-snug">{restaurant.name}</h2>

        {/* Rating row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {restaurant.rating !== null ? (
              <>
                <StarRow rating={restaurant.rating} />
                <span className="font-semibold text-gray-800">
                  {restaurant.rating_raw?.toFixed(1)}
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
            {displayDistance(restaurant.distance)}
          </div>
        </div>

        {/* Address */}
        {restaurant.vicinity && (
          <p className="text-sm text-gray-500">{restaurant.vicinity}</p>
        )}

        {/* Category tags */}
        {restaurant.types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {restaurant.types.slice(0, 3).map((t) => (
              <span key={t} className="px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-[#4CAF50]">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="pt-1 border-t border-gray-100" />

        {/* Action buttons */}
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
