"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Loader2, LogIn } from "lucide-react";

export function ParticipantJoin() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const d = [...digits];
    d[index] = value.replace(/\D/g, "").slice(-1);
    setDigits(d);
    setError(null);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const d = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) d[i] = pasted[i];
    setDigits(d);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit() {
    const code = digits.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<{ joinToken: string }>("/api/join/code", { code });
      router.push(`/join/${data.joinToken}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No live session found with that code"
      );
    } finally {
      setLoading(false);
    }
  }

  const isFull = digits.every((d) => d !== "");

  return (
    <div className="bg-white rounded-2xl border border-[#dadce0] shadow-sm p-6 flex flex-col gap-5 h-full hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-semibold text-gray-900">Join a Live Session</p>
        <p className="text-xs text-gray-500 mt-0.5">Enter the 6-digit code from your trainer</p>
      </div>

      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={[
              "w-11 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors bg-[#f8f9fa]",
              error
                ? "border-red-300 text-red-600 focus:border-red-400"
                : d
                ? "border-[#1a73e8] text-[#1a73e8] bg-blue-50/30"
                : "border-[#dadce0] text-gray-900 focus:border-[#1a73e8]",
            ].join(" ")}
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!isFull || loading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#1a73e8] text-white text-[15px] font-medium hover:bg-[#1557b0] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors mt-auto"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
        Join Session
      </button>
    </div>
  );
}
