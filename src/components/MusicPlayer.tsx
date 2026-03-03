"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PLAYLIST_ID = "PLgf-8GQFjABq2XqYIaYD4C_uIZ4jLL4x-";
const START_INDEX = 14; // 0-based: "Kaoru Akimoto - Dress Down"

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [trackTitle, setTrackTitle] = useState("Loading playlist...");
  const [videoId, setVideoId] = useState("c9hGXjaKH_g");
  const [ready, setReady] = useState(false);
  const playerRef = useRef<any>(null);

  const updateInfo = useCallback(() => {
    try {
      const data = playerRef.current?.getVideoData?.();
      if (data?.title) setTrackTitle(data.title);
      if (data?.video_id) setVideoId(data.video_id);
    } catch { /* ignore */ }
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
        height: "1",
        width: "1",
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
            setTimeout(updateInfo, 2000);
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT;
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              updateInfo();
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

    return () => { playerRef.current?.destroy?.(); };
  }, [updateInfo]);

  function handlePlay() { playerRef.current?.playVideo?.(); }
  function handlePause() { playerRef.current?.pauseVideo?.(); }
  function handleStop() { playerRef.current?.stopVideo?.(); setIsPlaying(false); }
  function handlePrev() { playerRef.current?.previousVideo?.(); setTimeout(updateInfo, 800); }
  function handleNext() { playerRef.current?.nextVideo?.(); setTimeout(updateInfo, 800); }
  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume?.(v);
  }

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="wmp-container select-none">
      <div className="wmp-titlebar">
        <div className="flex items-center gap-1.5">
          <div className="wmp-titlebar-icon"><span className="text-[9px]">🎵</span></div>
          <span className="wmp-titlebar-text">FTP Media Player</span>
        </div>
        <div className="flex gap-[2px]">
          <button className="wmp-window-btn">_</button>
          <button className="wmp-window-btn">□</button>
          <button className="wmp-window-btn wmp-close-btn">✕</button>
        </div>
      </div>

      <div className="wmp-menubar">
        <span className="wmp-menu-item"><u>F</u>ile</span>
        <span className="wmp-menu-item"><u>V</u>iew</span>
        <span className="wmp-menu-item"><u>P</u>lay</span>
        <span className="wmp-menu-item"><u>N</u>avigate</span>
        <span className="wmp-menu-item">F<u>a</u>vorites</span>
        <span className="wmp-menu-item"><u>H</u>elp</span>
      </div>

      <div className="wmp-viz-area">
        <img src={thumbUrl} alt={trackTitle} className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 z-20">
          <div className="text-[10px] text-[#66ff99] truncate" style={{ fontFamily: "'Courier New', monospace", textShadow: "0 0 4px #66ff99" }}>
            ♪ {trackTitle}
          </div>
        </div>
      </div>

      <div className="wmp-seek-area">
        <div className="wmp-seek-track">
          <div className="wmp-seek-fill" style={{ width: isPlaying ? "100%" : "0%" }} />
        </div>
      </div>

      <div className="wmp-controls">
        <div className="wmp-ctrl-group">
          <button onClick={handlePlay} disabled={!ready} className="wmp-ctrl-btn" title="Play">▶</button>
          <button onClick={handlePause} disabled={!ready} className="wmp-ctrl-btn" title="Pause">⏸</button>
          <button onClick={handleStop} disabled={!ready} className="wmp-ctrl-btn" title="Stop">⏹</button>
          <div className="wmp-ctrl-divider" />
          <button onClick={handlePrev} disabled={!ready} className="wmp-ctrl-btn" title="Previous">⏮</button>
          <button className="wmp-ctrl-btn" disabled title="Rewind">⏪</button>
          <button className="wmp-ctrl-btn" disabled title="Fast Forward">⏩</button>
          <button onClick={handleNext} disabled={!ready} className="wmp-ctrl-btn" title="Next">⏭</button>
        </div>
        <div className="wmp-vol-group">
          <span className="text-[10px]">🔊</span>
          <input type="range" min="0" max="100" value={volume} onChange={handleVolume} className="wmp-volume-slider" />
        </div>
      </div>

      <div className="wmp-statusbar">
        <span>{isPlaying ? "Playing" : ready ? "Stopped" : "Loading..."}</span>
      </div>

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
        <div id="yt-player-frame" />
      </div>
    </div>
  );
}
