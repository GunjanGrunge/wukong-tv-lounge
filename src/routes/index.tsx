import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import wallInk from "@/assets/wall-ink.jpg";
import wallGuardians from "@/assets/wall-guardians.jpg";
import wallEmber from "@/assets/wall-ember.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wukong TV — Ambient Launcher" },
      {
        name: "description",
        content:
          "A Wukong-themed Android TV launcher: an ambient screensaver clock with a ready-to-launch dock for YouTube, Netflix, JioHotstar and FanCode.",
      },
      { property: "og:title", content: "Wukong TV — Ambient Launcher" },
      {
        property: "og:description",
        content:
          "An ambient screensaver clock with a ready-to-launch dock for YouTube, Netflix, JioHotstar and FanCode.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Launcher,
});

const WALLS = [
  { src: wallInk, name: "Ink Storm" },
  { src: wallGuardians, name: "Guardians of the Peak" },
  { src: wallEmber, name: "The Staff Awakens" },
];

const WALL_INTERVAL_MS = 26000;
const IDLE_MS = 20000;

/* ---------- App dock glyphs ---------- */

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M8 5.2v13.6L19.2 12 8 5.2Z" />
    </svg>
  );
}

function NGlyph() {
  return <span className="font-display text-xl leading-none">N</span>;
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 1.5l2.7 7.4 7.8.8-6.1 4.9 2.2 7.9L12 17.6l-6.6 4.9 2.2-7.9L1.5 9.7l7.8-.8L12 1.5Z" />
    </svg>
  );
}

function BoltGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2 4 14h6.2L9 22l10.5-12.5H13L13.5 2Z" />
    </svg>
  );
}

type TvApp = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  badge: string;
  glow: string;
  glyph: ReactNode;
};

const APPS: TvApp[] = [
  {
    id: "youtube",
    name: "YouTube",
    tagline: "Videos · Live · Music",
    url: "https://www.youtube.com",
    badge: "bg-brand-youtube",
    glow: "rgba(255, 0, 51, 0.45)",
    glyph: <PlayGlyph />,
  },
  {
    id: "netflix",
    name: "Netflix",
    tagline: "Films · Series",
    url: "https://www.netflix.com",
    badge: "bg-brand-netflix",
    glow: "rgba(229, 9, 20, 0.5)",
    glyph: <NGlyph />,
  },
  {
    id: "hotstar",
    name: "JioHotstar",
    tagline: "Movies · Sport · IPL",
    url: "https://www.hotstar.com",
    badge: "bg-gradient-to-br from-brand-hotstar-1 to-brand-hotstar-2",
    glow: "rgba(150, 60, 230, 0.5)",
    glyph: <StarGlyph />,
  },
  {
    id: "fancode",
    name: "FanCode",
    tagline: "Live sport · Stats",
    url: "https://www.fancode.com",
    badge: "bg-brand-fancode",
    glow: "rgba(244, 100, 60, 0.5)",
    glyph: <BoltGlyph />,
  },
];

/* ---------- Launcher ---------- */

