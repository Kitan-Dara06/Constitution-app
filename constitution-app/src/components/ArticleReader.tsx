"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Article, Section } from "@/lib/data";
import { SaveBar } from "@/components/SaveBar";
import { RecentTracker } from "@/components/RecentTracker";
import { kArticle, kSection } from "@/lib/content-key";
import {
  ChevronLeft,
  ChevronRight,
  BookmarkIcon,
  ListIcon,
} from "@/components/icons";

interface Props {
  article: Article;
  related: Article[];
  prev?: Article;
  next?: Article;
}

export function ArticleReader({ article: a, related, prev, next }: Props) {
  const hasSections = a.sections.length > 1;
  const [active, setActive] = useState(hasSections ? -1 : 0); // -1 = overview/all
  const [justHash, setJustHash] = useState(false);

  // Honour an incoming #sN deeplink: jump straight to that section.
  useEffect(() => {
    const h = window.location.hash;
    const m = h && h.match(/^#s(\d+)$/);
    if (m) {
      const sn = Number(m[1]);
      const idx = a.sections.findIndex((s) => s.number === sn);
      if (idx >= 0) {
        setActive(idx);
        setJustHash(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll selected section into view (esp. on deeplink / "next section").
  useEffect(() => {
    if (!justHash) return;
    const el = document.getElementById("active-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setJustHash(false);
  }, [justHash, active]);

  const current: Section | null =
    active >= 0 && active < a.sections.length ? a.sections[active] : null;

  return (
    <div className="flex flex-col gap-6">
      <RecentTracker bookKey={kArticle(a.number)} />

      <div className="flex items-center justify-between">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition"
        >
          <ChevronLeft width={16} height={16} /> All articles
        </Link>
        <SaveBar bookKey={kArticle(a.number)} />
      </div>

      <header className="flex flex-col gap-1.5 border-b pb-5">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
          Article {a.number}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{a.title}</h1>
        {a.sections.length > 0 && (
          <p className="text-xs text-muted">
            {a.sections.length} section{a.sections.length === 1 ? "" : "s"}
            {a.intro.length > 0 ? " · with intro" : ""}
          </p>
        )}
      </header>

      {/* Intro (always visible) */}
      {a.intro.length > 0 && (
        <p className="reading font-serif text-base leading-relaxed text-muted">
          {a.intro.join(" ")}
        </p>
      )}

      {hasSections ? (
        <>
          {/* Section chooser — distinct from the Articles list design:
              compact vertical tiles, left accent rail, small mono "S.N",
              no chevron, count of sub-parts. */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
              Sections
            </h2>
            <button
              onClick={() => setActive(-1)}
              className={`text-xs transition ${
                active === -1 ? "text-accent font-medium" : "text-muted hover:text-fg"
              }`}
            >
              Show all
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {a.sections.map((s, i) => {
              const selected = active === i;
              const subCount = s.subsections.length;
              const clauseCount = s.clauses.length;
              const total =
                clauseCount +
                subCount +
                s.subsections.reduce((t, x) => t + x.clauses.length, 0);
              return (
                <li key={s.number}>
                  <button
                    onClick={() => setActive(i)}
                    aria-pressed={selected}
                    className={`group relative flex h-full w-full flex-col gap-1 overflow-hidden rounded-2xl border p-3.5 text-left transition ${
                      selected
                        ? "border-accent bg-accent-soft/60"
                        : "bg-card hover:bg-surface-2 hover:border-accent/40"
                    }`}
                  >
                    {/* left rail */}
                    <span
                      className={`absolute inset-y-0 left-0 w-1 transition ${
                        selected ? "bg-accent" : "bg-transparent group-hover:bg-accent/30"
                      }`}
                    />
                    <span
                      className={`pl-1.5 font-mono text-[0.7rem] font-semibold tracking-wider ${
                        selected ? "text-accent" : "text-muted"
                      }`}
                    >
                      S.{s.number}
                    </span>
                    <span
                      className={`pl-1.5 text-sm leading-snug ${
                        selected ? "font-medium text-fg" : "text-fg/90"
                      }`}
                    >
                      {s.title || "—"}
                    </span>
                    <span className="pl-1.5 mt-auto text-[0.7rem] text-muted">
                      {total > 0
                        ? `${total} clause${total === 1 ? "" : "s"}`
                        : "lead text"}
                      {subCount > 0 ? ` · ${subCount} part${subCount === 1 ? "" : "s"}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Reading pane */}
          {current ? (
            <section
              id="active-section"
              className="card scroll-mt-20 p-5 animate-fadeIn"
              key={current.number}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-accent-soft px-2 py-1 font-mono text-[0.72rem] font-semibold text-accent">
                    S.{current.number}
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {current.title || "Section"}
                  </h2>
                </div>
                <SaveBar bookKey={kSection(current.number)} />
              </div>

              <div className="reading font-serif text-fg/90 mt-4 flex flex-col gap-4">
                {current.text && <p>{current.text}</p>}

                {current.subsections.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {current.subsections.map((sub, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-dashed border-border bg-surface/60 p-3.5"
                      >
                        <h3 className="font-sans text-base font-semibold tracking-tight text-fg/95">
                          {sub.label ? (
                            <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-md bg-accent-soft text-[0.7rem] font-bold text-accent align-middle">
                              {sub.label}
                            </span>
                          ) : null}
                          {sub.title}
                        </h3>
                        {sub.clauses.length > 0 && (
                          <ol className="mt-2 flex flex-col gap-2">
                            {sub.clauses.map((c, j) => (
                              <li key={j} className="flex gap-2.5">
                                <span className="mt-1.5 grid h-1.5 w-1.5 shrink-0 place-items-center rounded-full bg-accent/50" />
                                <span>{c}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {current.clauses.length > 0 && (
                  <ol className="flex flex-col gap-2.5">
                    {current.clauses.map((c, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-1.5 grid h-1.5 w-1.5 shrink-0 place-items-center rounded-full bg-accent/50" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* prev / next section */}
              <div className="mt-5 flex items-stretch justify-between gap-2 border-t pt-4">
                <SectionStepper
                  label="Previous"
                  disabled={active === 0}
                  onClick={() => setActive((x) => Math.max(0, x - 1))}
                  onLabel={() => {
                    const s = a.sections[active - 1];
                    return s ? `S.${s.number} · ${s.title}` : "";
                  }}
                  align="left"
                />
                <SectionStepper
                  label="Next"
                  disabled={active >= a.sections.length - 1}
                  onClick={() =>
                    setActive((x) => Math.min(a.sections.length - 1, x + 1))
                  }
                  onLabel={() => {
                    const s = a.sections[active + 1];
                    return s ? `S.${s.number} · ${s.title}` : "";
                  }}
                  align="right"
                />
              </div>
            </section>
          ) : (
            // "Show all" — stacked list, still selectable via the tiles above
            <div className="flex flex-col gap-3">
              {a.sections.map((s) => (
                <section
                  key={s.number}
                  id={`s${s.number}`}
                  className="scroll-mt-20 rounded-2xl border bg-card p-4"
                >
                  <button
                    onClick={() => setActive(a.sections.indexOf(s))}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    <span className="rounded-lg bg-accent-soft px-2 py-0.5 font-mono text-[0.72rem] font-semibold text-accent">
                      S.{s.number}
                    </span>
                    <span className="flex-1 font-medium">{s.title || "Section"}</span>
                    <span className="text-[0.7rem] text-muted">Open →</span>
                  </button>
                </section>
              ))}
            </div>
          )}
        </>
      ) : a.sections.length === 1 ? (
        // Single-section article: just show it inline (no chooser needed)
        <section className="card scroll-mt-20 p-5">
          <div className="flex items-center gap-2 border-b pb-3">
            <span className="rounded-lg bg-accent-soft px-2 py-1 font-mono text-[0.72rem] font-semibold text-accent">
              S.{a.sections[0].number}
            </span>
            <h2 className="text-base font-semibold tracking-tight">
              {a.sections[0].title || "Section"}
            </h2>
          </div>
          <div className="reading font-serif text-fg/90 mt-4 flex flex-col gap-4">
            {a.sections[0].text && <p>{a.sections[0].text}</p>}
            {a.sections[0].clauses.map((c, i) => (
              <p key={i}>{c}</p>
            ))}
          </div>
        </section>
      ) : null}

      {/* Related */}
      {related.length > 0 && (
        <section className="flex flex-col gap-3 border-t pt-5">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
            Related articles
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.number}
                href={`/articles/${r.number}`}
                className="group flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition hover:bg-surface-2"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold text-accent">
                  {r.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.title}
                  </span>
                </span>
                <ChevronRight
                  width={16}
                  height={16}
                  className="text-muted group-hover:translate-x-0.5 transition"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Article prev / next */}
      {(prev || next) && (
        <nav className="flex items-stretch justify-between gap-3 border-t pt-5">
          {prev ? (
            <Link
              href={`/articles/${prev.number}`}
              className="group flex flex-1 flex-col gap-0.5 rounded-xl border bg-card px-4 py-3 transition hover:bg-surface-2"
            >
              <span className="text-[0.7rem] uppercase tracking-wider text-muted">
                Previous article
              </span>
              <span className="flex items-center gap-1 text-sm font-medium">
                <ChevronLeft width={14} height={14} /> Art {prev.number} · {prev.title}
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/articles/${next.number}`}
              className="group flex flex-1 flex-col items-end gap-0.5 rounded-xl border bg-card px-4 py-3 text-right transition hover:bg-surface-2"
            >
              <span className="text-[0.7rem] uppercase tracking-wider text-muted">
                Next article
              </span>
              <span className="flex items-center gap-1 text-sm font-medium">
                Art {next.number} · {next.title} <ChevronRight width={14} height={14} />
              </span>
            </Link>
          ) : (
            <span className="flex-1" />
          )}
        </nav>
      )}
    </div>
  );
}

function SectionStepper({
  label,
  disabled,
  onClick,
  onLabel,
  align,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  onLabel: () => string;
  align: "left" | "right";
}) {
  const text = onLabel();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition disabled:opacity-40 enabled:hover:bg-surface-2 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="text-[0.65rem] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="flex items-center gap-1 text-[0.82rem] font-medium line-clamp-1">
        {align === "left" && <ChevronLeft width={12} height={12} />}
        {text}
        {align === "right" && <ChevronRight width={12} height={12} />}
      </span>
    </button>
  );
}