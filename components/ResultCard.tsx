"use client";

import Image from "next/image";
import { useState } from "react";
import type { Restaurant } from "@/app/page";

const EXCLUDED_TYPES = new Set(["restaurant", "food", "point_of_interest", "establishment"]);

function displayTypes(types: string[]) {
  return types
    .filter((t) => !EXCLUDED_TYPES.has(t))
    .slice(0, 3)
    .map((t) => t.replace(/_/g, " "));
}

function displayDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} 公尺` : `${(m / 1000).toFixed(1)} 公里`;
}

interface Props {
  restaurant: Restaurant;
  onPickAgain: () => void;
  onClose: () => void;
}

export default function ResultCard({ restaurant, onPickAgain, onClose }: Props) {
  const [imgError, setImgError] = useState(false);

  const photoSrc = restaurant.photo_reference && !imgError
    ? `/api/photo?ref=${restaurant.photo_reference}`
    : null;

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(restaurant.name)}&ll=${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}`;

  const tags = displayTypes(restaurant.types);

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-pop max-h-[90dvh] overflow-y-auto">
      {/* Photo */}
      <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={restaurant.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span className="text-6xl opacity-30">🍴</span>
        )}
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full text-white flex items-center justify-center text-sm hover:bg-black/60 transition"
          aria-label="關閉"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{restaurant.name}</h2>

        {/* Rating + distance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-lg">⭐️</span>
            <span className="font-semibold text-gray-800">{restaurant.rating?.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({restaurant.user_ratings_total?.toLocaleString()})</span>
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

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 text-xs font-medium rounded-full bg-green-50 text-[#4CAF50] capitalize"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-gray-100" />

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
