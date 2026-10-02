import { useEffect, useRef } from "react";

import gsap from "@/lib/gsap";

const PHRASES = [
  "Weather-first travel",
  "La dolce vita",
  "Open skies",
  "Famous places",
  "Crew budgets",
  "Live maps",
  "Quiet planning",
  "City by city",
];

export function CityMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const tween = gsap.to(el, {
      xPercent: -50,
      duration: 38,
      ease: "none",
      repeat: -1,
    });

    return () => {
      tween.kill();
    };
  }, []);

  const items = [...PHRASES, ...PHRASES];

  return (
    <div className="tp-ticker overflow-hidden border-y border-[var(--tp-line)] py-5 md:py-6">
      <div ref={trackRef} className="tp-marquee">
        {items.map((phrase, i) => (
          <span key={`${phrase}-${i}`} className="tp-ticker__item">
            <span className={i % 2 === 0 ? "text-[var(--tp-fog)]" : "text-[var(--tp-coral)]"}>
              {phrase}
            </span>
            <span className="tp-ticker__star" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
