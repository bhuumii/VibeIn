"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PlanYourDayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login?redirect=/plan-your-day");
      } else {
        setAuthorized(true);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] text-white px-10 py-8">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/20 blur-[150px] rounded-full" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <a href="/" className="text-zinc-400 hover:text-white text-sm mb-8 inline-block">
          ← Back to CityPulse
        </a>
        <div className="mt-20 text-center">
          <div className="text-8xl mb-6">🗓️</div>
          <h1 className="text-5xl font-bold mb-4">Plan Your Day</h1>
          <p className="text-zinc-300 text-xl mb-8 max-w-xl mx-auto">
            Get a smart itinerary of events curated just for your vibe. Coming soon!
          </p>
          <div className="inline-block bg-purple-500/20 border border-purple-500/30 rounded-2xl px-8 py-4 text-purple-300">
            🚧 Feature in progress
          </div>
        </div>
      </div>
    </main>
  );
}