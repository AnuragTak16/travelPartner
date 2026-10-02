import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import gsap from "@/lib/gsap";

const NAV_LEFT = [
  { hash: "services", label: "Services" },
  { hash: "explore", label: "Explore" },
  { hash: "budget", label: "Budget" },
] as const;

export default function Header() {
  const ref = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: -8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.08 },
    );

    const onScroll = () => {
      const past = !onHome || window.scrollY > 48;
      ref.current?.classList.toggle("is-solid", past);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onHome]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) =>
    NAV_LEFT.map((item) =>
      onHome ? (
        <a
          key={item.hash}
          href={`#${item.hash}`}
          onClick={onNavigate}
        >
          {item.label}
        </a>
      ) : (
        <Link
          key={item.hash}
          to="/"
          hash={item.hash}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ),
    );

  return (
    <header ref={ref} className={`tp-nav${onHome ? "" : " is-solid"}${menuOpen ? " is-open" : ""}`}>
      <div className="tp-nav__inner">
        <button
          type="button"
          className="tp-nav__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="tp-mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className="tp-nav__left" aria-label="Primary">
          <NavLinks />
        </nav>

        <Link to="/" className="tp-nav__brand" onClick={() => setMenuOpen(false)}>
          Travel<em>Partner</em>
        </Link>

        <div className="tp-nav__right">
          {onHome ? (
            <a href="#explore" className="tp-nav__book" onClick={() => setMenuOpen(false)}>
              Search
            </a>
          ) : (
            <Link to="/" hash="explore" className="tp-nav__book" onClick={() => setMenuOpen(false)}>
              Search
            </Link>
          )}
        </div>
      </div>

      <div
        id="tp-mobile-nav"
        className="tp-nav__drawer"
        hidden={!menuOpen}
      >
        <nav aria-label="Mobile">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          {onHome ? (
            <a href="#explore" className="tp-nav__drawer-cta" onClick={() => setMenuOpen(false)}>
              Search destination
            </a>
          ) : (
            <Link
              to="/"
              hash="explore"
              className="tp-nav__drawer-cta"
              onClick={() => setMenuOpen(false)}
            >
              Search destination
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
