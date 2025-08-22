import React, { useEffect, useRef } from "react";
import { useGame } from "../state/GameContext.jsx";

export default function MusicPlayer() {
  const { state } = useGame();
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.volume = state.musicVol ?? 0.4;
  }, [state.musicVol]);



    const playMusic = () => {
    audioRef.current.play().catch(err => {
      console.log("Autoplay bloqueado:", err);
    });
  };




  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.loop = true;
    if (state.musicOn) {
      // algunos navegadores requieren interacción previa
      el.play().catch(() => {/* silenciar error de autoplay */});
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [state.musicOn]);

  return (
    <audio ref={ref} src="/music/island_cove.mp3" preload="auto" />

  );
}
