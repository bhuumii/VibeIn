"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="flex justify-between items-center mb-16">
      <a href="/">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
          CityPulse
        </h1>
      </a>

      {!loading && (
        <div className="flex gap-3 items-center">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-zinc-300 text-sm">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-full font-medium hover:bg-white/20 transition text-sm"
              >
                Log out
              </button>
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
