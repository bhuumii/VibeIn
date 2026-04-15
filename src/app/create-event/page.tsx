"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateEventPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [user, setUser] = useState<any>(null);

  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    city: "Delhi",
    category: "Music",
    price: "",
    image_url: "",
    contact: "",
  });

  /* ---------------- FETCH USER + EVENTS ONLY ONCE ---------------- */
  useEffect(() => {
    const initializePage = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login?redirect=/create-event");
        return;
      }

      setUser(session.user);

      await fetchMyEvents(session.user.id);

      setLoading(false);
    };

    initializePage();
  }, []);

  /* ---------------- FETCH USER EVENTS ---------------- */
  const fetchMyEvents = async (userId: string) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("FETCH EVENTS ERROR:", error);
      return;
    }

    setMyEvents(data || []);
  };

  /* ---------------- CREATE / UPDATE EVENT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setPosting(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("events")
          .update({
            ...form,
          })
          .eq("id", editingId);

        if (error) throw error;

        alert("Event updated successfully!");
      } else {
        const { error } = await supabase.from("events").insert({
          user_id: user.id,
          ...form,
        });

        if (error) throw error;

        alert("Event created successfully!");
      }

      resetForm();

      await fetchMyEvents(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }

    setPosting(false);
  };

  /* ---------------- DELETE EVENT ---------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await fetchMyEvents(user.id);
  };

  /* ---------------- EDIT EVENT ---------------- */
  const handleEdit = (event: any) => {
    setEditingId(event.id);

    setForm({
      title: event.title || "",
      description: event.description || "",
      date: event.date || "",
      time: event.time || "",
      location: event.location || "",
      city: event.city || "Delhi",
      category: event.category || "Music",
      price: event.price || "",
      image_url: event.image_url || "",
      contact: event.contact || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ---------------- RESET FORM ---------------- */
  const resetForm = () => {
    setEditingId(null);

    setForm({
      title: "",
      description: "",
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

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#140b2d]">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] text-white px-6 py-8">
      <div className="max-w-4xl mx-auto">

        <a href="/" className="text-zinc-400 mb-6 inline-block">
          ← Back to VibeIn'
        </a>

        <h1 className="text-4xl font-bold mb-6">
          ✨ Create Your Event
        </h1>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 p-8 rounded-2xl border border-white/20 space-y-4"
        >
          <input
            required
            placeholder="Event Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            className="w-full p-3 rounded-xl bg-white/10"
          />

          <textarea
            required
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full p-3 rounded-xl bg-white/10"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) =>
                setForm({ ...form, date: e.target.value })
              }
              className="p-3 rounded-xl bg-white/10 [color-scheme:dark]"
            />

            <input
              type="time"
              required
              value={form.time}
              onChange={(e) =>
                setForm({ ...form, time: e.target.value })
              }
              className="p-3 rounded-xl bg-white/10 [color-scheme:dark]"
            />
          </div>

          <input
            required
            placeholder="Location"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            className="w-full p-3 rounded-xl bg-white/10"
          />

          <button
            type="submit"
            disabled={posting}
            className="w-full py-3 rounded-xl font-semibold text-white
            bg-gradient-to-r from-purple-500 to-fuchsia-500"
          >
            {posting
              ? "Saving..."
              : editingId
              ? "Update Event"
              : "🚀 Publish Event"}
          </button>
        </form>

        {/* MY EVENTS */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            📌 My Created Events
          </h2>

          {myEvents.length === 0 ? (
            <p className="text-zinc-400">
              No events created yet.
            </p>
          ) : (
            <div className="space-y-4">
              {myEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/10 p-5 rounded-xl border border-white/20"
                >
                  <h3 className="text-xl font-semibold">
                    {event.title}
                  </h3>

                  <p className="text-zinc-400">
                    {event.location}
                  </p>

                  <p className="text-zinc-500 text-sm">
                    {new Date(event.date)
                      .toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                      .replace(",", "")}
                  </p>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleEdit(event)}
                      className="px-4 py-2 bg-blue-500 rounded-lg"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(event.id)
                      }
                      className="px-4 py-2 bg-red-500 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}