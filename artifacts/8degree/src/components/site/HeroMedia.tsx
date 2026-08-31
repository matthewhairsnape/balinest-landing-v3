import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SITE_MEDIA } from "@/lib/site-assets";
import { cn } from "@/lib/utils";

const heroImgClass =
  "absolute inset-0 z-0 h-full w-full object-cover object-center";

function preferStaticHeroMedia(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return true;
  return false;
}

export function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [preferStatic, setPreferStatic] = useState(() =>
    typeof window !== "undefined" ? preferStaticHeroMedia() : false,
  );

  const markVideoReady = useCallback(() => {
    setVideoReady(true);
  }, []);

  const tryPlay = useCallback(() => {
    const el = videoRef.current;
    if (!el || preferStatic || videoFailed) return;

    if (el.readyState >= 2) markVideoReady();

    void el.play()
      .then(() => markVideoReady())
      .catch(() => {
        // Autoplay blocked — still reveal the loaded frame if data is available.
        if (el.readyState >= 2) markVideoReady();
      });
  }, [preferStatic, videoFailed, markVideoReady]);

  useLayoutEffect(() => {
    setPreferStatic(preferStaticHeroMedia());
  }, []);

  useEffect(() => {
    const onChange = () => setPreferStatic(preferStaticHeroMedia());
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    mqReduce.addEventListener("change", onChange);
    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    conn?.addEventListener?.("change", onChange as EventListener);
    return () => {
      mqReduce.removeEventListener("change", onChange);
      conn?.removeEventListener?.("change", onChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (preferStatic || videoFailed) return;
    tryPlay();
  }, [preferStatic, videoFailed, tryPlay]);

  if (preferStatic || videoFailed) {
    return (
      <img
        src={SITE_MEDIA.heroPoster}
        alt=""
        className={heroImgClass}
        decoding="async"
        fetchPriority="high"
        onError={(e) => {
          e.currentTarget.src = SITE_MEDIA.heroStill;
        }}
      />
    );
  }

  return (
    <>
      <img
        src={SITE_MEDIA.heroPoster}
        alt=""
        aria-hidden
        className={cn(
          heroImgClass,
          "transition-opacity duration-700 ease-out",
          videoReady ? "opacity-0" : "opacity-100",
        )}
        decoding="async"
        fetchPriority="high"
      />
      <video
        ref={videoRef}
        className={cn(
          heroImgClass,
          "transition-opacity duration-700 ease-out",
          videoReady ? "opacity-100" : "opacity-0",
        )}
        src={SITE_MEDIA.heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={SITE_MEDIA.heroPoster}
        onLoadedData={tryPlay}
        onCanPlay={tryPlay}
        onPlaying={markVideoReady}
        onError={() => setVideoFailed(true)}
      />
    </>
  );
}
