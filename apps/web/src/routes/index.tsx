import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { BudgetBoard, ExplorePanel } from "@/components/explore-panel";
import { SiteFooter } from "@/components/site-footer";
import gsap from "@/lib/gsap";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const HERO_POSTER =
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2400&q=85";
const HERO_VIDEO =
  "https://videos.pexels.com/video-files/2169880/2169880-hd_1280_720_30fps.mp4";

const WORLD_LEFT =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85";
const WORLD_RIGHT =
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=85";

const SERVICES = [
  {
    id: "weather",
    label: "Destination",
    title: "Search for a destination",
    copy: "Type any city. Live weather ranks museums, markets, and viewpoints for this hour — so you begin with the sky, not a static list.",
    cta: { href: "#explore", label: "Find out more" },
    video: "https://videos.pexels.com/video-files/1409899/1409899-hd_1280_720_25fps.mp4",
    poster:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=85",
    side: "left" as const,
  },
  {
    id: "places-intro",
    label: "Places",
    title: "Places for this hour",
    copy: "Famous places from open maps — queued for today's light and ready for your gallery when the moment feels right.",
    cta: { href: "#places", label: "Find out more" },
    video: "https://videos.pexels.com/video-files/3571264/3571264-hd_1280_720_30fps.mp4",
    poster:
      "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=2200&q=85",
    side: "right" as const,
  },
  {
    id: "budget-intro",
    label: "Budget",
    title: "Estimate your trip",
    copy: "Mid-range spend by crew, days, and how you move — a clear sense of cost before you pack, not a booking desk.",
    cta: { href: "#budget", label: "Find out more" },
    video: "https://videos.pexels.com/video-files/857195/857195-hd_1280_720_25fps.mp4",
    poster:
      "https://images.unsplash.com/photo-1567899378494-48b64f0b6b2a?auto=format&fit=crop&w=2200&q=85",
    side: "left" as const,
  },
  {
    id: "gallery-intro",
    label: "Gallery",
    title: "Open the full gallery",
    copy: "Once a city is live, open the full place gallery — weather reasons, categories, and photos when Wikipedia has them.",
    cta: { href: "#explore", label: "Find out more" },
    video: "https://videos.pexels.com/video-files/3141208/3141208-hd_1280_720_25fps.mp4",
    poster:
      "https://images.unsplash.com/photo-1499793983690-e29eb78112a1?auto=format&fit=crop&w=2200&q=85",
    side: "right" as const,
  },
] as const;

function useInViewVideo(sectionRef: React.RefObject<HTMLElement | null>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.28 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionRef]);

  return videoRef;
}

function useReveal(ref: React.RefObject<HTMLElement | null>, sel = "[data-page-in]") {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll(sel);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        gsap.fromTo(
          els,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" },
        );
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [ref, sel]);
}

const CLOSE_VIDEO =
  "https://videos.pexels.com/video-files/1093662/1093662-hd_1920_1080_30fps.mp4";
const CLOSE_POSTER =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=2400&q=85";

const BRIDGE_VIDEO =
  "https://videos.pexels.com/video-files/855564/855564-hd_1280_720_24fps.mp4";
const BRIDGE_POSTER =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2200&q=85";

