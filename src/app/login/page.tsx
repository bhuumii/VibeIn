"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push(redirect);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push(redirect);
    }

    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#140b2d] via-[#1f1147] to-[#2a145c] flex items-center justify-center px-4 relative">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-purple-500/20 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-pink-500/20 blur-[150px] rounded-full" />

      <div className="relative z-10 w-full max-w-md">
        <a href="/" className="block text-center mb-8">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
            VibeIn'
          </span>
        </a>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-white mb-1">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-zinc-400 text-sm mb-8">
            {isSignup ? "Join VibeIn' to plan, vibe, and create events." : "Log in to access all VibeIn' features."}
          </p>

          <button
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-100 transition mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-zinc-500 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-sm text-zinc-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
            </button>
          </form>

          <p className="text-center text-zinc-400 text-sm mt-6">
            {isSignup ? "Already have an account?" : "New to VibeIn'?"}{" "}
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="text-purple-300 hover:text-purple-200 font-medium"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#140b2d]" />}>
      <LoginForm />
    </Suspense>
  );
}