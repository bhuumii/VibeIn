"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CITIES } from "@/lib/constants";

// ── Types ──────────────────────────────────────────────────────────────────
interface Event {
  id: string;
  title: string;
  city: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image_url?: string;
  source_url?: string;
  price?: string;
}



// exact match with homepage — note "Fun Activities " has trailing space
const ALL_CATEGORIES = ["All", "Music", "Comedy", "Fun Activities", "Workshops", "Arts & Craft", "Theatre", "Kids"];

const MOODS = [
  { label: "Adventurous 🏄", value: "adventurous", color: "from-orange-500 to-red-500" },
  { label: "Chill 😌",       value: "chill",       color: "from-blue-500 to-cyan-400" },
  { label: "Social 🎉",      value: "social",      color: "from-pink-500 to-purple-500" },
  { label: "Cultural 🎭",    value: "cultural",    color: "from-amber-500 to-yellow-400" },
  { label: "Creative 🎨",    value: "creative",    color: "from-green-500 to-emerald-400" },
  { label: "Romantic 💫",    value: "romantic",    color: "from-rose-400 to-pink-600" },
];

// mood → exact category strings from DB
const MOOD_TO_CATEGORIES: Record<string, string[]> = {
  adventurous: ["Fun Activities", "Workshops"],
  chill:       ["Arts & Crafts", "Workshops", "Kids"],
  social:      ["Music", "Comedy"],
  cultural:    ["Theatre", "Arts & Crafts"],
  creative:    ["Arts & Crafts", "Workshops"],
  romantic:    ["Theatre", "Music", "Arts & Crafts"],
};

const CATEGORY_ICONS: Record<string, string> = {
  "Music":           "🎵",
  "Comedy":          "😂",
  "Fun Activities": "🎡",
  "Workshops":       "🛠️",
  "Arts & Crafts":    "🎨",
  "Theatre":         "🎭",
  "Kids":            "🧸",
};
const categoryIcon = (cat: string) => CATEGORY_ICONS[cat] || "✨";

function generateShareToken() {
  return Math.random().toString(36).slice(2, 10);
}

function buildMailtoLink(
  email: string, city: string, date: string,
  mood: string, cart: Event[], shareLink: string
) {
  const moodLabel = MOODS.find(m => m.value === mood)?.label || "Custom";
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const lines = cart.map((e, i) =>
    `${i + 1}. ${e.title}\n   🕐 ${e.time || "TBD"}  |  📍 ${e.location}  |  🏷️ ${e.category.trim()}${e.price ? `  |  ₹${e.price}` : ""}`
  ).join("\n\n");
  const body = `Hey! 👋\n\nI planned a ${moodLabel} day in ${city} on ${formattedDate}!\n\nHere's the itinerary:\n\n${lines}\n\n${shareLink ? `👉 View here: ${shareLink}` : ""}\n\nSee you there! 🎉\n— Shared via VibeIn'`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`My Day Plan in ${city} — ${formattedDate}`)}&body=${encodeURIComponent(body)}`;
}

// ── AI Suggest ─────────────────────────────────────────────────────────────
async function getAISuggestion(mood: string, city: string, events: Event[]): Promise<string[]> {
  try {
    const relevantCats = MOOD_TO_CATEGORIES[mood] || [];
    const pool = events.filter(e => relevantCats.includes(e.category));
    const finalPool = pool.length > 0 ? pool : events;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `You are a city lifestyle expert. A user in ${city} wants a "${mood}" day.
Available events:
${JSON.stringify(finalPool.map(e => ({ id: e.id, title: e.title, category: e.category.trim(), time: e.time })))}

