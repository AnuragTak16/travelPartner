import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { BudgetBoard, ExplorePanel } from "@/components/explore-panel";
import { SiteFooter } from "@/components/site-footer";
import gsap, { ScrollTrigger } from "@/lib/gsap";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const HERO_POSTER =
  "https://images.pexels.com/videos/2169880/free-video-2169880.jpg?auto=compress&cs=tinysrgb&w=2400";
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

/** Only one page video should play at a time. */
let activePageVideo: HTMLVideoElement | null = null;

function playExclusive(video: HTMLVideoElement) {
  if (activePageVideo && activePageVideo !== video && !activePageVideo.paused) {
    activePageVideo.pause();
  }
  activePageVideo = video;
  void video.play().catch(() => undefined);
}

function pauseIfActive(video: HTMLVideoElement) {
  video.pause();
  if (activePageVideo === video) activePageVideo = null;
}

function useInViewVideo(sectionRef: React.RefObject<HTMLElement | null>) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          if (video.dataset.loaded !== "1") {
            video.dataset.loaded = "1";
            video.preload = "metadata";
            video.load();
          }
          playExclusive(video);
        } else {
          pauseIfActive(video);
        }
      },
      {
        threshold: [0, 0.45, 0.6],
        rootMargin: "-15% 0px -15% 0px",
      },
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      pauseIfActive(video);
    };
  }, [sectionRef]);

  return videoRef;
}

/** Soft whole-block fade — never line-by-line text hops. */
function useBlockFade(ref: React.RefObject<HTMLElement | null>, sel: string) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const el = root.querySelector(sel);
    if (!el) return;

    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.05,
        ease: "power2.out",
        scrollTrigger: {
          trigger: root,
          start: "top 78%",
          once: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [ref, sel]);
}

