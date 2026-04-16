"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CITIES } from "@/lib/constants"
import Breadcrumb from "@/components/Breadcrumb";

const CATEGORIES = ["Music", "Comedy", "Fun Activities", "Workshops", "Arts & Crafts", "Theatre", "Kids"];

export default function CreateEventPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // City dropdown
  const [showCityDrop, setShowCityDrop] = useState(false);
  const [cityBtnRect, setCityBtnRect] = useState<DOMRect | null>(null);
  const cityBtnRef = useRef<HTMLButtonElement>(null);

  // Category dropdown
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [catBtnRect, setCatBtnRect] = useState<DOMRect | null>(null);
  const catBtnRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    city: "Delhi",
    category: "Music",
    price: "",
    image_url: "",
    contact: "",
  });

  useEffect(() => {
    const initializePage = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login?redirect=/create-event"); return; }
      setUser(session.user);
      await fetchMyEvents(session.user.id);
      setLoading(false);
    };
    initializePage();
  }, []);

  // Close dropdowns on scroll
useEffect(() => {
  const handleScroll = () => {
    if (showCityDrop) setShowCityDrop(false);
    if (showCatDrop) setShowCatDrop(false);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, [showCityDrop, showCatDrop]);

  const fetchMyEvents = async (userId: string) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setMyEvents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPosting(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("events").update({ ...form }).eq("id", editingId);
        if (error) throw error;
        alert("Event updated successfully!");
      } else {
        const { error } = await supabase.from("events").insert({ user_id: user.id, is_user_created: true, ...form });
        if (error) throw error;
        alert("Event created! It will now show on the homepage 🎉");
      }
      resetForm();
      await fetchMyEvents(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    await fetchMyEvents(user.id);
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      city: event.city || "Delhi",
      category: event.category || "Music",
      price: event.price || "",
      image_url: event.image_url || "",
      contact: event.contact || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      date: "",
      time: "",
      location: "",
      city: "Delhi",
      category: "Music",
      price: "",
      image_url: "",
      contact: "",
    });
  };

  const handleCityDropToggle = () => {
    if (!showCityDrop && cityBtnRef.current) setCityBtnRect(cityBtnRef.current.getBoundingClientRect());
    setShowCityDrop(!showCityDrop);
  };

  const handleCatDropToggle = () => {
    if (!showCatDrop && catBtnRef.current) setCatBtnRect(catBtnRef.current.getBoundingClientRect());
    setShowCatDrop(!showCatDrop);
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-[#140b2d]">
      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] text-white px-6 py-8">
      <div className="pointer-events-none fixed inset-0 z-0">
  <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-600/20 blur-[160px] rounded-full" />
  <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-indigo-600/20 blur-[140px] rounded-full" />
</div>

      <div className="relative z-10 max-w-4xl mx-auto">

           <Breadcrumb crumbs={[
  { label: "Home", href: "/" },
  { label: "Create Event" }
]} />

        <h1 className="text-4xl font-bold mb-6">Create Your Event</h1>

        <form onSubmit={handleSubmit} className="bg-white/10 p-8 rounded-2xl border border-white/20 space-y-4">

          {/* Title */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Event Title *</label>
            <input
              required
              placeholder="e.g. Poetry Open Mic Night"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Date *</label>
              <input
                type="date" required value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 transition [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Time *</label>
              <input
                type="time" required value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 transition [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Venue / Location *</label>
            <input
              required placeholder="e.g. The Piano Man Jazz Club, Delhi"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* City + Category */}
          <div className="grid grid-cols-2 gap-4">

            {/* City */}
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">City *</label>
              <button
                type="button"
                ref={cityBtnRef}
                onClick={handleCityDropToggle}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20 text-white hover:border-purple-400 transition font-medium"
              >
                <span>📍 {form.city}</span>
                <span className={`text-[10px] transition-transform ${showCityDrop ? "rotate-180" : ""}`}>▼</span>
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Category *</label>
              <button
                type="button"
                ref={catBtnRef}
                onClick={handleCatDropToggle}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20 text-white hover:border-purple-400 transition font-medium"
              >
                <span>🏷️ {form.category}</span>
                <span className={`text-[10px] transition-transform ${showCatDrop ? "rotate-180" : ""}`}>▼</span>
              </button>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Price (₹)</label>
            <input
              placeholder="Leave empty for Free"
              value={form.price}
              onChange={e => setForm({ ...form, price: e.target.value })}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Image URL</label>
            <input
              placeholder="https://... (optional)"
              value={form.image_url}
              onChange={e => setForm({ ...form, image_url: e.target.value })}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition"
            />
            {form.image_url && (
              <img src={form.image_url} alt="preview" className="mt-2 h-28 w-full object-cover rounded-xl border border-white/10" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">Contact / Booking Link</label>
            <input
              placeholder="Phone, email or booking URL (optional)"
              value={form.contact}
              onChange={e => setForm({ ...form, contact: e.target.value })}
              className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {editingId && (
              <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 font-semibold transition">
                Cancel Edit
              </button>
            )}
            <button
              type="submit" disabled={posting}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 transition disabled:opacity-50"
            >
              {posting ? "Saving..." : editingId ? "✅ Update Event" : "🚀 Publish Event"}
            </button>
          </div>
        </form>

        {/* My Events */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">📌 My Created Events</h2>

          {myEvents.length === 0 ? (
            <p className="text-zinc-400">No events created yet.</p>
          ) : (
            <div className="space-y-4">
              {myEvents.map(event => (
                <div key={event.id} className="bg-white/10 p-5 rounded-xl border border-white/20 flex gap-4 items-start">
                  {event.image_url && (
                    <img src={event.image_url} alt={event.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <span className="bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded-full">{event.category}</span>
                    </div>
                    <p className="text-zinc-400 text-sm">📍 {event.location}, {event.city}</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      📅 {event.date} {event.time && `• 🕐 ${event.time}`}
                      {event.price && ` • ₹${event.price}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleEdit(event)} className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold transition">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-semibold transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* City Dropdown */}
      {showCityDrop && cityBtnRect && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowCityDrop(false)} />
          <div
            className="fixed z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ top: cityBtnRect.bottom + 8, left: cityBtnRect.left, width: cityBtnRect.width }}
          >
            {CITIES.map(c => (
              <button
                key={c} type="button"
                onClick={() => { setForm({ ...form, city: c }); setShowCityDrop(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${form.city === c ? "bg-purple-600 text-white" : "hover:bg-white/10 text-zinc-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Category Dropdown */}
      {showCatDrop && catBtnRect && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowCatDrop(false)} />
          <div
            className="fixed z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ top: catBtnRect.bottom + 8, left: catBtnRect.left, width: catBtnRect.width }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat} type="button"
                onClick={() => { setForm({ ...form, category: cat }); setShowCatDrop(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${form.category === cat ? "bg-purple-600 text-white" : "hover:bg-white/10 text-zinc-300"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}