function Launcher() {
  const [now, setNow] = useState(() => new Date());
  const [wall, setWall] = useState(0);
  const [focus, setFocus] = useState(0);
  const [idle, setIdle] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const focusRef = useRef(0);
  focusRef.current = focus;
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setWall((w) => (w + 1) % WALLS.length),
      WALL_INTERVAL_MS,
    );
    return () => clearInterval(t);
  }, []);

  const launch = useCallback((app: TvApp) => {
    setToast(app.name);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
    window.open(app.url, "_blank", "noopener,noreferrer");
  }, []);

  /* D-pad style keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setFocus((f) => Math.min(APPS.length - 1, f + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setFocus((f) => Math.max(0, f - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const app = APPS[focusRef.current];
        if (app) launch(app);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launch]);

  /* Idle -> screensaver: dock dims, clock glows. Any input wakes it. */
  const poke = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  useEffect(() => {
    poke();
    window.addEventListener("keydown", poke);
    window.addEventListener("mousemove", poke);
    window.addEventListener("mousedown", poke);
    return () => {
      window.removeEventListener("keydown", poke);
      window.removeEventListener("mousemove", poke);
      window.removeEventListener("mousedown", poke);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [poke]);

  const embers = useMemo(
    () =>
      Array.from({ length: 16 }, () => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 14,
        dur: 12 + Math.random() * 12,
      })),
    [],
  );

  const hours = now.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const meridiem = hours < 12 ? "AM" : "PM";
  const dateLine = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="dark relative min-h-screen select-none overflow-hidden bg-ink-deep font-body text-foreground">
      {/* Wallpaper stage */}
      <div className="absolute inset-0">
        {WALLS.map((w, i) => (
          <div
            key={w.name}
            className={cn(
              "absolute inset-0 transition-opacity duration-[3000ms] ease-in-out",
              i === wall ? "opacity-100" : "opacity-0",
            )}
          >
            {i === wall ? (
              <img
                key={`active-${wall}`}
                src={w.src}
                width={1920}
                height={1080}
                alt={w.name}
                className="h-full w-full animate-kenburns object-cover"
              />
            ) : (
              <img
                src={w.src}
                width={1920}
                height={1080}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
        {/* Readability gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-deep via-ink-deep/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-deep via-transparent to-ink-deep/40" />
      </div>

      {/* Drifting embers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {embers.map((e, i) => (
          <span
            key={i}
            className="ember"
            style={{
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              opacity: 0,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Vertical brush watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block"
      >
        <p
          className="font-brush text-7xl leading-[1.2] tracking-widest text-foreground/10"
          style={{ writingMode: "vertical-rl" }}
        >
          齊天大聖
        </p>
      </div>

      {/* Brand */}
      <header
        className={cn(
          "absolute left-12 top-10 flex items-center gap-4 transition-opacity duration-1000",
          idle && "opacity-50",
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ember/50 bg-ink/60">
          <span className="font-brush text-xl text-ember">悟</span>
        </div>
        <div>
          <p className="font-display text-2xl tracking-[0.35em] text-foreground">
            WUKONG
          </p>
          <p className="text-[10px] uppercase tracking-[0.5em] text-smoke">
            TV Launcher
          </p>
        </div>
      </header>

      {/* Ambient clock */}
      <section
        className={cn(
          "absolute left-12 top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out",
          idle ? "scale-105" : "scale-100",
        )}
      >
        <p className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.45em] text-smoke">
          <span className="h-px w-10 bg-ember/60" />
          {idle ? "Screensaver" : "Ready when you are"}
        </p>
        <div
          className="font-display leading-none text-foreground"
          style={{
            fontSize: "clamp(6rem, 14vw, 11rem)",
            filter: idle
              ? "drop-shadow(0 0 30px color-mix(in oklab, var(--ember) 40%, transparent))"
              : undefined,
          }}
        >
          <span>{h12}</span>
          <span className="animate-colon-blink">:</span>
          <span>{minutes}</span>
          <span className="ml-4 align-super text-[0.22em] tracking-[0.3em] text-ember">
            {meridiem}
          </span>
          <span className="ml-2 align-super text-[0.16em] text-smoke/70">
            {seconds}
          </span>
        </div>
        <p className="mt-4 text-lg font-light uppercase tracking-[0.25em] text-smoke">
          {dateLine}
        </p>
      </section>

      {/* Launch dock */}
      <nav
        className={cn(
          "absolute bottom-14 left-0 right-0 px-12 transition-all duration-1000 ease-out",
          idle ? "translate-y-8 opacity-25" : "translate-y-0 opacity-100",
        )}
      >
        <p className="mb-4 text-[11px] uppercase tracking-[0.45em] text-smoke">
          Launch
        </p>
        <div className="flex items-end gap-5">
          {APPS.map((app, i) => {
            const focused = i === focus;
            return (
              <button
                key={app.id}
                type="button"
                onMouseEnter={() => setFocus(i)}
                onClick={() => launch(app)}
                aria-label={`Open ${app.name}`}
                className={cn(
                  "group relative flex h-24 w-60 items-center gap-4 rounded-2xl border px-5 text-left backdrop-blur-sm transition-all duration-300 ease-out",
                  focused
                    ? "-translate-y-2 scale-105 border-ember/70 bg-card/90"
                    : "border-border/50 bg-card/45 opacity-60 hover:opacity-90",
                )}
                style={
                  focused
                    ? {
                        boxShadow: `0 18px 45px -12px ${app.glow}, 0 0 0 1px color-mix(in oklab, var(--ember) 55%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-foreground shadow-inner",
                    app.badge,
                  )}
                >
                  {app.glyph}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium tracking-wide text-foreground">
                    {app.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-smoke">
                    {app.tagline}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center gap-6 text-[11px] uppercase tracking-[0.35em] text-smoke/80">
          <span>
            <kbd className="rounded border border-border/60 bg-card/60 px-1.5 py-0.5 text-foreground">
              ◀ ▶
            </kbd>{" "}
            Browse
          </span>
          <span>
            <kbd className="rounded border border-border/60 bg-card/60 px-1.5 py-0.5 text-foreground">
              OK
            </kbd>{" "}
            Launch
          </span>
          <span className="ml-auto hidden md:inline">
            Idle 20s → screensaver · any key to wake
          </span>
        </div>
      </nav>

      {/* Launch toast */}
      {toast && (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 animate-in fade-in slide-in-from-top-2 rounded-full border border-ember/50 bg-ink/80 px-5 py-2 text-sm tracking-wide text-foreground backdrop-blur">
          Opening {toast}…
        </div>
      )}
    </main>
  );
}