function CloseSection({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const videoRef = useInViewVideo(sectionRef);
  useReveal(sectionRef, "[data-close-in]");

  return (
    <section ref={sectionRef} id="close" className="tp-close">
      <div className="tp-close__media" aria-hidden>
        <div
          className="tp-close__poster"
          style={{ backgroundImage: `url(${CLOSE_POSTER})` }}
        />
        <video
          ref={videoRef}
          className="tp-close__video"
          muted
          loop
          playsInline
          preload="metadata"
          poster={CLOSE_POSTER}
        >
          <source src={CLOSE_VIDEO} type="video/mp4" />
        </video>
        <div className="tp-close__veil" />
      </div>

      <div className="tp-close__body">
        <h2 data-close-in className="tp-close__title">
          <span className="tp-close__lead">Ensure your stay is</span>
          <em>unforgettable</em>
        </h2>
        <p data-close-in className="tp-close__copy">
          One search. Weather that matters. A quiet sense of cost before you go.
        </p>
        <div data-close-in className="tp-close__cta">
          <a href="#explore" className="tp-btn tp-btn-light px-10 py-4 text-sm uppercase">
            Search for a destination
          </a>
        </div>
      </div>
    </section>
  );
}

function TripBridge() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useInViewVideo(sectionRef);
  useReveal(sectionRef, "[data-bridge-in]");

  return (
    <section ref={sectionRef} className="tp-bridge" aria-label="From places to budget">
      <div className="tp-bridge__media" aria-hidden>
        <div
          className="tp-bridge__poster"
          style={{ backgroundImage: `url(${BRIDGE_POSTER})` }}
        />
        <video
          ref={videoRef}
          className="tp-bridge__video"
          muted
          loop
          playsInline
          preload="metadata"
          poster={BRIDGE_POSTER}
        >
          <source src={BRIDGE_VIDEO} type="video/mp4" />
        </video>
        <div className="tp-bridge__veil" />
      </div>

      <div className="tp-bridge__body">
        <p data-bridge-in className="tp-section-kicker tp-section-kicker--on-dark">
          Next
        </p>
        <h2 data-bridge-in className="tp-bridge__title">
          Places found.
          <em> Now sense the cost.</em>
        </h2>
        <p data-bridge-in className="tp-bridge__copy">
          You have weather and a shortlist. Before you pack, estimate mid-range spend for
          your crew, days, and how you travel.
        </p>
        <a data-bridge-in href="#budget" className="tp-cta-line tp-cta-line--on-dark">
          Estimate your trip
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}

function ServiceCard({
  id,
  label,
  title,
  copy,
  cta,
  video,
  poster,
  side,
}: (typeof SERVICES)[number]) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useInViewVideo(sectionRef);
  useReveal(sectionRef, "[data-service-in]");

  return (
    <article
      ref={sectionRef}
      id={id}
      className={`tp-service tp-service--${side}`}
    >
      <div className="tp-service__media">
        <div
          className="tp-service__poster"
          style={{ backgroundImage: `url(${poster})` }}
          aria-hidden
        />
        <video
          ref={videoRef}
          className="tp-service__video"
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
        >
          <source src={video} type="video/mp4" />
        </video>
        <div className="tp-service__veil" aria-hidden />
      </div>

      <div className="tp-service__content">
        <p data-service-in className="tp-service__label">
          {label}
        </p>
        <h3 data-service-in className="tp-service__title">
          {title}
        </h3>
        <p data-service-in className="tp-service__copy">
          {copy}
        </p>
        <a data-service-in href={cta.href} className="tp-cta-line">
          {cta.label}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}

function HomeComponent() {
  const [cityQuery, setCityQuery] = useState("Paris");
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const worldRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const servicesRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLElement>(null);

  useReveal(worldRef, "[data-world-in]");
  useReveal(introRef, "[data-intro-in]");
  useReveal(servicesRef, "[data-services-head]");

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        "[data-hero-media]",
        { opacity: 0.35 },
        { opacity: 1, duration: 1.1 },
      )
        .fromTo(
          "[data-hero-veil]",
          { opacity: 0 },
          { opacity: 1, duration: 0.7 },
          "-=0.75",
        )
        .fromTo(
          "[data-hero-in]",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, stagger: 0.05 },
          "-=0.4",
        );
    }, hero);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-svh bg-[var(--tp-ink)] text-[var(--tp-fog)]">
      <div className="tp-grain" aria-hidden />

      {/* Hero */}
      <section ref={heroRef} className="tp-page tp-page--hero" aria-label="TravelPartner">
        <div data-hero-media className="tp-page__media">
          <div className="tp-page__media-inner" aria-hidden />
          <video
            ref={videoRef}
            className="tp-page__video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={HERO_POSTER}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </div>
        <div data-hero-veil className="tp-page__veil" aria-hidden />

        <div className="tp-page__body">
          <p data-hero-in className="tp-page__brand">
            Travel<em>Partner</em>
          </p>
          <h1 data-hero-in className="tp-page__title">
            For the best trip experience…
            <em> plan with weather.</em>
          </h1>
          <p data-hero-in className="tp-page__copy">
            Exceptional city knowledge — live sky, ranked places, and a clear sense of
            cost — so your stay stays unforgettable.
          </p>
          <div data-hero-in className="tp-page__cta">
            <a href="#explore" className="tp-btn tp-btn-light px-8 py-4 text-sm uppercase">
              <span className="hidden sm:inline">Search for a destination</span>
              <span className="sm:hidden">Search destination</span>
            </a>
            <a href="#services" className="tp-cta-line tp-cta-line--on-dark">
              Scroll to discover
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>

        <div data-hero-in className="tp-page__scroll" aria-hidden>
          <span>Scroll</span>
          <span className="tp-scroll-cue__line tp-page__scroll-line" />
        </div>
      </section>

      {/* Split statement */}
      <section ref={worldRef} id="story" className="tp-world">
        <div className="tp-world__grid">
          <div
            data-world-in
            className="tp-world__panel"
            style={{ backgroundImage: `url(${WORLD_LEFT})` }}
            aria-hidden
          />
          <div
            data-world-in
            className="tp-world__panel"
            style={{ backgroundImage: `url(${WORLD_RIGHT})` }}
            aria-hidden
          />
        </div>
        <h2 data-world-in className="tp-world__statement">
          Come for the cities.
          <br />
          Stay for the feeling.
        </h2>
      </section>

      {/* Faith-style intro band */}
      <section ref={introRef} className="tp-faith-intro">
        <div className="tp-faith-intro__inner">
          <p data-intro-in className="tp-section-kicker">
            Dreaming of a trip
          </p>
          <h2 data-intro-in className="tp-faith-intro__title">
            Discover our
            <em> trip studio.</em>
          </h2>
          <p data-intro-in className="tp-faith-intro__copy">
            Your holiday shouldn&apos;t be spent worrying about logistics. We handle the
            maps, the sky, and a quiet estimate — leaving you free to enjoy the places
            that fit today.
          </p>
          <a data-intro-in href="#services" className="tp-cta-line tp-cta-line--dark mt-8">
            Explore our services
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* Continuous video services — Faith Ibiza rhythm */}
      <section ref={servicesRef} id="services" className="tp-services">
        <div className="tp-services__head">
          <p data-services-head className="tp-section-kicker">
            What we do
          </p>
          <h2 data-services-head className="tp-services__title">
            Everything you need,
            <em> in one continuous flow.</em>
          </h2>
        </div>

        <div className="tp-services__stack">
          {SERVICES.map((service) => (
            <ServiceCard key={service.id} {...service} />
          ))}
        </div>
      </section>

      <ExplorePanel cityQuery={cityQuery} onCityQueryChange={setCityQuery} />
      <TripBridge />
      <BudgetBoard city={cityQuery} />

      <CloseSection sectionRef={closeRef} />

      <SiteFooter />
    </div>
  );
}
