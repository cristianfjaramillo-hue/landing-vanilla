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
    <div className="relative mx-auto max-w-xl sm:max-w-2xl bg-forest-950 group">
      {/* Contenedor del video con desvanecimiento perimetral hacia el verde de la landing */}
      <div className="relative overflow-hidden rounded-2xl bg-forest-950 [mask-image:radial-gradient(ellipse_at_center,black_72%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_72%,transparent_100%)]">
        <video
          ref={videoRef}
          src="/assets/video-hero.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto max-h-[380px] sm:max-h-[460px] object-contain mx-auto bg-forest-950"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Gradientes perimetrales sutiles para fundir los bordes con el verde forest-950 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950 via-transparent to-forest-950 opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-forest-950 via-transparent to-forest-950 opacity-60" />
      </div>

      {/* Controles flotantes sutiles en armonía con el verde forestal (sin bordes cafés) */}
      <div className="absolute bottom-2 right-2 flex items-center space-x-2 bg-forest-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-forest-800 shadow-md opacity-80 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={togglePlay}
          className="p-1 text-forest-200 hover:text-white transition-colors"
          title={isPlaying ? "Pausar video" : "Reproducir video"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <span className="text-forest-700 text-xs">|</span>
        <button
          type="button"
          onClick={toggleSound}
          className="p-1 text-forest-200 hover:text-white transition-colors flex items-center space-x-1.5"
          title={isMuted ? "Activar audio" : "Silenciar audio"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-vanilla-300" />
              <span className="text-[10px] text-forest-200 font-medium hidden sm:inline">Activar Sonido</span>
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
