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
          placeholder={"Paste wallet addresses (one per line or comma-separated)\n\n0xabc...123\n0xdef...456"}
          className="w-full h-32 bg-poly-card border border-poly-border rounded-xl p-4 pr-24 text-sm font-mono text-poly-text placeholder:text-poly-muted/50 focus:outline-none focus:border-poly-accent/50 focus:ring-1 focus:ring-poly-accent/20 resize-none scrollbar-thin transition-colors"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={handlePaste}
          className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg bg-poly-border/50 text-poly-muted hover:text-poly-text hover:bg-poly-border transition-colors"
        >
          Paste
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-poly-muted">
          {count > 0 ? `${count} valid address${count > 1 ? "es" : ""}` : "No valid addresses"}
          {" · max 20"}
        </span>
        <button
          type="submit"
          disabled={count === 0 || loading}
          className="px-6 py-2.5 bg-poly-accent text-black font-semibold text-sm rounded-xl hover:bg-poly-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching...
            </span>
          ) : (
            `Check ${count > 0 ? count : ""} Wallet${count !== 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </form>
  );
}
