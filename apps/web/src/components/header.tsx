import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";

import gsap from "@/lib/gsap";

const NAV_LEFT = [
  { href: "#services", label: "Services" },
  { href: "#explore", label: "Explore" },
  { href: "#budget", label: "Budget" },
] as const;

export default function Header() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: -12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power2.out", delay: 0.15 },
    );

    const onScroll = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.85;
      ref.current?.classList.toggle("is-champagne", pastHero);
      ref.current?.classList.toggle("is-solid", pastHero);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={ref} className="tp-nav">
      <div className="tp-nav__inner">
        <nav className="tp-nav__left" aria-label="Primary">
          {NAV_LEFT.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <Link to="/" className="tp-nav__brand">
          Travel<em>Partner</em>
        </Link>

        <div className="tp-nav__right">
          <a href="#explore" className="tp-nav__book">
            Search destination
          </a>
          <Link to="/login" className="tp-nav__sign hidden sm:inline">
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
