"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface FeatureButtonProps {
  label: string;
  icon: string;
  description: string;
  href: string;
  gradient: string;
}

export default function FeatureButton({
  label,
  icon,
  description,
  href,
  gradient,
}: FeatureButtonProps) {
  const router = useRouter();

  const handleClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      router.push(href);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative w-full p-6 rounded-2xl border border-white/20 bg-white/5 
        backdrop-blur-md hover:scale-105 hover:border-purple-400/60 
        transition-all duration-300 text-left overflow-hidden`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient} rounded-2xl`}
      />
      <div className="relative z-10">
        <span className="text-3xl mb-3 block">{icon}</span>
        <h3 className="text-xl font-bold text-white mb-1">{label}</h3>
        <p className="text-zinc-400 text-sm">{description}</p>
      </div>
      <div className="absolute top-5 right-5 text-white/30 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-300 text-xl">
        →
      </div>
    </button>
  );
}