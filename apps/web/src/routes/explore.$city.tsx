import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import gsap from "@/lib/gsap";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/explore/$city")({
  component: ExploreCityPage,
});

function matchLabel(score: number) {
  if (score >= 3) return "Best now";
  if (score >= 2) return "Good fit";
  if (score >= 1) return "Possible";
  return "Later";
}

function ExploreCityPage() {
  const { city: cityParam } = Route.useParams();
  const cityName = decodeURIComponent(cityParam);
  const rootRef = useRef<HTMLElement>(null);
  const [filter, setFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);

  const explore = useQuery({
    ...trpc.travel.explore.queryOptions({ city: cityName, withImages: true }),
  });

  const found = explore.data?.found === true ? explore.data : null;

  const categories = useMemo(() => {
    if (!found) return ["all"];
    return ["all", ...Array.from(new Set(found.places.map((p) => p.category))).sort()];
  }, [found]);

  const filtered = useMemo(() => {
    if (!found) return [];
    if (filter === "all") return found.places;
    return found.places.filter((p) => p.category === filter);
  }, [found, filter]);

  useEffect(() => {
    if (!rootRef.current || !filtered.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-card-anim]",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: "power2.out" },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [filtered, explore.isFetching]);

  return (
    <main ref={rootRef} className="tp-gallery">
      <div className="tp-gallery__shell">
        <Link to="/" hash="explore" className="tp-gallery__back">
          <span className="tp-gallery__back-icon" aria-hidden />
          Back to search
        </Link>

        <header className="tp-gallery__head">
          <p className="tp-section-kicker">Places</p>
          <h1 className="tp-gallery__title">{found?.city.name ?? cityName}</h1>
          {found && (
            <p className="tp-gallery__lead">
              {found.city.country} · {found.weather.label} ·{" "}
              {Math.round(found.weather.temperatureC)}°C · {found.places.length} places
            </p>
          )}
        </header>

        {explore.isLoading && <p className="tp-gallery__status">Loading maps and weather…</p>}

        {explore.data && !explore.data.found && (
          <p className="tp-gallery__status">{explore.data.message}</p>
        )}

        {found && (
          <>
            <div className="tp-gallery__filters" role="tablist" aria-label="Categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={filter === cat}
                  data-active={filter === cat}
                  className="tp-gallery__filter"
                  onClick={() => setFilter(cat)}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            <div className="tp-gallery__grid">
              {filtered.map((place) => {
                const open = activeId === place.id;
                return (
                  <article
                    key={place.id}
                    data-card-anim
                    className="tp-gallery-card"
                    data-open={open}
                    onClick={() => setActiveId(open ? null : place.id)}
                  >
                    <div className="tp-gallery-card__media">
                      {place.imageUrl ? (
                        <img src={place.imageUrl} alt={place.name} loading="lazy" />
                      ) : (
                        <div className="tp-gallery-card__empty" aria-label="Image not available">
                          <span>Image not available</span>
                        </div>
                      )}
                      <div className="tp-gallery-card__badge">
                        {matchLabel(place.matchScore)} · {place.category}
                      </div>
                    </div>

                    <div className="tp-gallery-card__body">
                      <h2>{place.name}</h2>
                      <p className="tp-gallery-card__reason">{place.weatherReason}</p>

                      <div
                        className={`tp-gallery-card__details ${open ? "is-open" : ""}`}
                      >
                        <div>
                          <p>{place.description}</p>
                          <p className="tp-gallery-card__tip">{place.tip}</p>
                          <p className="tp-gallery-card__meta">
                            {place.avgHours}h · {"$".repeat(place.priceLevel)}
                          </p>
                        </div>
                      </div>

                      <p className="tp-gallery-card__toggle">{open ? "Close" : "Details"} →</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
