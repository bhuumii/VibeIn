"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login?redirect=/profile"); return; }
      setUser(session.user);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
      setLoading(false);
    });
  }, [router]);

  const getInitials = () => {
    const name = profile?.full_name || user?.email || "?";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] text-white px-6 py-8">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/20 blur-[150px] rounded-full" />

      <div className="relative z-10 max-w-2xl mx-auto">
        <a href="/" className="text-zinc-400 hover:text-white text-sm mb-8 inline-block">
          ← Back to VibeIn'
        </a>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">

          {/* Avatar + Name */}
          <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-400 flex items-center justify-center bg-purple-600 text-white font-bold text-2xl mb-4">
  {profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt="avatar"
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  ) : (
    getInitials()
  )}
</div>
            <h1 className="text-2xl font-bold">{profile?.full_name || "No name set"}</h1>
            <p className="text-zinc-400 text-sm mt-1">@{profile?.username || "no username"}</p>
            {profile?.city && (
              <p className="text-purple-300 text-sm mt-1">📍 {profile.city}</p>
            )}
          </div>

          {/* Info rows */}
          <div className="space-y-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-500 text-xs mb-1">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-500 text-xs mb-1">Bio</p>
              <p className="text-white">{profile?.bio || "No bio yet"}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-zinc-500 text-xs mb-1">Member since</p>
              <p className="text-white">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          <a
            href="/profile/edit"
            className="block w-full text-center py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition"
          >
            Edit Profile
          </a>
        </div>
      </div>
    </main>
  );
}