Pick 3–5 event IDs that best match "${mood}" vibe. No time conflicts if times are given.
Reply ONLY with a JSON array: ["id1","id2"]. No explanation.`
        }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || "[]";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return []; }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PlanYourDayPage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState<any>(null);
  const [userEmail, setUserEmail]       = useState("");

  // filters
  const [city, setCity]                 = useState("Delhi");
  const [date, setDate]                 = useState(() => new Date().toISOString().slice(0, 10));
  const [mood, setMood]                 = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showCityDrop, setShowCityDrop] = useState(false);
  const [cityBtnRect, setCityBtnRect]   = useState<DOMRect | null>(null);
  const cityBtnRef                      = useRef<HTMLButtonElement>(null);

  // events
  const [events, setEvents]             = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // cart = itinerary being built
  const [cart, setCart]                 = useState<Event[]>([]);

  // ai
  const [aiLoading, setAiLoading]       = useState(false);

  // save/share
  const [saving, setSaving]             = useState(false);
  const [shareLink, setShareLink]       = useState("");
  const [copied, setCopied]             = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [shareEmail, setShareEmail]     = useState("");

  const cartRef = useRef<HTMLDivElement>(null);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login?redirect=/plan-your-day"); return; }
      setUser(session.user);
      setUserEmail(session.user.email || "");

      // use user's city from profile
      const { data: profile } = await supabase
        .from("profiles").select("city").eq("id", session.user.id).single();
      if (profile?.city && CITIES.includes(profile.city)) setCity(profile.city);

      setLoading(false);
    });
  }, [router]);

  // ── Load events when city changes ──
  useEffect(() => {
    if (!user) return;
    loadEvents();
    setCart([]);
    setShareLink("");
    setActiveCategory("All");
    setMood("");
  }, [city, user]);

  // Close city dropdown on scroll
useEffect(() => {
  const handleScroll = () => {
    if (showCityDrop) setShowCityDrop(false);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, [showCityDrop]);

  const loadEvents = async () => {
    setEventsLoading(true);
    const { data } = await supabase
      .from("events")
      .select("id, title, city, date, time, location, price, category, image_url, source_url")
      .ilike("city", city.trim())
      .order("created_at", { ascending: false });
    setEvents(data || []);
    setEventsLoading(false);
  };

  // filtered events for the picker
  const normalizecat = (s: string) => s.trim().toLowerCase();

const filteredEvents = activeCategory === "All"
  ? (mood
      ? events.filter(e => (MOOD_TO_CATEGORIES[mood] || []).map(normalizecat).includes(normalizecat(e.category)))
      : events)
  : events.filter(e => normalizecat(e.category) === normalizecat(activeCategory));

  // add/remove from cart
  const toggleCart = (ev: Event) => {
    setCart(prev =>
      prev.find(e => e.id === ev.id)
        ? prev.filter(e => e.id !== ev.id)
        : [...prev, ev]
    );
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(e => e.id !== id));

  const moveUp = (i: number) => {
    if (i === 0) return;
    setCart(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  };
  const moveDown = (i: number) => {
    setCart(prev => { if (i === prev.length - 1) return prev; const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  };

  const handleCityDropToggle = () => {
    if (!showCityDrop && cityBtnRef.current) setCityBtnRect(cityBtnRef.current.getBoundingClientRect());
    setShowCityDrop(!showCityDrop);
  };

  // ── AI Suggest ──
  const handleAISuggest = async () => {
    if (!mood) { alert("Pick a mood first!"); return; }
    if (events.length === 0) { alert(`No events in ${city} yet.`); return; }
    setAiLoading(true);
    const ids = await getAISuggestion(mood, city, events);
    const suggested = events.filter(e => ids.includes(String(e.id)));
    setCart(suggested);
    setAiLoading(false);
    setTimeout(() => cartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  };

  // ── Save Plan ──
  const savePlan = async () => {
    if (cart.length === 0) { alert("Add some events to your itinerary first!"); return; }
    setSaving(true);
    const token = generateShareToken();
    const { data, error } = await supabase
      .from("day_plans")
      .insert({
        user_id: user.id, city, date, mood,
        event_ids: cart.map(e => String(e.id)),
        share_token: token,
      })
      .select().single();
    if (!error && data) {
      setShareLink(`${window.location.origin}/plan-your-day/shared/${token}`);
    } else {
      alert("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const handleShareEmail = () => {
    if (!shareEmail.trim()) { alert("Enter an email!"); return; }
    window.open(buildMailtoLink(shareEmail, city, date, mood, cart, shareLink), "_blank");
    setShowEmailModal(false);
    setShareEmail("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a24] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="relative min-h-screen bg-[#0f0a24] text-white overflow-x-hidden">

      {/* bg glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-600/20 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-600/20 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <button onClick={() => router.push("/")} className="text-zinc-500 hover:text-white text-sm mb-2 block transition">
            ← Back to VibeIn'
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">🗓️ Plan Your Day</h1>
              <p className="text-zinc-400 mt-1 text-sm">Pick a mood, build your itinerary, save & share.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/my-itineraries")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                📋 My Itineraries
              </button>
            </div>
          </div>
        </div>

        {/* ── Filters Row ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-end">

          {/* City */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2 block">City</label>
            <button
              ref={cityBtnRef}
              onClick={handleCityDropToggle}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 transition font-semibold text-sm"
            >
              <span>📍 {city}</span>
              <span className={`text-[10px] transition-transform ${showCityDrop ? "rotate-180" : ""}`}>▼</span>
            </button>
          </div>

          {/* Date */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2 block">Date <span className="text-zinc-600 normal-case font-normal">(for itinerary label)</span></label>
            <input
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-400 transition font-semibold text-sm"
            />
          </div>

          {/* Mood pills */}
          <div className="flex-1 min-w-[300px]">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2 block">Mood Filter</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => { setMood(mood === m.value ? "" : m.value); setActiveCategory("All"); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    mood === m.value
                      ? `bg-gradient-to-r ${m.color} text-white shadow-md`
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Button */}
          <button
            onClick={handleAISuggest}
            disabled={aiLoading || !mood}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-sm transition disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
          >
            {aiLoading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Thinking…</>
              : <>✨ AI Suggest</>
            }
          </button>
        </div>

        {/* ── Category Tabs ── */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); if (cat !== "All") setMood(""); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat && !mood
                  ? "bg-purple-600 text-white"
                  : mood && cat === "All" && activeCategory === "All"
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat.trim()}
              {/* show count */}
              {cat !== "All" && (
                <span className="ml-1.5 text-[10px] opacity-50">
                  {events.filter(e => e.category === cat).length}
                </span>
              )}
            </button>
          ))}
          {mood && (
            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-indigo-600/20 border border-indigo-500/30 text-indigo-300">
              Showing: {MOODS.find(m => m.value === mood)?.label} events
            </span>
          )}
        </div>

        {/* ── Main 2-column layout ── */}
        <div className="flex gap-6 items-start">

          {/* LEFT: Event Picker */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-purple-300">
                {mood ? `${MOODS.find(m => m.value === mood)?.label} Events` : "All Events"} in {city}
                <span className="text-zinc-500 font-normal text-sm ml-2">({filteredEvents.length})</span>
              </h2>
              {mood && (
                <button onClick={() => setMood("")} className="text-xs text-zinc-500 hover:text-white transition">
                  Clear mood ✕
                </button>
              )}
            </div>

            {eventsLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="font-bold mb-1">No events found</p>
                <p className="text-zinc-500 text-sm">
                  {events.length === 0 ? `No events in ${city} yet.` : "Try a different mood or category."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredEvents.map(ev => {
                  const inCart = cart.find(e => e.id === ev.id);
                  return (
                    <div
                      key={ev.id}
                      className={`relative rounded-2xl border overflow-hidden transition-all group cursor-pointer ${
                        inCart ? "border-purple-500 shadow-lg shadow-purple-900/20" : "border-white/10 hover:border-white/25"
                      }`}
                      onClick={() => toggleCart(ev)}
                    >
                      {/* Image */}
                      {ev.image_url && (
                        <div className="relative h-32 overflow-hidden">
                          <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a24] via-[#0f0a24]/30 to-transparent" />
                          <div className="absolute bottom-2 left-3">
                            <span className="bg-black/50 backdrop-blur-sm text-xs font-bold text-purple-300 uppercase tracking-wider px-2 py-0.5 rounded-lg">
                              {categoryIcon(ev.category)} {ev.category.trim()}
                            </span>
                          </div>
                          {inCart && (
                            <div className="absolute top-2 right-2 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">✓</div>
                          )}
                        </div>
                      )}

                      <div className={`p-4 ${inCart ? "bg-purple-600/10" : "bg-white/5"}`}>
                        {!ev.image_url && (
                          <div className="flex items-center gap-2 mb-2">
                            <span>{categoryIcon(ev.category)}</span>
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{ev.category.trim()}</span>
                            {inCart && <div className="ml-auto w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs">✓</div>}
                          </div>
                        )}
                        <h3 className="font-bold text-sm leading-snug mb-2 line-clamp-2">{ev.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          {ev.time && <span>🕐 {ev.time}</span>}
                          <span className="truncate">📍 {ev.location}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-green-400">
                            {!ev.price || ev.price === "0" ? "Free" : `₹${ev.price}`}
                          </span>
                          <span className={`text-xs font-bold transition ${inCart ? "text-purple-400" : "text-zinc-600 group-hover:text-zinc-400"}`}>
                            {inCart ? "✓ Added" : "+ Add"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Cart / Itinerary Panel */}
          <div ref={cartRef} className="w-[360px] flex-shrink-0 sticky top-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">

              {/* Cart header */}
              <div className="p-5 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">🗓️ My Itinerary</h2>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-xs text-zinc-500 hover:text-red-400 transition">Clear all</button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-purple-600/20 border border-purple-500/30 text-purple-300 px-2 py-1 rounded-lg">📍 {city}</span>
                  <span className="text-xs bg-white/5 border border-white/10 text-zinc-400 px-2 py-1 rounded-lg">
                    📅 {new Date(date + "T12:00:00").toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                  {mood && (
                    <span className="text-xs bg-white/5 border border-white/10 text-zinc-400 px-2 py-1 rounded-lg">
                      {MOODS.find(m => m.value === mood)?.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Cart items */}
              <div className="p-4 max-h-[480px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">🛒</div>
                    <p className="text-zinc-500 text-sm">Click events to add them here</p>
                    <p className="text-zinc-600 text-xs mt-1">Or use ✨ AI Suggest</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((ev, i) => (
                      <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-3 group">
                        <div className="flex items-start gap-2">
                          {/* Order number */}
                          <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs leading-snug line-clamp-2">{ev.title}</p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                              {ev.time && <span>🕐 {ev.time}</span>}
                              <span className="truncate">📍 {ev.location}</span>
                            </div>
                          </div>
                          {/* Controls */}
                          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                            <button onClick={() => moveUp(i)} className="text-zinc-500 hover:text-white text-[10px] px-1">↑</button>
                            <button onClick={() => moveDown(i)} className="text-zinc-500 hover:text-white text-[10px] px-1">↓</button>
                            <button onClick={() => removeFromCart(ev.id)} className="text-red-500/60 hover:text-red-400 text-[10px] px-1">✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart actions */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-white/10 space-y-2">
                  <button
                    onClick={savePlan}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-bold text-sm transition flex items-center justify-center gap-2"
                  >
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : <>💾 Save Itinerary</>}
                  </button>

                  {shareLink ? (
                    <button onClick={copyLink} className="w-full py-3 rounded-xl bg-green-600/20 border border-green-500/40 hover:bg-green-600/30 text-green-300 font-bold text-sm transition">
                      {copied ? "✅ Copied!" : "🔗 Copy Share Link"}
                    </button>
                  ) : (
                    <button onClick={savePlan} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-sm transition text-zinc-300">
                      🔗 Generate Share Link
                    </button>
                  )}

                  <button
                    onClick={() => { setShareEmail(userEmail); setShowEmailModal(true); }}
                    className="w-full py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 font-bold text-sm transition"
                  >
                    📧 Share via Email
                  </button>

                  {shareLink && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl mt-1">
                      <p className="text-zinc-500 text-[10px] mb-1">Share link:</p>
                      <p className="text-purple-300 text-xs font-mono break-all">{shareLink}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* City Dropdown — fixed to escape stacking context */}
      {showCityDrop && cityBtnRect && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowCityDrop(false)} />
          <div
            className="fixed z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ top: cityBtnRect.bottom + 8, left: cityBtnRect.left, width: cityBtnRect.width }}
          >
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => { setCity(c); setShowCityDrop(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${city === c ? "bg-purple-600 text-white" : "hover:bg-white/10 text-zinc-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmailModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-[#1a1138] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold mb-1">📧 Share Your Itinerary</h3>
              <p className="text-zinc-400 text-sm mb-6">Opens your email app with the full itinerary pre-filled.</p>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2 block">Recipient Email</label>
              <input
                type="email" value={shareEmail}
                onChange={e => setShareEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-400 transition mb-2"
                autoFocus
              />
              <p className="text-zinc-600 text-xs mb-5">Pre-filled with your email ({userEmail}). Change to send to a friend.</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 space-y-1">
                <p className="text-zinc-300 text-xs font-semibold mb-2">📋 Preview:</p>
                {cart.slice(0, 3).map(ev => (
                  <p key={ev.id} className="text-zinc-500 text-xs">• {ev.title} — {ev.time || "TBD"} @ {ev.location}</p>
                ))}
                {cart.length > 3 && <p className="text-zinc-600 text-xs">+ {cart.length - 3} more…</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowEmailModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-sm text-zinc-300 transition hover:bg-white/10">Cancel</button>
                <button onClick={handleShareEmail} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-sm transition">Open Email App 📤</button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}