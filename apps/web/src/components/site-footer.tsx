import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import gsap from "@/lib/gsap";

const NAV = [
  { href: "#services", label: "Services" },
  { href: "#explore", label: "Explore" },
  { href: "#budget", label: "Budget" },
  { href: "#close", label: "Begin" },
] as const;

export function SiteFooter() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll("[data-footer-anim]");
    if (!els.length) return;

    gsap.set(els, { y: 48, opacity: 0 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        gsap.to(els, {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "transform",
        });
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={ref} className="tp-footer">
      <div className="tp-footer__shell">
        <div data-footer-anim className="tp-footer__top">
          <div className="tp-footer__intro">
            <p className="tp-footer__eyebrow">TravelPartner</p>
            <h2 className="tp-footer__headline">
              Ready when
              <em> you are.</em>
            </h2>
            <a href="#explore" className="tp-btn tp-btn-light px-9 py-3.5 text-sm uppercase">
              Search for a destination
            </a>
          </div>

          <div className="tp-footer__aside">
            <nav className="tp-footer__nav" aria-label="Footer">
              {NAV.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
            <a className="tp-footer__mail" href="mailto:hello@travelpartner.app">
              hello@travelpartner.app
            </a>
          </div>
        </div>

        <div data-footer-anim className="tp-footer__wordmark" aria-hidden>
          Travel<em>Partner</em>
        </div>

        <div data-footer-anim className="tp-footer__base">
          <span>© {new Date().getFullYear()} TravelPartner</span>
          <Link to="/login" className="tp-link">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
