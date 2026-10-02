import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import gsap from "@/lib/gsap";

export type PlacePreview = {
  id: string;
  name: string;
  category: string;
  matchScore: number;
  weatherReason: string;
};

type PlacesPreviewProps = {
  cityName: string;
  weatherLabel: string;
  totalCount: number;
  places: PlacePreview[];
};

function matchLabel(score: number) {
  if (score >= 3) return "Best now";
  if (score >= 2) return "Good fit";
  if (score >= 1) return "Possible";
  return "Later";
}

export function PlacesPreview({
  cityName,
  weatherLabel,
  totalCount,
  places,
}: PlacesPreviewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const preview = useMemo(() => places.slice(0, 6), [places]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!rootRef.current) return;
    const els = rootRef.current.querySelectorAll("[data-preview-anim]");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        gsap.fromTo(
          els,
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: "power2.out" },
        );
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [places]);

  useEffect(() => {
    setActive(0);
  }, [cityName]);

  if (!preview.length) return null;

  const current = preview[active] ?? preview[0];
  const total = preview.length;

  return (
    <section ref={rootRef} id="places" className="tp-rituals scroll-mt-24">
      <div className="tp-rituals__shell">
        <div data-preview-anim className="tp-rituals__intro">
          <p className="tp-section-kicker">
            Places · {String(Math.min(total, totalCount)).padStart(2, "0")} of{" "}
            {String(totalCount).padStart(2, "0")}
          </p>
          <h2 className="tp-rituals__title">
            See what
            <em> awaits in {cityName}.</em>
          </h2>
          <p className="tp-rituals__lead">
            Matched to {weatherLabel} — places ranked for this hour.
          </p>
        </div>

        <div data-preview-anim className="tp-rituals__stage">
          <div className="tp-rituals__counter">
            <span>{String(active + 1).padStart(2, "0")}</span>
            <span>/</span>
            <span>{String(total).padStart(2, "0")}</span>
          </div>

          <article className="tp-rituals__feature">
            <p className="tp-rituals__tag">
              {matchLabel(current.matchScore)} · {current.category}
            </p>
            <h3>{current.name}</h3>
            <p>{current.weatherReason}</p>
            <div className="tp-rituals__meter">
              <div
                style={{
                  width: `${Math.min(100, (current.matchScore / 3) * 100)}%`,
                }}
              />
            </div>
          </article>

          <div className="tp-rituals__nav">
            <button
              type="button"
              aria-label="Previous place"
              disabled={active === 0}
              onClick={() => setActive((v) => Math.max(0, v - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              aria-label="Next place"
              disabled={active >= total - 1}
              onClick={() => setActive((v) => Math.min(total - 1, v + 1))}
            >
              Next
            </button>
          </div>
        </div>

        <div data-preview-anim className="tp-rituals__thumbs" role="tablist">
          {preview.map((place, i) => (
            <button
              key={place.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              data-active={i === active}
              onClick={() => setActive(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>{place.name}</strong>
            </button>
          ))}
        </div>

        <div data-preview-anim className="tp-rituals__foot">
          <p>{totalCount} places total — open the gallery for the full set.</p>
          <Link
            to="/explore/$city"
            params={{ city: cityName }}
            className="tp-cta-line tp-cta-line--dark"
          >
            See all places
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
