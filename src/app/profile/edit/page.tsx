"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push("/login?redirect=/profile/edit"); return; }
      setUser(session.user);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setCity(data.city || "");
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    });
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, username, bio, city, avatar_url: avatarUrl })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Profile updated successfully!");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const getInitials = () => {
    return (fullName || user?.email || "?")
      .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
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

      <div className="relative z-10 max-w-2xl mx-auto">
        <a href="/profile" className="text-zinc-400 hover:text-white text-sm mb-8 inline-block">
          ← Back to Profile
        </a>

        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* PROFILE FORM */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 mb-6">
          <h2 className="text-xl font-semibold mb-6">Profile Info</h2>

  {/* Avatar picker */}
<div className="mb-6">
  <label className="text-sm text-zinc-400 block mb-3">Choose Your Avatar</label>
  
  <div className="flex items-center gap-4 mb-4">
    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-400 flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
          {getInitials()}
        </div>
      )}
    </div>
    <p className="text-zinc-400 text-sm">Pick one below or keep your current avatar</p>
  </div>

  <div className="grid grid-cols-6 gap-3">
    {[
      "Felix", "Aneka", "Zoe", "Milo", "Luna", "Kai",
      "Nova", "Rex", "Aria", "Leo", "Maya", "Sam"
    ].map((seed) => {
      const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
      return (
        <button
          key={seed}
          type="button"
          onClick={() => setAvatarUrl(url)}
          className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition hover:scale-110 ${
            avatarUrl === url
              ? "border-purple-400 scale-110"
              : "border-white/20 hover:border-purple-400/60"
          }`}
        >
          <img src={url} alt={seed} className="w-full h-full object-cover bg-white" />
          {avatarUrl === url && (
            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </button>
      );
    })}
  </div>
</div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@yourname"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="">Select your city</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
            
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a bit about yourself..."
                rows={3}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 cursor-not-allowed"
              />
              <p className="text-zinc-600 text-xs mt-1">Email cannot be changed</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* PASSWORD FORM */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}