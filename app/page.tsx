"use client";

import { useState, useEffect, useCallback } from "react";
import ResultCard from "@/components/ResultCard";
import SettingsModal from "@/components/SettingsModal";

export type MealType = "午餐" | "晚餐";

export interface Restaurant {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  vicinity: string;
  types: string[];
  distance: number;
  photo_reference?: string;
  geometry: { location: { lat: number; lng: number } };
}

type AppState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; restaurant: Restaurant }
  | { kind: "empty" }
  | { kind: "error"; message: string };

const EXCLUDED_TYPES = new Set(["restaurant", "food", "point_of_interest", "establishment"]);

function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Home() {
  const [state, setState] = useState<AppState>({ kind: "idle" });
  const [mealType, setMealType] = useState<MealType>("午餐");
  const [radius, setRadius] = useState<500 | 1000>(500);
  const [minRating, setMinRating] = useState<3.0 | 3.5 | 4.0>(3.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Persist settings
  useEffect(() => {
    const r = localStorage.getItem("radius");
    const m = localStorage.getItem("minRating");
    if (r) setRadius(Number(r) as 500 | 1000);
    if (m) setMinRating(Number(m) as 3.0 | 3.5 | 4.0);
  }, []);

  const saveSettings = (r: 500 | 1000, m: 3.0 | 3.5 | 4.0) => {
    setRadius(r);
    setMinRating(m);
    localStorage.setItem("radius", String(r));
    localStorage.setItem("minRating", String(m));
    setShowSettings(false);
  };

  const pick = useCallback(
    (lat: number, lng: number, r: number, min: number) => {
      fetch(`/api/places?lat=${lat}&lng=${lng}&radius=${r}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setState({ kind: "error", message: data.error });
            return;
          }
          const filtered: Restaurant[] = (data.results ?? [])
            .filter((p: Restaurant) => (p.rating ?? 0) >= min)
            .map((p: Restaurant) => ({
              ...p,
              distance: haversineMeters(
                lat, lng,
                p.geometry.location.lat,
                p.geometry.location.lng
              ),
              photo_reference: p.photos
                ? (p as unknown as { photos: { photo_reference: string }[] }).photos[0]
                    ?.photo_reference
                : undefined,
            }));

          if (filtered.length === 0) {
            setState({ kind: "empty" });
            return;
          }
          const picked = filtered[Math.floor(Math.random() * filtered.length)];
          setState({ kind: "result", restaurant: picked });
          setShowResult(true);
        })
        .catch((e) => setState({ kind: "error", message: e.message }));
    },
    []
  );

  const handlePick = () => {
    setState({ kind: "loading" });
    setShowResult(false);

    if (!navigator.geolocation) {
      setState({ kind: "error", message: "此瀏覽器不支援定位功能" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => pick(pos.coords.latitude, pos.coords.longitude, radius, minRating),
      (err) => {
        const msg =
          err.code === 1
            ? "請允許瀏覽器存取您的位置"
            : "無法取得位置，請確認定位已開啟";
        setState({ kind: "error", message: msg });
      },
      { timeout: 10000 }
    );
  };

  const handlePickAgain = () => {
    setShowResult(false);
    setTimeout(handlePick, 200);
  };

  const isLoading = state.kind === "loading";

  return (
    <main className="min-h-dvh bg-[#F5F0E8] flex flex-col items-center px-5 pb-10">
      {/* Top bar */}
      <div className="w-full max-w-sm flex justify-end pt-5">
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shadow-sm text-gray-500 hover:bg-white transition"
          aria-label="設定"
        >
          ⚙️
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center mt-10 gap-4">
        <div className="text-8xl select-none">🍽️</div>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">現在吃什麼？</h1>
      </div>

      {/* Meal type selector */}
      <div className="flex gap-4 mt-10 w-full max-w-sm">
        {(["午餐", "晚餐"] as MealType[]).map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`flex-1 py-5 rounded-2xl bg-white shadow-sm flex flex-col items-center gap-1 transition-all
              ${mealType === type
                ? "ring-2 ring-[#4CAF50] text-[#4CAF50]"
                : "text-gray-700 hover:shadow-md"
              }`}
          >
            <span className="text-3xl">{type === "午餐" ? "☀️" : "🌙"}</span>
            <span className="font-semibold text-base">{type}</span>
          </button>
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={handlePick}
        disabled={isLoading}
        className="mt-10 w-full max-w-sm py-5 rounded-2xl bg-[#4CAF50] text-white text-xl font-bold
          shadow-[0_6px_24px_rgba(76,175,80,0.35)] active:scale-95 disabled:opacity-70
          flex items-center justify-center gap-2 transition-all hover:bg-[#43A047]"
      >
        {isLoading ? (
          <>
            <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            搜尋中...
          </>
        ) : (
          <>🎲 幫我抽餐廳</>
        )}
      </button>

      {/* Subtitle hint */}
      <p className="mt-3 text-sm text-gray-400">
        搜尋範圍：{radius < 1000 ? `${radius} 公尺` : "1 公里"}內｜評分 ≥ {minRating.toFixed(1)}
      </p>

      {/* Inline error / empty messages */}
      {state.kind === "error" && (
        <div className="mt-5 w-full max-w-sm bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 text-center">
          ⚠️ {state.message}
        </div>
      )}
      {state.kind === "empty" && (
        <div className="mt-5 w-full max-w-sm bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 text-center">
          😔 附近找不到符合條件的餐廳，試試放寬搜尋範圍或降低最低評分
        </div>
      )}

      {/* Result bottom sheet overlay */}
      {showResult && state.kind === "result" && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowResult(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <ResultCard
              restaurant={state.restaurant}
              onPickAgain={handlePickAgain}
              onClose={() => setShowResult(false)}
            />
          </div>
        </>
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          radius={radius}
          minRating={minRating}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </main>
  );
}
