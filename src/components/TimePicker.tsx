"use client";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

export default function TimePicker({ value, onChange, label, required }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const parseTime = (val: string) => {
    if (!val) return { hour: 12, minute: 0, ampm: "PM" };
    const [h, m] = val.split(":").map(Number);
    return {
      hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
      minute: m,
      ampm: h >= 12 ? "PM" : "AM"
    };
  };

  const { hour, minute, ampm } = parseTime(value);
  const [selHour, setSelHour] = useState(hour);
  const [selMinute, setSelMinute] = useState(minute);
  const [selAmpm, setSelAmpm] = useState(ampm);

  const applyTime = (h: number, m: number, ap: string) => {
    let hour24 = h;
    if (ap === "AM" && h === 12) hour24 = 0;
    else if (ap === "PM" && h !== 12) hour24 = h + 12;
    const hh = String(hour24).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    onChange(`${hh}:${mm}`);
  };

  const formatDisplay = (val: string) => {
    if (!val) return "Pick a time";
    const [h, m] = val.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="relative">
      {label && (
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">
          {label} {required && "*"}
        </label>
      )}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 transition font-medium text-sm"
      >
        <span className={value ? "text-white" : "text-zinc-500"}>
          🕐 {formatDisplay(value)}
        </span>
        <span className={`text-[10px] transition-transform ${showPicker ? "rotate-180" : ""}`}>▼</span>
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowPicker(false)} />
          <div className="absolute top-full left-0 mt-2 z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl p-4 w-64">

            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">Select Time</p>

            {/* AM/PM toggle */}
            <div className="flex gap-2 mb-4">
              {["AM", "PM"].map(ap => (
                <button
                  type="button" key={ap}
                  onClick={() => { setSelAmpm(ap); applyTime(selHour, selMinute, ap); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                    selAmpm === ap ? "bg-purple-600 text-white" : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {ap}
                </button>
              ))}
            </div>

            {/* Hours */}
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">Hour</p>
            <div className="grid grid-cols-6 gap-1 mb-4">
              {HOURS.map(h => (
                <button
                  type="button" key={h}
                  onClick={() => { setSelHour(h); applyTime(h, selMinute, selAmpm); }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    selHour === h ? "bg-purple-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {String(h).padStart(2, "0")}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-widest mb-2">Minute</p>
            <div className="grid grid-cols-6 gap-1">
              {MINUTES.map(m => (
                <button
                  type="button" key={m}
                  onClick={() => { setSelMinute(m); applyTime(selHour, m, selAmpm); }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    selMinute === m ? "bg-purple-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}