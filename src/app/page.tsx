import { supabase } from "@/lib/supabase";
import FeatureButton from "@/components/FeatureButton";
import Navbar from "@/components/Navbar";

export default async function Home() {
  const { data: events } = await supabase.from("events").select("*");

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
        <div className="mb-10 max-w-5xl mx-auto flex gap-4">
          <select className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <option>Delhi</option>
            <option>Mumbai</option>
            <option>Bangalore</option>
            <option>Hyderabad</option>
          </select>
          <input
            type="text"
            placeholder="🔍 Search events, categories, vibes..."
            className="w-full p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex justify-center gap-4 mb-16 flex-wrap">
          {["Music", "Comedy", "Sports", "Workshops", "Art", "Theatre"].map((cat) => (
            <button
              key={cat}
              className="bg-white/10 px-5 py-2 rounded-full border border-white/20 hover:bg-purple-500 hover:scale-105 transition"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* EVENTS */}
        <section id="events">
          <h3 className="text-3xl font-bold mb-8">Featured Events</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {events?.map((event) => (
              <div
                key={event.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 hover:scale-105 hover:border-purple-400 transition duration-300 shadow-xl"
              >
                <img
                  src={event.image_url || "/placeholder-event.jpg"}
                  alt={event.title}
                  className="w-full h-52 object-cover"
                />
                <div className="p-5">
                  <h4 className="text-2xl font-semibold mb-1">{event.title}</h4>
                  <p className="text-purple-300 text-sm mb-2">{event.city}</p>
                  <p className="text-zinc-300">{event.location}</p>
                  <p className="text-sm text-zinc-400 mb-3">{
  new Date(event.date)
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .replace(",", "")
}</p>
                  <p className="text-lg font-bold text-green-400">₹{event.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}