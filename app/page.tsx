"use client";

import { useState, useEffect } from "react";
import ResultCard from "@/components/ResultCard";
import SettingsModal from "@/components/SettingsModal";

export type MealType = "午餐" | "晚餐";

export interface Restaurant {
  place_id: string;
  name: string;
  rating: null;
  rating_raw: null;
  user_ratings_total: number;
  vicinity: string;
  types: string[];
  distance: number;
  photo: string | null;
  proteinScore: number;
  geometry: { location: { lat: number; lng: number } };
}

type AppState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; restaurant: Restaurant }
  | { kind: "empty" }
  | { kind: "error"; message: string };

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
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

async function fetchNearby(
  lat: number,
  lng: number,
  radius: string,
  highProtein: boolean
): Promise<Restaurant[]> {
  const res = await fetch(
    `/api/places?lat=${lat}&lng=${lng}&radius=${radius}&highProtein=${highProtein}`
  );
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = JSON.parse(text) as any;
  if (data.error) throw new Error(data.error);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data.results || []) as any[]).map((r: any) => ({
    ...r,
    distance: haversine(lat, lng, r.geometry.location.lat, r.geometry.location.lng),
  })) as Restaurant[];
}

export default function Home() {
  const [state, setState] = useState<AppState>({ kind: "idle" });
  const [mealType, setMealType] = useState<MealType>("午餐");
  const [radius, setRadius] = useState<number>(500);
  const [highProtein, setHighProtein] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const r = localStorage.getItem("radius");
    if (r) setRadius(Number(r));
    const hp = localStorage.getItem("highProtein");
    if (hp) setHighProtein(hp === "true");
  }, []);

  const saveSettings = (r: number, m: number) => {
    setRadius(r); localStorage.setItem("radius", String(r));
    setShowSettings(false); void m;
  };

  const toggleHighProtein = () => {
    const next = !highProtein;
    setHighProtein(next);
    localStorage.setItem("highProtein", String(next));
  };

  const handlePick = () => {
    setState({ kind: "loading" });
    setShowResult(false);
    if (!navigator.geolocation) {
      setState({ kind: "error", message: "此瀏覽器不支援定位功能" }); return;
    }
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const results = await fetchNearby(
              pos.coords.latitude, pos.coords.longitude, String(radius), highProtein
            );
            if (results.length === 0) { setState({ kind: "empty" }); return; }
            const picked = results[Math.floor(Math.random() * results.length)];
            setState({ kind: "result", restaurant: picked });
            setShowResult(true);
          } catch (e) {
            setState({ kind: "error", message: e instanceof Error ? e.message : "搜尋失敗" });
          }
        },
        () => setState({ kind: "error", message: "請允許瀏覽器存取您的位置" }),
        { timeout: 12000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    } catch {
      setState({ kind: "error", message: "無法存取定位" });
    }
  };

  const handlePickAgain = () => { setShowResult(false); setTimeout(handlePick, 200); };

  return (
    <main className="min-h-dvh bg-[#F5F0E8] flex flex-col items-center px-5 pb-10">
      <div className="w-full max-w-sm flex justify-end pt-5">
        <button onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shadow-sm text-gray-500 hover:bg-white transition">
          ⚙️
        </button>
      </div>

      <div className="flex flex-col items-center mt-10 gap-4">
        <div className="text-8xl select-none">🍽️</div>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">現在吃什麼？</h1>
      </div>

      <div className="flex gap-4 mt-10 w-full max-w-sm">
        {(["午餐", "晚餐"] as MealType[]).map((type) => (
          <button key={type} onClick={() => setMealType(type)}
            className={`flex-1 py-5 rounded-2xl bg-white shadow-sm flex flex-col items-center gap-1 transition-all
              ${mealType === type ? "ring-2 ring-[#4CAF50] text-[#4CAF50]" : "text-gray-700 hover:shadow-md"}`}>
            <span className="text-3xl">{type === "午餐" ? "☀️" : "🌙"}</span>
            <span className="font-semibold text-base">{type}</span>
          </button>
        ))}
      </div>

      <button
        onClick={toggleHighProtein}
        className={`mt-4 w-full max-w-sm py-3.5 rounded-2xl flex items-center justify-center gap-2
          font-semibold text-base transition-all shadow-sm
          ${highProtein
            ? "bg-orange-500 text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
            : "bg-white text-gray-600 hover:shadow-md"
          }`}
      >
        <span className="text-xl">💪</span>
        高蛋白優先
        {highProtein && <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full ml-1">ON</span>}
      </button>

      <button onClick={handlePick} disabled={state.kind === "loading"}
        className="mt-6 w-full max-w-sm py-5 rounded-2xl bg-[#4CAF50] text-white text-xl font-bold
          shadow-[0_6px_24px_rgba(76,175,80,0.35)] active:scale-95 disabled:opacity-70
          flex items-center justify-center gap-2 transition-all hover:bg-[#43A047]">
        {state.kind === "loading"
          ? <><span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />搜尋中...</>
          : <>🎲 幫我抽餐廳</>}
      </button>

      <p className="mt-3 text-sm text-gray-400">
        搜尋範圍：{radius < 1000 ? `${radius} 公尺` : `${(radius / 1000).toFixed(1)} 公里`}內的所有餐廳
        {highProtein && <span className="text-orange-400"> · 高蛋白優先</span>}
      </p>

      {state.kind === "error" && (
        <div className="mt-5 w-full max-w-sm bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 text-center">
          ⚠️ {state.message}
        </div>
      )}
      {state.kind === "empty" && (
        <div className="mt-5 w-full max-w-sm bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700 text-center">
          😔 附近找不到餐廳，試試放寬搜尋範圍
        </div>
      )}

      {showResult && state.kind === "result" && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowResult(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <ResultCard restaurant={state.restaurant} onPickAgain={handlePickAgain} onClose={() => setShowResult(false)} />
          </div>
        </>
      )}

      {showSettings && (
        <SettingsModal radius={radius} minRating={0} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
}