/** Faith service rhythm: clip-open the video plane, then quiet content fade. */
function useFaithMediaReveal(sectionRef: React.RefObject<HTMLElement | null>, side: "left" | "right") {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const media = section.querySelector(".tp-service__media");
    const layers = section.querySelectorAll(".tp-service__poster, .tp-service__video");
    const content = section.querySelector(".tp-service__content");
    if (!media) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        media,
        { clipPath: "inset(14% 10% 14% 10%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.25,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
        },
      );

      if (layers.length) {
        gsap.fromTo(
          layers,
          { scale: 1.16 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (content) {
        gsap.fromTo(
          content,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.9,
            ease: "power2.out",
            delay: 0.2,
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              once: true,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, [sectionRef, side]);
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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const layers = section.querySelectorAll(".tp-close__poster, .tp-close__video");
    const body = section.querySelector(".tp-close__body");

    const ctx = gsap.context(() => {
      if (layers.length) {
        gsap.fromTo(
          layers,
          { scale: 1.2 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (body) {
        gsap.fromTo(
          body,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
              once: true,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, [sectionRef]);

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
          preload="none"
          poster={CLOSE_POSTER}
        >
          <source src={CLOSE_VIDEO} type="video/mp4" />
        </video>
        <div className="tp-close__veil" />
      </div>

      <div className="tp-close__body">
        <h2 className="tp-close__title">
          <span className="tp-close__lead">Ensure your stay is</span>
          <em>unforgettable</em>
        </h2>
        <p className="tp-close__copy">
          One search. Weather that matters. A quiet sense of cost before you go.
        </p>
        <div className="tp-close__cta">
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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const layers = section.querySelectorAll(".tp-bridge__poster, .tp-bridge__video");
    const body = section.querySelector(".tp-bridge__body");

    const ctx = gsap.context(() => {
      if (layers.length) {
        gsap.fromTo(
          layers,
          { scale: 1.18 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (body) {
        gsap.fromTo(
          body,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.95,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 70%",
              once: true,
            },
          },
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

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
          preload="none"
          poster={BRIDGE_POSTER}
        >
          <source src={BRIDGE_VIDEO} type="video/mp4" />
        </video>
        <div className="tp-bridge__veil" />
      </div>

      <div className="tp-bridge__body">
        <p className="tp-section-kicker tp-section-kicker--on-dark">Next</p>
        <h2 className="tp-bridge__title">
          Places found.
          <em> Now sense the cost.</em>
        </h2>
        <p className="tp-bridge__copy">
          You have weather and a shortlist. Before you pack, estimate mid-range spend for
          your crew, days, and how you travel.
        </p>
        <a href="#budget" className="tp-cta-line tp-cta-line--on-dark">
          Estimate your trip
          <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}

function TripMarquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 28,
      ease: "none",
      repeat: -1,
    });

    return () => {
      tween.kill();
    };
  }, []);

  const words = ["WEATHER", "PLACES", "BUDGET", "TRIPS", "CITIES", "SKY"];
  const loop = [...words, ...words];

  return (
    <section ref={sectionRef} className="tp-scrub-marquee" aria-label="Plan with TravelPartner">
      <p className="tp-scrub-marquee__script">Plan with</p>
      <div className="tp-scrub-marquee__viewport" aria-hidden>
        <div ref={trackRef} className="tp-scrub-marquee__track">
          {loop.map((word, i) => (
            <span key={`${word}-${i}`} className="tp-scrub-marquee__item">
              {word}
              <span className="tp-scrub-marquee__plus">+</span>
            </span>
          ))}
        </div>
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
  useFaithMediaReveal(sectionRef, side);

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
          preload="none"
          poster={poster}
        >
          <source src={video} type="video/mp4" />
        </video>
        <div className="tp-service__veil" aria-hidden />
      </div>

      <div className="tp-service__content">
        <p className="tp-service__label">{label}</p>
        <h3 className="tp-service__title">{title}</h3>
        <p className="tp-service__copy">{copy}</p>
        <a href={cta.href} className="tp-cta-line">
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

  useBlockFade(introRef, ".tp-faith-intro__inner");
  useBlockFade(servicesRef, ".tp-services__head");

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    const markReady = () => {
      video.classList.add("is-ready");
    };

    if (video.readyState >= 2) markReady();
    video.addEventListener("loadeddata", markReady);
    video.addEventListener("canplay", markReady);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          playExclusive(video);
        } else {
          pauseIfActive(video);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(hero);
    return () => {
      observer.disconnect();
      video.removeEventListener("loadeddata", markReady);
      video.removeEventListener("canplay", markReady);
    };
  }, []);

  // Faith hero: ken-burns scrub on the video plane + quiet whole-body fade (no text hops).
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const layers = hero.querySelectorAll(".tp-page__media-inner, .tp-page__video");
    const body = hero.querySelector(".tp-page__body");

    const ctx = gsap.context(() => {
      if (layers.length) {
        gsap.fromTo(
          layers,
          { scale: 1.22 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (body) {
        gsap.fromTo(
          body,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.15,
            ease: "power2.out",
            delay: 0.45,
          },
        );
      }
    }, hero);

    return () => ctx.revert();
  }, []);

  // Faith split panels: clip-open the two image planes; statement fades as one block.
  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;

    const panels = world.querySelectorAll(".tp-world__panel");
    const media = world.querySelectorAll(".tp-world__panel-media");
    const statement = world.querySelector(".tp-world__statement");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        panels,
        { clipPath: "inset(20% 10% 20% 10%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: {
            trigger: world,
            start: "top 72%",
            once: true,
          },
        },
      );

      if (media.length) {
        gsap.fromTo(
          media,
          { scale: 1.16 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: world,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      if (statement) {
        gsap.fromTo(
          statement,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: world,
              start: "top 58%",
              once: true,
            },
          },
        );
      }
    }, world);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="relative min-h-svh bg-[var(--tp-ink)] text-[var(--tp-fog)]">
      <div className="tp-grain" aria-hidden />

      {/* Hero */}
      <section ref={heroRef} className="tp-page tp-page--hero" aria-label="TravelPartner">
        <div className="tp-page__media">
          <div
            className="tp-page__media-inner"
            style={{ backgroundImage: `url(${HERO_POSTER})` }}
            aria-hidden
          />
          <video
            ref={videoRef}
            className="tp-page__video"
            muted
            loop
            playsInline
            preload="auto"
            poster={HERO_POSTER}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </div>
        <div className="tp-page__veil" aria-hidden />

        <div className="tp-page__body">
          <p className="tp-page__brand">
            Travel<em>Partner</em>
          </p>
          <h1 className="tp-page__title">
            For the best trip experience…
            <em> plan with weather.</em>
          </h1>
          <p className="tp-page__copy">
            Exceptional city knowledge — live sky, ranked places, and a clear sense of
            cost — so your stay stays unforgettable.
          </p>
          <div className="tp-page__cta">
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

        <div className="tp-page__scroll" aria-hidden>
          <span>Scroll</span>
          <span className="tp-scroll-cue__line tp-page__scroll-line" />
        </div>
      </section>

      {/* Split statement */}
      <section ref={worldRef} id="story" className="tp-world">
        <div className="tp-world__grid">
          <div className="tp-world__panel" aria-hidden>
            <div
              className="tp-world__panel-media"
              style={{ backgroundImage: `url(${WORLD_LEFT})` }}
            />
          </div>
          <div className="tp-world__panel" aria-hidden>
            <div
              className="tp-world__panel-media"
              style={{ backgroundImage: `url(${WORLD_RIGHT})` }}
            />
          </div>
        </div>
        <h2 className="tp-world__statement">
          Come for the cities.
          <br />
          Stay for the feeling.
        </h2>
      </section>

      {/* Faith-style intro band */}
      <section ref={introRef} className="tp-faith-intro">
        <div className="tp-faith-intro__inner">
          <p className="tp-section-kicker">Dreaming of a trip</p>
          <h2 className="tp-faith-intro__title">
            Discover our
            <em> trip studio.</em>
          </h2>
          <p className="tp-faith-intro__copy">
            Your holiday shouldn&apos;t be spent worrying about logistics. We handle the
            maps, the sky, and a quiet estimate — leaving you free to enjoy the places
            that fit today.
          </p>
          <a href="#services" className="tp-cta-line tp-cta-line--dark mt-8">
            Explore our services
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* Continuous video services — Faith Ibiza rhythm */}
      <section ref={servicesRef} id="services" className="tp-services">
        <div className="tp-services__head">
          <p className="tp-section-kicker">What we do</p>
          <h2 className="tp-services__title">
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

      <TripMarquee />

      <CloseSection sectionRef={closeRef} />

      <SiteFooter />
    </div>
  );
}
