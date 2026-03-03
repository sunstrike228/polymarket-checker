"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PLAYLIST_ID = "PLgf-8GQFjABq2XqYIaYD4C_uIZ4jLL4x-";
const START_INDEX = 14; // 0-based (index=15 in URL is 14 in API)

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [trackTitle, setTrackTitle] = useState("Loading...");
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateTitle = useCallback(() => {
    try {
      const data = playerRef.current?.getVideoData?.();
      if (data?.title) {
        setTrackTitle(data.title);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const w = window as any;

    // Load YouTube IFrame API
    if (typeof window !== "undefined" && !w.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    function initPlayer() {
      const YT = (window as any).YT;
      playerRef.current = new YT.Player("yt-player-frame", {
        height: "0",
        width: "0",
        playerVars: {
          listType: "playlist",
          list: PLAYLIST_ID,
          index: START_INDEX,
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(30);
            setReady(true);
            setTimeout(updateTitle, 1000);
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              updateTitle();
            } else if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          },
        },
      });
    }

    if (w.YT && w.YT.Player) {
      initPlayer();
    } else {
      w.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      playerRef.current?.destroy?.();
    };
  }, [updateTitle]);

  function handlePlayPause() {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  function handlePrev() {
    playerRef.current?.previousVideo?.();
    setTimeout(updateTitle, 500);
  }

  function handleNext() {
    playerRef.current?.nextVideo?.();
    setTimeout(updateTitle, 500);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume?.(v);
  }

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-0 left-0 right-0 z-[9998] transition-all duration-300 ${
        minimized ? "translate-y-[calc(100%-32px)]" : ""
      }`}
    >
      {/* Minimize toggle */}
      <button
        onClick={() => setMinimized(!minimized)}
        className="absolute -top-7 left-1/2 -translate-x-1/2 bg-sw-card border border-sw-border border-b-0 rounded-t-lg px-4 py-1 text-[10px] font-display text-sw-muted hover:text-sw-neon transition-colors tracking-wider"
      >
        {minimized ? "▲ PLAYER" : "▼ HIDE"}
      </button>

      <div className="bg-sw-bg/95 backdrop-blur-md border-t border-sw-neon/30 shadow-[0_-4px_20px_rgba(255,45,149,0.15)]">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-4">
          {/* Retro label */}
          <div className="hidden sm:flex items-center gap-2 text-sw-neon/60">
            <div className="w-2 h-2 rounded-full bg-sw-neon/60 animate-pulse" />
            <span className="font-display text-[9px] tracking-[0.25em] uppercase">FM</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!ready}
              className="w-8 h-8 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center text-sw-muted hover:text-sw-cyan hover:border-sw-cyan/50 transition-all disabled:opacity-30 text-sm"
              title="Previous"
            >
              ⏮
            </button>
            <button
              onClick={handlePlayPause}
              disabled={!ready}
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all disabled:opacity-30 text-lg ${
                isPlaying
                  ? "bg-sw-neon/10 border-sw-neon text-sw-neon shadow-neon"
                  : "bg-sw-card border-sw-border text-sw-muted hover:text-sw-neon hover:border-sw-neon/50"
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              onClick={handleNext}
              disabled={!ready}
              className="w-8 h-8 rounded-lg bg-sw-card border border-sw-border flex items-center justify-center text-sw-muted hover:text-sw-cyan hover:border-sw-cyan/50 transition-all disabled:opacity-30 text-sm"
              title="Next"
            >
              ⏭
            </button>
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-sw-text truncate font-mono">
              {isPlaying && <span className="text-sw-neon mr-2">♪</span>}
              {trackTitle}
            </div>
            {isPlaying && (
              <div className="flex gap-[2px] items-end h-2 mt-1">
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-sw-neon/60 rounded-sm"
                    style={{
                      height: `${4 + Math.random() * 8}px`,
                      animation: `eq-bar ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] text-sw-muted font-display">VOL</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolume}
              className="w-20 h-1 accent-sw-neon bg-sw-border rounded-full appearance-none cursor-pointer volume-slider"
            />
            <span className="text-[10px] text-sw-muted font-mono w-6 text-right">{volume}</span>
          </div>
        </div>
      </div>

      {/* Hidden YT iframe */}
      <div className="hidden">
        <div id="yt-player-frame" />
      </div>
    </div>
  );
}
