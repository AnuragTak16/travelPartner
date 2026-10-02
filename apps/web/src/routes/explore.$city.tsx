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
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: "power2.out" },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [filtered, explore.isFetching]);

  return (
    <main ref={rootRef} className="min-h-svh bg-[var(--tp-ink)] pt-24 text-[var(--tp-fog)]">
      <div className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        <Link
          to="/"
          hash="explore"
          className="text-xs uppercase tracking-[0.2em] text-[var(--tp-muted)] transition-colors hover:text-[var(--tp-fog)]"
        >
          ← Back to search
        </Link>

        <header className="mt-8 mb-12 md:mb-16">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--tp-sand)]">
            Places gallery
          </p>
          <h1 className="font-display text-5xl font-extrabold tracking-[-0.03em] md:text-7xl">
            {found?.city.name ?? cityName}
          </h1>
          {found && (
            <p className="mt-4 max-w-xl text-[var(--tp-muted)]">
              {found.city.country} · {found.weather.label} · {Math.round(found.weather.temperatureC)}
              °C · {found.places.length} places with photos from Wikipedia when available
            </p>
          )}
        </header>

        {explore.isLoading && (
          <p className="text-[var(--tp-muted)]">Loading maps, weather, and images…</p>
        )}

        {explore.data && !explore.data.found && (
          <p className="text-[var(--tp-fog)]">{explore.data.message}</p>
        )}

        {found && (
          <>
            <div className="mb-10 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  data-active={filter === cat}
                  className="tp-chip shrink-0 rounded-none px-4 py-2 text-xs uppercase tracking-[0.16em]"
                  onClick={() => setFilter(cat)}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            <div className="tp-place-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((place, i) => {
                const open = activeId === place.id;
                return (
                  <article
                    key={place.id}
                    data-card-anim
                    className="tp-place-tile group flex cursor-pointer flex-col overflow-hidden border border-[var(--tp-line)] bg-[var(--tp-ink-soft)]"
                    onClick={() => setActiveId(open ? null : place.id)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[var(--tp-ink-mid)]">
                      {place.imageUrl ? (
                        <img
                          src={place.imageUrl}
                          alt={place.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-end bg-[radial-gradient(ellipse_at_30%_20%,rgba(226,61,18,0.18),transparent_55%),linear-gradient(160deg,#d5e3ea,#e8f1f4)] p-5">
                          <span className="font-display text-5xl font-bold text-[var(--tp-fog)]/15">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(12,36,48,0.75)] to-transparent p-4 pt-16">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#f4f0e8]">
                          {matchLabel(place.matchScore)} · {place.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="font-display text-xl font-semibold leading-snug md:text-2xl">
                        {place.name}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--tp-muted)]">
                        {place.weatherReason}
                      </p>

                      <div
                        className={`grid transition-[grid-template-rows] duration-500 ${
                          open ? "mt-4 grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-sm leading-relaxed text-[var(--tp-fog)]/85">
                            {place.description}
                          </p>
                          <p className="mt-3 text-xs text-[var(--tp-muted)]">{place.tip}</p>
                          <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--tp-muted)]">
                            {place.avgHours}h · {"$".repeat(place.priceLevel)}
                          </p>
                        </div>
                      </div>

                      <p className="mt-auto pt-4 text-[10px] uppercase tracking-[0.18em] text-[var(--tp-muted)]">
                        {open ? "Close" : "Details"} →
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-[var(--tp-muted)]">
              OSM Overpass · Open-Meteo · Wikipedia images
            </p>
          </>
        )}
      </div>
    </main>
  );
}
