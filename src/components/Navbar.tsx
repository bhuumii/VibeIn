"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (mounted) {
        setProfile(data);
      }
    };

    const initializeNavbar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };

    initializeNavbar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      mounted = false;

      subscription.unsubscribe();

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setDropdownOpen(false);

    router.push("/");

    router.refresh();
  };

  const getInitials = () => {
    const name =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.email ||
      "?";

    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatar = () => {
    return (
      profile?.avatar_url ||
      user?.user_metadata?.avatar_url ||
      null
    );
  };

  return (
    <nav className="flex justify-between items-center mb-16">
      <a href="/">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
          VibeIn'
        </h1>
      </a>

      {!loading && (
        <div className="flex gap-3 items-center">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() =>
                  setDropdownOpen(!dropdownOpen)
                }
                className="flex items-center gap-3 hover:opacity-80 transition"
              >
                <span className="text-zinc-300 text-sm hidden md:block">
                  {profile?.full_name ||
                    user?.user_metadata?.full_name ||
                    user?.email?.split("@")[0]}
                </span>

                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 flex items-center justify-center bg-purple-600 text-white font-bold text-sm">
                  {getAvatar() ? (
                    <img
                      src={getAvatar()}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (
                          e.target as HTMLImageElement
                        ).style.display = "none";
                      }}
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-14 w-48 bg-[#1f1147] border border-white/20 rounded-2xl shadow-xl overflow-hidden z-50">
                  <a
                    href="/profile"
                    onClick={() =>
                      setDropdownOpen(false)
                    }
                    className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition"
                  >
                    👤 View Profile
                  </a>

                  <a
                    href="/profile/edit"
                    onClick={() =>
                      setDropdownOpen(false)
                    }
                    className="block px-5 py-3 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition"
                  >
                    ✏️ Edit Profile
                  </a>

                  <div className="border-t border-white/10" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-white/10 transition"
                  >
                    🚪 Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a
                href="/login"
                className="text-zinc-300 hover:text-white text-sm transition"
              >
                Log in
              </a>

              <a
                href="/login"
                className="bg-white text-black px-5 py-2 rounded-full font-medium hover:scale-105 transition text-sm"
              >
                Sign up
              </a>
            </>
          )}
        </div>
      )}
    </nav>
  );
}