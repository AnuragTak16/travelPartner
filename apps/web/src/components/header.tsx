import { useEffect, useRef } from "react";
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

  return (
    <header ref={ref} className={`tp-nav${onHome ? "" : " is-solid"}`}>
      <div className="tp-nav__inner">
        <nav className="tp-nav__left" aria-label="Primary">
          {NAV_LEFT.map((item) =>
            onHome ? (
              <a key={item.hash} href={`#${item.hash}`}>
                {item.label}
              </a>
            ) : (
              <Link key={item.hash} to="/" hash={item.hash}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <Link to="/" className="tp-nav__brand">
          Travel<em>Partner</em>
        </Link>

        <div className="tp-nav__right">
          {onHome ? (
            <a href="#explore" className="tp-nav__book">
              Search
            </a>
          ) : (
            <Link to="/" hash="explore" className="tp-nav__book">
              Search
            </Link>
          )}
          {/* <Link to="/login" className="tp-nav__sign">
            Sign in
          </Link> */}
        </div>
      </div>
    </header>
  );
}
