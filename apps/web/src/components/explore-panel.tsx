import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import gsap from "@/lib/gsap";
import { trpc } from "@/utils/trpc";

type Transport = "flight" | "train" | "bus" | "car" | "local";

const TRANSPORTS: { id: Transport; label: string }[] = [
  { id: "flight", label: "Flight" },
  { id: "train", label: "Train" },
  { id: "bus", label: "Bus" },
  { id: "car", label: "Car" },
  { id: "local", label: "Local" },
];

function formatMoney(symbol: string, amount: number) {
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function useRevealOnView(ref: React.RefObject<HTMLElement | null>, sel: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll(sel);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        gsap.fromTo(
          els,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" },
        );
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [ref, sel]);
}

type ExplorePanelProps = {
  cityQuery: string;
  onCityQueryChange: (city: string) => void;
};

export function ExplorePanel({ cityQuery, onCityQueryChange }: ExplorePanelProps) {
  const exploreRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [city, setCity] = useState(cityQuery);
  const [query, setQuery] = useState(cityQuery);

  const debouncedCity = useDebouncedValue(city, 450);

  const suggestions = useQuery({
    ...trpc.travel.searchCities.queryOptions({ query: debouncedCity }),
    enabled: debouncedCity.trim().length >= 2,
  });

  const explore = useQuery({
    ...trpc.travel.explore.queryOptions({ city: query }),
    enabled: query.length > 0,
  });

  useRevealOnView(exploreRef, "[data-explore-in]");

  useEffect(() => {
    const el = resultRef.current;
    if (!el || !explore.data) return;

    gsap.fromTo(
      el.querySelectorAll("[data-result-in]"),
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: "power2.out" },
    );
  }, [explore.dataUpdatedAt]);

  const commitCity = (name: string) => {
    const next = name.trim();
    setCity(next);
    setQuery(next);
    onCityQueryChange(next);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commitCity(city);
  };

  const found = explore.data?.found === true ? explore.data : null;
  const showSuggestions =
    Boolean(suggestions.data?.length) && city.trim() !== query;

  return (
    <section
      ref={exploreRef}
      id="explore"
      className="tp-panel-page tp-concierge scroll-mt-24"
    >
      <div className="tp-panel-page__shell">
        <div className="tp-dest">
          <div className="tp-dest__intro">
            <p data-explore-in className="tp-section-kicker">
              Destination
            </p>
            <h2 data-explore-in className="tp-panel-page__title">
              Search for a
              <em> destination.</em>
            </h2>
            <p data-explore-in className="tp-panel-page__lead">
              Begin with a city. We surface weather, ranked places, and a path to the full
              gallery — free sources, no keys.
            </p>
          </div>

          <form data-explore-in onSubmit={onSearch} className="tp-dest__form">
            <label htmlFor="city-search" className="tp-dest__label">
              Where are you going?
            </label>
            <div className="tp-dest__row">
              <input
                id="city-search"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris, Tokyo, Lisbon…"
                autoComplete="off"
              />
              <button type="submit" className="tp-btn px-8 py-4 text-sm uppercase">
                Search
              </button>
            </div>

            {showSuggestions && (
              <ul className="tp-dest__suggest">
                {suggestions.data!.map((s, i) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => commitCity(s.name)}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <strong>{s.name}</strong>
                      <em>{s.country}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        <div ref={resultRef} className="tp-concierge__result tp-dest__result">
          {explore.isLoading && (
            <p data-result-in className="text-[var(--tp-muted)]">
              Reading maps & sky…
            </p>
          )}

          {explore.data && !explore.data.found && (
            <p data-result-in className="text-lg">
              {explore.data.message}
            </p>
          )}

          {found && (
            <div className="tp-concierge__city">
              <div data-result-in className="tp-concierge__city-head">
                <div>
                  <p className="tp-concierge__eyebrow">
                    Now showing · {found.city.country}
                  </p>
                  <h3>{found.city.name}</h3>
                  <p className="tp-concierge__weather">
                    <span className="tp-status-dot inline-block h-2 w-2 rounded-full bg-[var(--tp-lagoon)]" />
                    {found.weather.label}
                    {found.weather.precipitationMm > 0
                      ? ` · ${found.weather.precipitationMm}mm`
                      : ""}
                  </p>
                </div>
                <p className="tp-concierge__temp">
                  {Math.round(found.weather.temperatureC)}
                  <span>°</span>
                </p>
              </div>

              {found.placesError && (
                <p data-result-in className="mt-4 text-sm text-[var(--tp-lagoon)]">
                  {found.placesError}
                </p>
              )}

              <div data-result-in id="places" className="tp-concierge__ranks scroll-mt-24">
                <div className="tp-concierge__ranks-head">
                  <p>Places</p>
                  <p>{String(found.places.length).padStart(2, "0")}</p>
                </div>

                {found.recommended.length === 0 ? (
                  <p className="text-[var(--tp-muted)]">
                    No ranked places yet — try another city.
                  </p>
                ) : (
                  <ol>
                    {found.recommended.map((p, i) => (
                      <li key={p.id}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>{p.name}</strong>
                          <em>{p.category}</em>
                          {p.weatherReason ? (
                            <p className="tp-concierge__place-reason">{p.weatherReason}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {found.places.length > 0 && (
                  <Link
                    to="/explore/$city"
                    params={{ city: found.city.name }}
                    className="tp-cta-line tp-cta-line--dark mt-8 inline-flex"
                  >
                    See all places
                    <span aria-hidden>→</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

type BudgetBoardProps = {
  city: string;
};

export function BudgetBoard({ city }: BudgetBoardProps) {
  const budgetRef = useRef<HTMLDivElement>(null);
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(4);
  const [transport, setTransport] = useState<Transport>("flight");
  const [distanceKm, setDistanceKm] = useState(1200);

  const budget = useQuery({
    ...trpc.travel.budget.queryOptions({
      city,
      people,
      days,
      transport,
      distanceKm,
    }),
    enabled: city.length > 0,
    placeholderData: keepPreviousData,
  });

  useRevealOnView(budgetRef, "[data-budget-in]");

  const budgetFound = budget.data?.found === true ? budget.data : null;
  const showInitialLoading = budget.isPending && !budgetFound;

  return (
    <div ref={budgetRef} id="budget" className="tp-reserve scroll-mt-24">
      <div className="tp-reserve__shell">
        <header>
          <p data-budget-in className="tp-section-kicker">
            04 — Budget
          </p>
          <h2 data-budget-in className="tp-reserve__title">
            Estimate your
            <em> trip.</em>
          </h2>
          <p data-budget-in className="tp-reserve__lead">
            Share your crew, days, and distance — a mid-range sense of cost before you go.
          </p>
        </header>

        <div data-budget-in className="tp-reserve__board">
          <div className="tp-reserve__controls">
            <label>
              <span>Guests</span>
              <input
                type="number"
                min={1}
                max={20}
                value={people}
                onChange={(e) => setPeople(Number(e.target.value) || 1)}
              />
            </label>
            <label>
              <span>Days</span>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 1)}
              />
            </label>
            <label>
              <span>Distance km</span>
              <input
                type="number"
                min={0}
                max={20000}
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
              />
            </label>
            <div className="tp-reserve__modes">
              <span>Transport</span>
              <div>
                {TRANSPORTS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-active={transport === t.id}
                    onClick={() => setTransport(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="tp-reserve__total"
            data-fetching={budget.isFetching && !!budgetFound ? "true" : "false"}
          >
            {showInitialLoading && (
              <p className="text-[var(--tp-muted)]">Calculating…</p>
            )}
            {budgetFound && (
              <>
                <p className="tp-reserve__meta">
                  {budgetFound.city.name} · {budgetFound.estimate.people} guests ·{" "}
                  {budgetFound.estimate.days} days
                </p>
                <p className="tp-reserve__amount">
                  {formatMoney(
                    budgetFound.estimate.currencySymbol,
                    budgetFound.estimate.grandTotal,
                  )}
                </p>
                <p className="tp-reserve__per">
                  {formatMoney(
                    budgetFound.estimate.currencySymbol,
                    budgetFound.estimate.perPersonTotal,
                  )}{" "}
                  / guest ·{" "}
                  {formatMoney(
                    budgetFound.estimate.currencySymbol,
                    budgetFound.estimate.dailyPerPerson,
                  )}
                  / day
                </p>

                <div className="tp-reserve__bars">
                  {(
                    [
                      ["Lodging", budgetFound.estimate.lodging],
                      ["Food", budgetFound.estimate.foodAndMisc],
                      ["Transit", budgetFound.estimate.localTransit],
                      [
                        budgetFound.estimate.transport.label,
                        budgetFound.estimate.transport.total,
                      ],
                    ] as const
                  ).map(([label, amount]) => {
                    const max = budgetFound.estimate.grandTotal || 1;
                    const pct = Math.max(6, Math.round((amount / max) * 100));
                    return (
                      <div key={label} className="tp-reserve__bar">
                        <div>
                          <span>{label}</span>
                          <span>
                            {formatMoney(
                              budgetFound.estimate.currencySymbol,
                              amount,
                            )}
                          </span>
                        </div>
                        <div className="tp-reserve__track">
                          <div style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <ul className="tp-reserve__compare">
                  {budgetFound.estimate.allTransportOptions.map((opt) => (
                    <li key={opt.mode} data-active={opt.mode === transport}>
                      <span>{opt.label}</span>
                      <span>
                        {formatMoney(
                          budgetFound.estimate.currencySymbol,
                          opt.total,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="tp-reserve__note">{budgetFound.estimate.note}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
