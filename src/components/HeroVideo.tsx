"use client";

import React, { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy prevented playback until user interaction
      });
    }
  }, []);

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="relative mx-auto max-w-xl sm:max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-vanilla-500/40 bg-black/80 drop-shadow-2xl group">
      <video
        ref={videoRef}
        src="/assets/video-hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-auto max-h-[380px] sm:max-h-[460px] object-contain mx-auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controles flotantes de reproducción y audio */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-vanilla-500/40 shadow-lg opacity-90 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={togglePlay}
          className="p-1 text-vanilla-300 hover:text-white transition-colors"
          title={isPlaying ? "Pausar video" : "Reproducir video"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <span className="text-white/30 text-xs">|</span>
        <button
          type="button"
          onClick={toggleSound}
          className="p-1 text-vanilla-300 hover:text-white transition-colors flex items-center space-x-1.5"
          title={isMuted ? "Activar audio" : "Silenciar audio"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-vanilla-400" />
              <span className="text-[10px] text-vanilla-300 font-medium hidden sm:inline">Activar Sonido</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-300 font-medium hidden sm:inline">Audio Activo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
