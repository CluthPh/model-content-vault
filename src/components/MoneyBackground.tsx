import { useEffect, useMemo, useState } from "react";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return mobile;
}

function useDocumentVisible() {
  const [visible, setVisible] = useState(
    typeof document === "undefined" ? true : !document.hidden,
  );
  useEffect(() => {
    const on = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return visible;
}

export default function MoneyBackground() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const visible = useDocumentVisible();

  const count = reduced ? 0 : mobile ? 8 : 18;

  const notes = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 10 + Math.random() * 12,
        size: 28 + Math.random() * 28,
        rotate: -30 + Math.random() * 60,
        drift: -40 + Math.random() * 80,
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary) / 0.9) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.9) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 85%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />

      {notes.map((n, i) => (
        <div
          key={i}
          className="absolute -top-24 animate-money-fall"
          style={{
            left: `${n.left}%`,
            animationDelay: `-${n.delay}s`,
            animationDuration: `${n.duration}s`,
            animationPlayState: visible ? "running" : "paused",
            ["--drift" as string]: `${n.drift}px`,
            ["--rot" as string]: `${n.rotate}deg`,
          }}
        >
          <svg
            width={n.size * 2}
            height={n.size}
            viewBox="0 0 80 40"
            className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
          >
            <rect x="1" y="1" width="78" height="38" rx="3" fill="#0f2e17" stroke="#3ea36a" strokeWidth="1" />
            <circle cx="40" cy="20" r="10" fill="none" stroke="#7ed3a4" strokeWidth="1.2" />
            <text x="40" y="24" textAnchor="middle" fontFamily="serif" fontSize="10" fontWeight="700" fill="#c8f1d8">$</text>
            <text x="8" y="12" fontFamily="serif" fontSize="7" fontWeight="700" fill="#7ed3a4">100</text>
            <text x="64" y="34" fontFamily="serif" fontSize="7" fontWeight="700" fill="#7ed3a4">100</text>
          </svg>
        </div>
      ))}
    </div>
  );
}
