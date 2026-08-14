"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { constitution, type BillStatus } from "@/lib/data";
import { ChevronRight } from "@/components/icons";

const STATUS_STYLES: Record<BillStatus, string> = {
  proposed: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  debated: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  passed: "bg-accent/15 text-accent",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  withdrawn: "bg-surface-2 text-muted",
};

type Tab = "appendices" | "anthems" | "bills";

function AppendicesTab() {
  return (
    <div className="flex flex-col gap-4">
      {constitution.appendices.map((ap) => (
        <section key={ap.number} id={`ap${ap.number}`} className="card p-5 scroll-mt-20">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
            {ap.label}
          </span>
          <h2 className="mt-1 text-lg font-medium">{ap.title}</h2>
          <div className="reading mt-3 flex flex-col gap-2 font-serif text-fg/85">
            {ap.clauses.map((c, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {c}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AnthemsTab() {
  return (
    <div className="flex flex-col gap-4">
      {constitution.anthems.map((an, i) => (
        <section key={i} id="anthem" className="card p-5 scroll-mt-20">
          <h2 className="text-lg font-medium">{an.title}</h2>
          <pre className="reading mt-3 whitespace-pre-wrap font-serif leading-relaxed text-fg/85">
            {an.lines.join("\n")}
          </pre>
        </section>
      ))}
    </div>
  );
}

function BillsTab() {
  const bills = constitution.bills;
  if (!bills.length) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-sm text-muted">
          No bills published yet. New and amended student bills will appear here
          as soon as they are added.
        </p>
        <Link href="/articles/22" className="btn-outline">
          Read the amendment process
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {bills.map((b) => (
        <article key={b.id} id={`bill-${b.id}`} className="card p-5 scroll-mt-20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium">{b.title}</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium capitalize ${STATUS_STYLES[b.status]}`}
            >
              {b.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {b.number && <span>Bill {b.number}</span>}
            {b.date && <span>· {b.date}</span>}
            {b.sponsor && <span>· Sponsor: {b.sponsor}</span>}
          </div>
          {b.summary && <p className="mt-2 text-sm text-fg/80">{b.summary}</p>}
          <div className="reading mt-3 flex flex-col gap-2 font-serif text-fg/80">
            {b.body.map((c, i) => (
              <p key={i} className="whitespace-pre-wrap">
                {c}
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function AppendixInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    params.get("tab") === "bills"
      ? "bills"
      : params.get("tab") === "anthems"
      ? "anthems"
      : "appendices",
  );

  // Jump to the right tab if deeplinked via #hash.
  useEffect(() => {
    const h = window.location.hash;
    if (h.startsWith("#ap")) setTab("appendices");
    else if (h.startsWith("#anthem")) setTab("anthems");
    else if (h.startsWith("#bill")) setTab("bills");
  }, []);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "appendices", label: "Appendices", count: constitution.appendices.length },
    { key: "anthems", label: "Anthems", count: constitution.anthems.length },
    { key: "bills", label: "Bills", count: constitution.bills.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Appendices, Anthems &amp; Bills
        </h1>
        <p className="text-sm text-muted">
          Forms, oaths, anthems and proposed/passed student bills.
        </p>
      </header>

      <div className="flex gap-2 rounded-full border bg-surface-2 p-1">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
              tab === key ? "bg-card shadow-soft font-medium" : "text-muted"
            }`}
          >
            {label}
            {typeof count === "number" && count > 0 && (
              <span className="rounded-full bg-surface-2 px-1.5 text-[0.7rem] text-muted">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="animate-fadeIn" key={tab}>
        {tab === "appendices" && <AppendicesTab />}
        {tab === "anthems" && <AnthemsTab />}
        {tab === "bills" && <BillsTab />}
      </div>

      <div className="flex items-center justify-end text-muted">
        <Link href="/" className="text-sm hover:text-fg transition">
          Back home <ChevronRight width={14} height={14} className="inline" />
        </Link>
      </div>
    </div>
  );
}

export default function AppendixPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted">Loading…</div>}>
      <AppendixInner />
    </Suspense>
  );
}