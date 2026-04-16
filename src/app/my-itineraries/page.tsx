"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SavedPlan {
  id: string;
  city: string;
  date: string;
  mood: string;
  event_ids: string[];
  share_token: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  time: string;
  location: string;
  category: string;
  image_url?: string;
  price?: string;
}

const MOODS = [
  { label: "Adventurous 🏄", value: "adventurous" },
  { label: "Chill 😌",       value: "chill" },
  { label: "Social 🎉",      value: "social" },
  { label: "Cultural 🎭",    value: "cultural" },
  { label: "Creative 🎨",    value: "creative" },
  { label: "Romantic 💫",    value: "romantic" },
];

export default function MyItinerariesPage() {
  const router = useRouter();
  const [loading, setLoading]       = useState(true);
  const [plans, setPlans]           = useState<SavedPlan[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [eventMap, setEventMap]     = useState<Record<string, Event[]>>({});
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login?redirect=/my-itineraries"); return; }
      const { data } = await supabase
        .from("day_plans")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setPlans(data || []);
      setLoading(false);
    });
  }, [router]);

  const loadEvents = async (plan: SavedPlan) => {
    if (eventMap[plan.id]) { setExpandedId(expandedId === plan.id ? null : plan.id); return; }
    const { data } = await supabase
      .from("events")
      .select("id, title, time, location, category, image_url, price")
      .in("id", plan.event_ids)
    setEventMap(prev => ({ ...prev, [plan.id]: data || [] }));
    setExpandedId(plan.id);
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this itinerary?")) return;
    setDeleting(id);
    await supabase.from("day_plans").delete().eq("id", id);
    setPlans(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  };

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/plan-your-day/shared/${token}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a24] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="relative min-h-screen bg-[#0f0a24] text-white px-6 py-8">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-600/20 blur-[160px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <button onClick={() => router.push("/plan-your-day")} className="text-zinc-500 hover:text-white text-sm mb-4 block transition">
          ← Back to Plan Your Day
        </button>
        <h1 className="text-4xl font-bold mb-2">📋 My Itineraries</h1>
        <p className="text-zinc-400 text-sm mb-8">All your saved day plans.</p>

        {plans.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-16 text-center">
            <div className="text-5xl mb-4">🗓️</div>
            <h3 className="text-xl font-bold mb-2">No itineraries yet</h3>
            <p className="text-zinc-400 text-sm mb-6">Plan your first day and save it!</p>
            <button onClick={() => router.push("/plan-your-day")} className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold transition">
              Plan Your Day 🚀
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

                {/* Plan header */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <button onClick={() => loadEvents(plan)} className="flex-1 text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-bold px-3 py-1 rounded-lg">📍 {plan.city}</span>
                      <span className="text-zinc-300 text-sm font-semibold">
                        {new Date(plan.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      {plan.mood && (
                        <span className="text-zinc-400 text-xs">{MOODS.find(m => m.value === plan.mood)?.label}</span>
                      )}
                      <span className="text-zinc-500 text-xs">{plan.event_ids.length} events</span>
                    </div>
                    <p className="text-zinc-600 text-xs mt-1">
                      Saved {new Date(plan.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
  <button
    onClick={() => deletePlan(plan.id)}
    disabled={deleting === plan.id}
    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-lg font-semibold transition"
  >
    {deleting === plan.id ? "…" : "🗑️"}
  </button>
  <button onClick={() => loadEvents(plan)} className="text-zinc-500 hover:text-white text-xs px-2">
    {expandedId === plan.id ? "▲" : "▼"}
  </button>
</div>
                </div>

                {/* Expanded events */}
                {expandedId === plan.id && (
                  <div className="border-t border-white/10 p-5 space-y-3">
                    {(eventMap[plan.id] || []).length === 0 ? (
                      <p className="text-zinc-500 text-sm text-center py-4">Events not found (may have been removed)</p>
                    ) : (
                      (eventMap[plan.id] || []).map((ev, i) => (
                        <div key={ev.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                          <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{ev.title}</p>
                            <div className="flex gap-2 text-xs text-zinc-500 mt-0.5">
                              {ev.time && <span>🕐 {ev.time}</span>}
                              <span className="truncate">📍 {ev.location}</span>
                            </div>
                          </div>
                          {ev.price && (
                            <span className="text-xs font-bold text-green-400 flex-shrink-0">
                              {ev.price === "0" ? "Free" : `₹${ev.price}`}
                            </span>
                          )}
                        </div>
                      ))
                    )}

                    <div className="flex gap-2 pt-2">
                      
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}