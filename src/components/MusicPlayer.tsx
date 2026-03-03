"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const PLAYLIST_ID = "PLgf-8GQFjABq2XqYIaYD4C_uIZ4jLL4x-";
const START_INDEX = 14; // "Kaoru Akimoto - Dress Down"

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [trackTitle, setTrackTitle] = useState("Kaoru Akimoto - Dress Down");
  const [ready, setReady] = useState(false);
  const playerRef = useRef<any>(null);

  // Generate stable random bar heights for EQ visualization
  const eqBars = useMemo(() =>
    Array.from({ length: 28 }, () => ({
      h: 4 + Math.random() * 56,
      speed: 0.3 + Math.random() * 0.5,
      delay: Math.random() * 0.5,
    })), []
  );

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
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(30);
            event.target.playVideo();
            setReady(true);
            setTimeout(updateTitle, 1500);
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

  function handlePlay() {
    playerRef.current?.playVideo?.();
  }
  function handlePause() {
    playerRef.current?.pauseVideo?.();
  }
  function handleStop() {
    playerRef.current?.stopVideo?.();
    setIsPlaying(false);
  }
  function handlePrev() {
    playerRef.current?.previousVideo?.();
    setTimeout(updateTitle, 800);
  }
  function handleNext() {
    playerRef.current?.nextVideo?.();
    setTimeout(updateTitle, 800);
  }
  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume?.(v);
  }

  return (
    <div className="wmp-container select-none">
      {/* ═══ Title Bar ═══ */}
      <div className="wmp-titlebar">
        <div className="flex items-center gap-1.5">
          <div className="wmp-titlebar-icon">
            <span className="text-[9px]">🎵</span>
          </div>
          <span className="text-[11px] font-bold text-white" style={{ fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif", textShadow: "1px 1px 0 #000" }}>
            FTP Media Player
          </span>
        </div>
        <div className="flex gap-[2px]">
          <button className="wmp-window-btn">_</button>
          <button className="wmp-window-btn">□</button>
          <button className="wmp-window-btn wmp-close-btn">✕</button>
        </div>
      </div>

      {/* ═══ Menu Bar ═══ */}
      <div className="wmp-menubar">
        <span className="wmp-menu-item"><u>F</u>ile</span>
        <span className="wmp-menu-item"><u>V</u>iew</span>
        <span className="wmp-menu-item"><u>P</u>lay</span>
        <span className="wmp-menu-item"><u>N</u>avigate</span>
        <span className="wmp-menu-item">F<u>a</u>vorites</span>
        <span className="wmp-menu-item"><u>H</u>elp</span>
      </div>

      {/* ═══ Visualization Area ═══ */}
      <div className="wmp-viz-area">
        {isPlaying ? (
          <div className="flex items-end justify-center gap-[2px] h-full px-4 pb-4 pt-8">
            {eqBars.map((bar, i) => (
              <div
                key={i}
                className="wmp-eq-bar"
                style={{
                  height: `${bar.h}%`,
                  animation: `wmp-eq ${bar.speed}s ease-in-out infinite alternate`,
                  animationDelay: `${bar.delay}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-[40px] mb-2 opacity-80">🎧</div>
              <div className="text-[11px] text-[#88aacc]" style={{ fontFamily: "'Tahoma', sans-serif" }}>
                {ready ? "Paused" : "Loading playlist..."}
              </div>
            </div>
          </div>
        )}
        {/* Track title overlay */}
        <div className="absolute bottom-2 left-3 right-3">
          <div className="text-[10px] text-[#66ff99] truncate" style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 4px #66ff99" }}>
            ♪ {trackTitle}
          </div>
        </div>
      </div>

      {/* ═══ Seek Bar Area ═══ */}
      <div className="wmp-seek-area">
        <div className="wmp-seek-track">
          <div className="wmp-seek-fill" style={{ width: isPlaying ? "100%" : "0%" }} />
        </div>
      </div>

      {/* ═══ Controls ═══ */}
      <div className="wmp-controls">
        <div className="flex items-center gap-[2px]">
          <button onClick={handlePlay} disabled={!ready} className="wmp-ctrl-btn" title="Play">▶</button>
          <button onClick={handlePause} disabled={!ready} className="wmp-ctrl-btn" title="Pause">⏸</button>
          <button onClick={handleStop} disabled={!ready} className="wmp-ctrl-btn" title="Stop">⏹</button>
          <div className="w-[1px] h-4 bg-[#808080] mx-1" />
          <button onClick={handlePrev} disabled={!ready} className="wmp-ctrl-btn" title="Previous">⏮</button>
          <button className="wmp-ctrl-btn" disabled title="Rewind">⏪</button>
          <button className="wmp-ctrl-btn" disabled title="Fast Forward">⏩</button>
          <button onClick={handleNext} disabled={!ready} className="wmp-ctrl-btn" title="Next">⏭</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolume}
            className="wmp-volume-slider"
          />
        </div>
      </div>

      {/* ═══ Status Bar ═══ */}
      <div className="wmp-statusbar">
        <span>{isPlaying ? "Playing" : ready ? "Stopped" : "Loading..."}</span>
      </div>

      {/* Hidden YT iframe */}
      <div className="hidden">
        <div id="yt-player-frame" />
      </div>
    </div>
  );
}
