"use client";
import { useState } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

export default function DatePicker({ value, onChange, label, required }: Props) {
  const [showCal, setShowCal] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const selectedDate = value ? new Date(value + "T12:00:00") : null;

  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setShowCal(false);
  };

  const formatDisplay = (val: string) => {
    if (!val) return "Pick a date";
    const d = new Date(val + "T12:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
  };

  return (
    <div className="relative">
      {label && (
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-1 block">
          {label} {required && "*"}
        </label>
      )}
      <button
        type="button"
        onClick={() => setShowCal(!showCal)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-purple-400/50 transition font-medium text-sm text-left"
      >
        <span className={value ? "text-white" : "text-zinc-500"}>
          📅 {formatDisplay(value)}
        </span>
        <span className={`text-[10px] transition-transform ${showCal ? "rotate-180" : ""}`}>▼</span>
      </button>

      {showCal && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowCal(false)} />
          <div className="absolute top-full left-0 mt-2 z-[70] bg-[#1a1138] border border-white/10 rounded-2xl shadow-2xl p-4 w-72">

            {/* Month/Year nav */}
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition">‹</button>
              <span className="font-bold text-sm text-white">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition">›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-zinc-500 py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const todayMark = isToday(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`w-8 h-8 mx-auto rounded-full text-xs font-semibold transition flex items-center justify-center ${
                      selected
                        ? "bg-purple-600 text-white"
                        : todayMark
                        ? "border border-purple-500/50 text-purple-300 hover:bg-purple-600/20"
                        : "text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-between mt-4 pt-3 border-t border-white/10">
              <button type="button" onClick={() => { onChange(""); setShowCal(false); }} className="text-xs text-zinc-500 hover:text-white transition">Clear</button>
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  const m = String(t.getMonth() + 1).padStart(2, "0");
                  const d = String(t.getDate()).padStart(2, "0");
                  onChange(`${t.getFullYear()}-${m}-${d}`);
                  setShowCal(false);
                }}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold transition"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}