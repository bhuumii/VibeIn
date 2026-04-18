"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import FeatureButton from "@/components/FeatureButton";
import Navbar from "@/components/Navbar"
import { CITIES } from "@/lib/constants";

const CATEGORIES = ["All", "Music", "Comedy", "Fun Activities", "Workshops", "Arts & Crafts", "Theatre", "Kids"];


export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCityDrop, setShowCityDrop] = useState(false);
const [cityBtnRect, setCityBtnRect] = useState<DOMRect | null>(null);
const cityBtnRef = useRef<HTMLButtonElement>(null);

  const features = [
    {
      label: "Plan Your Day",
      icon: "🗓️",
      description: "Get a smart itinerary of events curated just for your vibe.",
      href: "/plan-your-day",
      gradient: "bg-gradient-to-br from-purple-600/20 to-pink-600/20",
    },
    {
      label: "Vibe with Strangers",
      icon: "👥",
      description: "Join live rooms and connect with people going to the same events.",
      href: "/vibe-room",
      gradient: "bg-gradient-to-br from-blue-600/20 to-cyan-600/20",
    },
    {
      label: "Make Your Event",
      icon: "✨",
      description: "Host your own pop-up, workshop, or meetup in minutes.",
      href: "/create-event",
      gradient: "bg-gradient-to-br from-orange-600/20 to-pink-600/20",
    },
  ];

    useEffect(() => {
    const init = async () => {
      // Check if user is logged in and has a city set
      const { data: { session } } = await supabase.auth.getSession();

      let cityToUse = "Delhi"; // default

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("city")
          .eq("id", session.user.id)
          .single();

        if (profile?.city && CITIES.includes(profile.city)) {
          cityToUse = profile.city;
        }
      }

      setSelectedCity(cityToUse);
      await fetchEvents(cityToUse);
    };

    init();
  }, []);





  const fetchEvents = async (city: string) => {
    setLoading(true);
   const { data } = await supabase
  .from("events")
  .select("id, title, city, category, date, time, location, price, image_url, source_url")
  .ilike("city", city)
  .order("created_at", { ascending: false })
   .limit(50);
    setEvents(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  // Apply filters whenever city, category or search changes
  useEffect(() => {
    let result = [...events];

    if (selectedCategory !== "All") {
      result = result.filter((e) =>
        e.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (search.trim()) {
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(search.toLowerCase()) ||
          e.location?.toLowerCase().includes(search.toLowerCase()) ||
          e.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [selectedCategory, search, events]);

  useEffect(() => {
  const handleScroll = () => {
    if (showCityDrop) setShowCityDrop(false);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, [showCityDrop]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedCategory("All");
    setSearch("");
    fetchEvents(city);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCityDropToggle = () => {
  if (!showCityDrop && cityBtnRef.current) {
    setCityBtnRect(cityBtnRef.current.getBoundingClientRect());
  }
  setShowCityDrop(!showCityDrop);
};

  return (
    <main className="relative overflow-hidden min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] text-white px-10 py-8">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/20 blur-[150px] rounded-full" />

      <div className="relative z-10">

        <Navbar />

        {/* HERO */}
        <section className="mb-14 text-center max-w-4xl mx-auto">
          <h2 className="text-6xl font-bold leading-tight mb-5">
            Discover the Best
            <span className="text-purple-300"> Events </span>
            Across India
          </h2>
          <p className="text-zinc-300 text-lg mb-10">
            Curated experiences, hidden gems, workshops, gigs and more across your city.
          </p>
          <a
            href="#events"
            className="inline-block border border-white/20 px-6 py-3 rounded-full text-sm hover:bg-white/10 transition"
          >
            Browse Events ↓
          </a>
        </section>

        {/* FEATURE BUTTONS */}
        <section className="max-w-5xl mx-auto mb-20">
          <p className="text-center text-zinc-500 text-sm mb-6 uppercase tracking-widest">
            What do you want to do?
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureButton key={f.href} {...f} />
            ))}
          </div>
        </section>

        {/* SEARCH + CITY */}
        <div className="mb-6 max-w-5xl mx-auto flex gap-4">
       <div className="relative">
  <button
    ref={cityBtnRef}
    onClick={handleCityDropToggle}
    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:border-purple-400 flex items-center gap-3 font-medium"
  >
     {selectedCity}
    <span className={`text-[10px] transition-transform ${showCityDrop ? "rotate-180" : ""}`}>▼</span>
  </button>
</div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search events, categories, vibes..."
            className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* CATEGORY FILTER */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full border transition font-medium text-sm ${
                selectedCategory === cat
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-white/10 border-white/20 hover:bg-purple-500/30 hover:border-purple-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* EVENTS */}
        <section id="events">
          <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold">
              {selectedCategory === "All" ? "All Events" : selectedCategory} in {selectedCity}
            </h3>
            <span className="text-zinc-400 text-sm">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl mb-2">No events found</p>
              <p className="text-sm">Try a different city or category</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((event) => (
                <a
                  key={event.id}
                  href={event.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:scale-105 hover:border-purple-400 transition duration-300 shadow-xl cursor-pointer block"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-white/5 overflow-hidden">
                    {event.image_url ? (
                      <img
  src={event.image_url}
  alt={event.title}
  loading="lazy"
  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {event.category === "Music" ? "🎵" :
                         event.category === "Comedy" ? "😂" :
                         event.category === "Fun Activities" ? "⚽" :
                         event.category === "Workshops" ? "🛠️" :
                         event.category === "Arts & Crafts" ? "🎨" :
                         event.category === "Theatre" ? "🎭" :
                         event.category === "Kids" ? "🧸" : "🎉"}
                      </div>
                    )}
                    {/* Category badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-purple-600/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                        {event.category || "General"}
                      </span>
                    </div>
                    {/* External link indicator */}
                    {event.source_url && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                        <span className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                          ↗ Open
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="text-lg font-semibold mb-1 line-clamp-2 group-hover:text-purple-300 transition">
                      {event.title}
                    </h4>
                    <p className="text-purple-300 text-xs mb-2">{event.city}</p>
                    <p className="text-zinc-400 text-sm truncate">📍 {event.location}</p>
                    {event.date && (
                      <p className="text-zinc-500 text-xs mt-1">📅 {event.date}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-green-400 font-bold">
                        {event.price === 0 || event.price === "0" || !event.price
                          ? "Free"
                          : `₹${event.price}`}
                      </p>
                      {event.source_url && (
                        <span className="text-xs text-zinc-500 group-hover:text-purple-300 transition">
                          Book →
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* City Dropdown */}
{showCityDrop && cityBtnRect && (
  <>
    <div className="fixed inset-0 z-[60]" onClick={() => setShowCityDrop(false)} />
    <div
      className="fixed z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        top: cityBtnRect.bottom + 8,
        left: cityBtnRect.left,
        width: cityBtnRect.width,
      }}
    >
      {CITIES.map(c => (
        <button
          key={c}
          onClick={() => { handleCityChange(c); setShowCityDrop(false); }}
          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
            selectedCity === c ? "bg-purple-600 text-white" : "hover:bg-white/10 text-zinc-300"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  </>
)}

    </main>
  );
}