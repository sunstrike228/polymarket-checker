"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PLAYLIST_ID = "PLgf-8GQFjABq2XqYIaYD4C_uIZ4jLL4x-";
const START_VIDEO_ID = "c9hGXjaKH_g"; // Kaoru Akimoto - Dress Down

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [trackTitle, setTrackTitle] = useState("Loading playlist...");
  const [videoId, setVideoId] = useState(START_VIDEO_ID);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const playerRef = useRef<any>(null);
  const unmutedRef = useRef(false);

  const updateInfo = useCallback(() => {
    try {
      const data = playerRef.current?.getVideoData?.();
      if (data?.title) setTrackTitle(data.title);
      if (data?.video_id) setVideoId(data.video_id);
    } catch { /* ignore */ }
  }, []);

  /** Try to unmute the player */
  const tryUnmute = useCallback(() => {
    if (unmutedRef.current || !playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(30);
      const isMuted = playerRef.current.isMuted?.();
      if (!isMuted) {
        unmutedRef.current = true;
        setMuted(false);
      }
    } catch { /* browser blocked it */ }
  }, []);

  // Aggressive unmute: on ANY user interaction
  useEffect(() => {
    function handleInteraction() {
      if (unmutedRef.current) {
        cleanup();
        return;
      }
      tryUnmute();
      // Also ensure it's playing
      if (playerRef.current) {
        try {
          const state = playerRef.current.getPlayerState?.();
          const YT = (window as any).YT;
          if (YT && state !== YT.PlayerState.PLAYING) {
            playerRef.current.playVideo();
          }
        } catch { /* ignore */ }
      }
      if (unmutedRef.current) cleanup();
    }

    function cleanup() {
      ["click", "touchstart", "keydown", "scroll", "mousemove", "pointerdown"].forEach(evt =>
        document.removeEventListener(evt, handleInteraction, true)
      );
    }

    ["click", "touchstart", "keydown", "scroll", "mousemove", "pointerdown"].forEach(evt =>
      document.addEventListener(evt, handleInteraction, { capture: true })
    );

    return cleanup;
  }, [tryUnmute]);

  // YouTube player init
  useEffect(() => {
    const w = window as any;

    // Load YouTube IFrame API script if not already present
    if (!w.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    function createPlayer() {
      // Don't create if already exists or target div is missing
      if (playerRef.current) return;
      const el = document.getElementById("yt-player-frame");
      if (!el) return;
      const YT = w.YT;
      if (!YT?.Player) return;

      playerRef.current = new YT.Player("yt-player-frame", {
        height: "1",
        width: "1",
        videoId: START_VIDEO_ID,
        playerVars: {
          list: PLAYLIST_ID,
          listType: "playlist",
          autoplay: 1,
          mute: 1, // Start muted (browser requires this for autoplay)
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
            setIsPlaying(true);

            // Aggressive unmute attempts
            setTimeout(() => tryUnmute(), 500);
            setTimeout(() => tryUnmute(), 1500);
            setTimeout(() => tryUnmute(), 3000);
            setTimeout(() => updateInfo(), 2000);

            // Safety net: if not playing after 3s, force play again
            setTimeout(() => {
              try {
                const state = event.target.getPlayerState?.();
                if (state !== 1) { // 1 = PLAYING
                  event.target.playVideo();
                }
              } catch { /* */ }
            }, 3000);
          },
          onStateChange: (event: any) => {
            const YT = w.YT;
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              updateInfo();
              // Every time playback starts, try to unmute
              if (!unmutedRef.current) {
                tryUnmute();
                setTimeout(() => tryUnmute(), 300);
                setTimeout(() => tryUnmute(), 1000);
              }
            } else if (event.data === YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === YT.PlayerState.ENDED) {
              // Auto-advance to next
              event.target.nextVideo();
            }
          },
          onError: () => {
            // On error, skip to next track
            setTimeout(() => {
              try { playerRef.current?.nextVideo?.(); } catch { /* */ }
            }, 2000);
          },
        },
      });
    }

    if (w.YT?.Player) {
      createPlayer();
    } else {
      const prevCallback = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        createPlayer();
      };
    }

    // Fallback: retry every 2s for up to 10s if player hasn't been created
    const retryInterval = setInterval(() => {
      if (!playerRef.current && w.YT?.Player) createPlayer();
      if (playerRef.current) clearInterval(retryInterval);
    }, 2000);
    const retryTimeout = setTimeout(() => clearInterval(retryInterval), 10000);

    return () => {
      clearInterval(retryInterval);
      clearTimeout(retryTimeout);
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* */ }
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlay() {
    playerRef.current?.playVideo?.();
    tryUnmute();
  }
  function handlePause() { playerRef.current?.pauseVideo?.(); }
  function handleStop() { playerRef.current?.stopVideo?.(); setIsPlaying(false); }
  function handlePrev() { playerRef.current?.previousVideo?.(); setTimeout(updateInfo, 800); }
  function handleNext() { playerRef.current?.nextVideo?.(); setTimeout(updateInfo, 800); }
  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume?.(v);
    if (muted && v > 0) {
      playerRef.current?.unMute?.();
      unmutedRef.current = true;
      setMuted(false);
    }
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
            ♪ {trackTitle} {muted && isPlaying ? "(click anywhere to unmute)" : ""}
          </div>
        </div>
        {/* Unmute overlay — shown only when playing but still muted */}
        {muted && isPlaying && (
          <button
            onClick={() => tryUnmute()}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity hover:bg-black/20"
          >
            <span className="text-white text-xs font-display tracking-wider uppercase animate-pulse px-4 py-2 rounded-lg bg-black/60 border border-white/20">
              🔊 Click to unmute
            </span>
          </button>
        )}
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
        <span>{isPlaying ? (muted ? "Playing (muted)" : "Playing") : ready ? "Stopped" : "Loading..."}</span>
      </div>

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}>
        <div id="yt-player-frame" />
      </div>
    </div>
  );
}
