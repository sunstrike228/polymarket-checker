"use client";

import { useState } from "react";

interface Props {
  onSubmit: (addresses: string[]) => void;
  loading: boolean;
}

export default function AddressInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addrs = text
      .split(/[\n,]+/)
      .map((a) => a.trim())
      .filter((a) => /^0x[a-fA-F0-9]{40}$/.test(a));
    if (addrs.length > 0) {
      onSubmit(addrs);
    }
  }

  function handlePaste() {
    navigator.clipboard.readText().then((clip) => {
      const addrs = clip
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter((a) => /^0x[a-fA-F0-9]{40}$/.test(a));
      if (addrs.length > 0) {
        setText((prev) => (prev ? prev + "\n" : "") + addrs.join("\n"));
      }
    });
  }

  const count = text
    .split(/[\n,]+/)
    .map((a) => a.trim())
    .filter((a) => /^0x[a-fA-F0-9]{40}$/.test(a)).length;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"// paste wallet addresses (one per line or comma-separated)\n\n0xabc...123\n0xdef...456"}
          className="w-full h-32 bg-sw-card border border-sw-border rounded-xl p-4 pr-24 text-sm font-mono text-sw-text placeholder:text-sw-muted/40 focus:outline-none focus:border-sw-neon/50 focus:shadow-neon resize-none scrollbar-thin transition-all"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={handlePaste}
          className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg bg-sw-border/50 text-sw-muted hover:text-sw-cyan hover:bg-sw-border font-mono uppercase tracking-wider transition-all"
        >
          Paste
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-sw-muted font-mono tracking-wider">
          {count > 0 ? (
            <><span className="text-sw-cyan">{count}</span> valid address{count > 1 ? "es" : ""}</>
          ) : (
            "no valid addresses"
          )}
          {" // unlimited"}
        </span>
        <button
          type="submit"
          disabled={count === 0 || loading}
          className="px-6 py-2.5 bg-sw-neon text-sw-bg font-bold text-sm rounded-xl hover:shadow-neon disabled:opacity-20 disabled:cursor-not-allowed transition-all font-display tracking-wider uppercase"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              SCANNING...
            </span>
          ) : (
            `SCAN ${count > 0 ? count : ""} WALLET${count !== 1 ? "S" : ""}`
          )}
        </button>
      </div>
    </form>
  );
}
