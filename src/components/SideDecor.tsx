"use client";

import { useEffect, useRef, useState } from "react";

interface DecorItem {
  text: string;
  color: string;
  glow?: string;
  size?: string;
  style?: "kanji" | "text" | "ascii";
}

const LEFT_ITEMS: DecorItem[] = [
  { text: "夜", color: "text-sw-neon", glow: "text-glow-pink", style: "kanji" },
  { text: "═══", color: "text-sw-border", style: "text" },
  { text: "走", color: "text-sw-cyan", glow: "text-glow-cyan", style: "kanji" },
  { text: "╔═╗\n║▓║\n╚═╝", color: "text-sw-purple/40", style: "ascii" },
  { text: "東", color: "text-sw-purple", glow: "text-glow-purple", style: "kanji" },
  { text: "───", color: "text-sw-border", style: "text" },
  { text: "風", color: "text-sw-neon", glow: "text-glow-pink", style: "kanji" },
  { text: "  ╱╲\n ╱──╲\n╱────╲", color: "text-sw-cyan/30", style: "ascii" },
  { text: "速", color: "text-sw-yellow", style: "kanji" },
  { text: "═══", color: "text-sw-border", style: "text" },
  { text: "闇", color: "text-sw-red", glow: "text-glow-red", style: "kanji" },
  { text: "╔═══╗\n║FTP║\n╚═══╝", color: "text-sw-neon/50", style: "ascii" },
  { text: "雷", color: "text-sw-cyan", glow: "text-glow-cyan", style: "kanji" },
];

const RIGHT_ITEMS: DecorItem[] = [
  { text: "影", color: "text-sw-cyan", glow: "text-glow-cyan", style: "kanji" },
  { text: "═══", color: "text-sw-border", style: "text" },
  { text: "光", color: "text-sw-neon", glow: "text-glow-pink", style: "kanji" },
  { text: "┌──┐\n│░░│\n└──┘", color: "text-sw-purple/40", style: "ascii" },
  { text: "龍", color: "text-sw-yellow", style: "kanji" },
  { text: "───", color: "text-sw-border", style: "text" },
  { text: "夢", color: "text-sw-purple", glow: "text-glow-purple", style: "kanji" },
  { text: " ◢◣\n◢██◣\n▔▔▔▔", color: "text-sw-neon/30", style: "ascii" },
  { text: "魂", color: "text-sw-green", glow: "text-glow-green", style: "kanji" },
  { text: "═══", color: "text-sw-border", style: "text" },
  { text: "星", color: "text-sw-cyan", glow: "text-glow-cyan", style: "kanji" },
  { text: "╔═══╗\n║ $ ║\n╚═══╝", color: "text-sw-yellow/50", style: "ascii" },
  { text: "炎", color: "text-sw-red", glow: "text-glow-red", style: "kanji" },
];

function DecorColumn({ items, side }: { items: DecorItem[]; side: "left" | "right" }) {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-idx"));
          setVisible((prev) => {
            const next = new Set(prev);
            if (entry.isIntersecting) {
              next.add(idx);
            }
            return next;
          });
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed top-0 ${side === "left" ? "left-4 2xl:left-8" : "right-4 2xl:right-8"} h-full hidden 2xl:flex flex-col items-center justify-center gap-12 pointer-events-none z-10`}
    >
      {items.map((item, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          data-idx={i}
          className={`transition-all duration-700 ${
            visible.has(i)
              ? "opacity-100 translate-y-0"
              : side === "left"
              ? "opacity-0 -translate-x-4"
              : "opacity-0 translate-x-4"
          }`}
          style={{ transitionDelay: `${i * 80}ms` }}
        >
          {item.style === "kanji" ? (
            <span
              className={`text-4xl 2xl:text-5xl font-bold ${item.color} ${item.glow || ""} select-none neon-flicker`}
              style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                animationDelay: `${i * 1.5}s`,
              }}
            >
              {item.text}
            </span>
          ) : item.style === "ascii" ? (
            <pre className={`text-[10px] leading-tight font-mono ${item.color} select-none whitespace-pre`}>
              {item.text}
            </pre>
          ) : (
            <span className={`text-sm font-mono ${item.color} select-none`}>
              {item.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SideDecor() {
  return (
    <>
      <DecorColumn items={LEFT_ITEMS} side="left" />
      <DecorColumn items={RIGHT_ITEMS} side="right" />
    </>
  );
}
