type GsapVars = Record<string, unknown>;

type GsapTween = {
  kill: () => void;
};

type GsapTimeline = {
  fromTo: (
    targets: gsap.TweenTarget,
    from: GsapVars,
    to: GsapVars,
    position?: string | number,
  ) => GsapTimeline;
  to: (targets: gsap.TweenTarget, vars: GsapVars, position?: string | number) => GsapTimeline;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace gsap {
    type TweenTarget = string | Element | Element[] | NodeList | object | null;
  }

  interface Window {
    gsap: {
      fromTo: (
        targets: gsap.TweenTarget,
        from: GsapVars,
        to: GsapVars,
      ) => GsapTween;
      to: (targets: gsap.TweenTarget, vars: GsapVars) => GsapTween;
      timeline: (vars?: GsapVars) => GsapTimeline;
      context: (func: () => void, scope?: Element | object | null) => { revert: () => void };
    };
  }
}

function getGsap() {
  if (typeof window === "undefined" || !window.gsap) {
    throw new Error("GSAP failed to load. Ensure /gsap.min.js is included before the app.");
  }
  return window.gsap;
}

export const gsap = new Proxy({} as Window["gsap"], {
  get(_target, prop, receiver) {
    return Reflect.get(getGsap(), prop, receiver);
  },
});

export default gsap;
