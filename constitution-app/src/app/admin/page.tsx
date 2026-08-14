"use client";

import { useEffect, useState } from "react";
import constitutionSeed from "../../../data/constitution.json";
import type {
  Constitution,
  Article,
  Section,
  Bill,
  BillStatus,
  Appendix,
  Anthem,
} from "@/lib/data";
import { ScaleIcon, CheckIcon, CloseIcon, PlusIcon, EditIcon } from "@/components/icons";

const PW_KEY = "cc:adminpw";
const STATUS: BillStatus[] = ["proposed", "debated", "passed", "rejected", "withdrawn"];

function newId() {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ||
    "bill-" + Math.random().toString(36).slice(2, 10);
}

// ── small generic helpers ────────────────────────────────────────────────────
function ItemRow({
  children,
  onRemove,
  label,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  label?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">{children}</div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost !px-2 !py-2 text-muted hover:text-rose-500"
          aria-label={label ? `Remove ${label}` : "Remove"}
        >
          <CloseIcon width={16} height={16} />
        </button>
      )}
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
    {children}
  </label>
);

// ── password gate ─────────────────────────────────────────────────────────────
function Gate({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password: pw }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        sessionStorage.setItem(PW_KEY, pw);
        onUnlock(pw);
      } else {
        setErr(j.error || "Wrong password.");
      }
    } catch {
      setErr("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center">
      <div className="card p-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-fg">
          <ScaleIcon width={22} height={22} />
        </span>
        <h1 className="mt-4 text-lg font-semibold">Admin access</h1>
        <p className="mt-1 text-sm text-muted">
          Enter the admin password to edit the constitution and bills. Students
          never see this page and never need a login.
        </p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="input"
            placeholder="Admin password"
            autoFocus
            autoComplete="off"
          />
          {err && <p className="text-sm text-rose-500">{err}</p>}
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── metadata editor ──────────────────────────────────────────────────────────
function MetaEditor({
  data,
  set,
}: {
  data: Constitution;
  set: (fn: (d: Constitution) => void) => void;
}) {
  return (
    <div className="card grid gap-3 p-5 sm:grid-cols-2">
      <div>
        <Label>Title</Label>
        <input
          className="input"
          value={data.meta.title}
          onChange={(e) => set((d) => void (d.meta.title = e.target.value))}
        />
      </div>
      <div>
        <Label>Full title</Label>
        <input
          className="input"
          value={data.meta.fullTitle}
          onChange={(e) => set((d) => void (d.meta.fullTitle = e.target.value))}
        />
      </div>
      <div>
        <Label>Subtitle</Label>
        <input
          className="input"
          value={data.meta.subtitle}
          onChange={(e) => set((d) => void (d.meta.subtitle = e.target.value))}
        />
      </div>
      <div>
        <Label>Version</Label>
        <input
          className="input"
          value={data.meta.version}
          onChange={(e) => set((d) => void (d.meta.version = e.target.value))}
        />
      </div>
    </div>
  );
}

// ── section editor ────────────────────────────────────────────────────────────
function SectionEditor({
  s,
  onChange,
  onRemove,
}: {
  s: Section;
  onChange: (fn: (s: Section) => void) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border bg-surface-2/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
          Section S.{s.number}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost !px-2 !py-1.5 text-muted hover:text-rose-500"
          aria-label="Remove section"
        >
          <CloseIcon width={14} height={14} />
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <input
          className="input"
          value={s.title}
          placeholder="Section title"
          onChange={(e) => onChange((x) => void (x.title = e.target.value))}
        />
        <textarea
          className="input min-h-[64px]"
          value={s.text}
          placeholder="Lead text (optional)"
          onChange={(e) => onChange((x) => void (x.text = e.target.value))}
        />
        <Label>Clauses (one per line is fine; add/remove below)</Label>
        {s.clauses.map((c, i) => (
          <ItemRow
            key={i}
            label="clause"
            onRemove={() => onChange((x) => void x.clauses.splice(i, 1))}
          >
            <textarea
              className="input min-h-[44px]"
              value={c}
              onChange={(e) =>
                onChange((x) => void x.clauses.splice(i, 1, e.target.value))
              }
            />
          </ItemRow>
        ))}
        <button
          type="button"
          className="btn-outline self-start !py-1.5"
          onClick={() => onChange((x) => void x.clauses.push(""))}
        >
          <PlusIcon width={14} height={14} /> Clause
        </button>

        <Label>Sub-sections (lettered sub-parts such as A. The President)</Label>
        {s.subsections.map((sub, i) => (
          <div
            key={i}
            className="rounded-lg border border-dashed bg-surface p-3"
          >
            <div className="flex items-center gap-2">
              <input
                className="input !w-12 !py-1.5 text-center"
                value={sub.label}
                placeholder="-"
                onChange={(e) =>
                  onChange((x) => void (x.subsections[i].label = e.target.value))
                }
              />
              <input
                className="input flex-1 !py-1.5"
                value={sub.title}
                placeholder="Sub-section title (e.g. The President)"
                onChange={(e) =>
                  onChange((x) => void (x.subsections[i].title = e.target.value))
                }
              />
              <button
                type="button"
                onClick={() => onChange((x) => void x.subsections.splice(i, 1))}
                className="btn-ghost !px-2 !py-1.5 text-muted hover:text-rose-500"
                aria-label="Remove sub-section"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>
            <div className="mt-2">
              {sub.clauses.map((c, j) => (
                <ItemRow
                  key={j}
                  label="clause"
                  onRemove={() =>
                    onChange((x) => void x.subsections[i].clauses.splice(j, 1))
                  }
                >
                  <textarea
                    className="input min-h-[40px]"
                    value={c}
                    onChange={(e) =>
                      onChange((x) =>
                        void x.subsections[i].clauses.splice(j, 1, e.target.value))
                    }
                  />
                </ItemRow>
              ))}
              <button
                type="button"
                className="btn-outline !py-1"
                onClick={() => onChange((x) => void x.subsections[i].clauses.push(""))}
              >
                <PlusIcon width={12} height={12} /> Clause
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn-outline self-start !py-1.5"
          onClick={() =>
            onChange((x) =>
              x.subsections.push({ label: "", title: "", clauses: [] }),
            )
          }
        >
          <PlusIcon width={14} height={14} /> Sub-section
        </button>
      </div>
    </div>
  );
}

// ── article editor ────────────────────────────────────────────────────────────
function ArticleEditor({
  a,
  onChange,
  onRemove,
}: {
  a: Article;
  onChange: (fn: (a: Article) => void) => void;
  onRemove: () => void;
}) {
  const maxSec = Math.max(0, ...a.sections.map((x) => x.number));
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft font-semibold text-accent">
          {a.number}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost !px-2 !py-1.5 text-muted hover:text-rose-500"
          aria-label="Remove article"
        >
          <CloseIcon width={14} height={14} />
        </button>
      </div>
      <input
        className="input mt-3"
        value={a.title}
        onChange={(e) => onChange((x) => void (x.title = e.target.value))}
        placeholder="Article title"
      />
      <Label>Intro lines</Label>
      {a.intro.map((c, i) => (
        <ItemRow
          key={i}
          label="intro"
          onRemove={() => onChange((x) => void x.intro.splice(i, 1))}
        >
          <textarea
            className="input min-h-[44px]"
            value={c}
            onChange={(e) => onChange((x) => void x.intro.splice(i, 1, e.target.value))}
          />
        </ItemRow>
      ))}
      <button
        type="button"
        className="btn-outline !py-1.5"
        onClick={() => onChange((x) => void x.intro.push(""))}
      >
        <PlusIcon width={14} height={14} /> Intro line
      </button>

      <div className="mt-4 flex flex-col gap-2.5">
        {a.sections.map((s, i) => (
          <SectionEditor
            key={i}
            s={s}
            onChange={(fn) => onChange((x) => fn(x.sections[i]))}
            onRemove={() =>
              onChange((x) => {
                if (confirm(`Remove S.${s.number}?`)) x.sections.splice(i, 1);
              })
            }
          />
        ))}
        <button
          type="button"
          className="btn-primary self-start !py-1.5"
          onClick={() =>
            onChange((x) =>
              x.sections.push({
                number: maxSec + 1,
                title: "",
                text: "",
                subsections: [],
                clauses: [],
              }),
            )
          }
        >
          <PlusIcon width={14} height={14} /> Add section
        </button>
      </div>
    </div>
  );
}

// ── appendix & anthem editors ──────────────────────────────────────────────────
function AppendixEditor({
  ap,
  onChange,
}: {
  ap: Appendix;
  onChange: (fn: (ap: Appendix) => void) => void;
}) {
  return (
    <div className="card p-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="input"
          value={ap.label}
          onChange={(e) => onChange((x) => void (x.label = e.target.value))}
        />
        <input
          className="input"
          value={ap.title}
          onChange={(e) => onChange((x) => void (x.title = e.target.value))}
        />
      </div>
      <Label>Clauses</Label>
      {ap.clauses.map((c, i) => (
        <ItemRow
          key={i}
          label="clause"
          onRemove={() => onChange((x) => void x.clauses.splice(i, 1))}
        >
          <textarea
            className="input min-h-[44px]"
            value={c}
            onChange={(e) => onChange((x) => void x.clauses.splice(i, 1, e.target.value))}
          />
        </ItemRow>
      ))}
      <button
        type="button"
        className="btn-outline !py-1.5"
        onClick={() => onChange((x) => void x.clauses.push(""))}
      >
        <PlusIcon width={14} height={14} /> Clause
      </button>
    </div>
  );
}

function AnthemEditor({
  an,
  onChange,
}: {
  an: Anthem;
  onChange: (fn: (an: Anthem) => void) => void;
}) {
  return (
    <div className="card p-5">
      <input
        className="input"
        value={an.title}
        onChange={(e) => onChange((x) => void (x.title = e.target.value))}
      />
      <textarea
        className="input mt-2 min-h-[120px] font-serif"
        value={an.lines.join("\n")}
        onChange={(e) =>
          onChange((x) => void (x.lines = e.target.value.split("\n")))
        }
      />
    </div>
  );
}

// ── bills editor ──────────────────────────────────────────────────────────────
function BillEditor({
  b,
  onChange,
  onRemove,
}: {
  b: Bill;
  onChange: (fn: (b: Bill) => void) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
          Bill
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost !px-2 !py-1.5 text-muted hover:text-rose-500"
          aria-label="Remove bill"
        >
          <CloseIcon width={14} height={14} />
        </button>
      </div>
      <input
        className="input mt-3"
        value={b.title}
        placeholder="Bill title"
        onChange={(e) => onChange((x) => void (x.title = e.target.value))}
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <input
          className="input"
          value={b.number ?? ""}
          placeholder="Number"
          onChange={(e) => onChange((x) => void (x.number = e.target.value))}
        />
        <input
          className="input"
          value={b.date ?? ""}
          placeholder="Date"
          onChange={(e) => onChange((x) => void (x.date = e.target.value))}
        />
        <input
          className="input"
          value={b.sponsor ?? ""}
          placeholder="Sponsor"
          onChange={(e) => onChange((x) => void (x.sponsor = e.target.value))}
        />
      </div>
      <div className="mt-2">
        <Label>Status</Label>
        <select
          className="input"
          value={b.status}
          onChange={(e) =>
            onChange((x) => void (x.status = e.target.value as BillStatus))
          }
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <textarea
        className="input mt-2"
        value={b.summary ?? ""}
        placeholder="One-line summary"
        onChange={(e) => onChange((x) => void (x.summary = e.target.value))}
      />
      <Label>Body (each line is a paragraph)</Label>
      <textarea
        className="input min-h-[120px] font-serif"
        value={b.body.join("\n")}
        onChange={(e) =>
          onChange((x) => void (x.body = e.target.value.split("\n")))
        }
      />
    </div>
  );
}

// ── main editor ───────────────────────────────────────────────────────────────
type Tab = "overview" | "articles" | "appendix" | "bills";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "articles", label: "Articles" },
  { key: "appendix", label: "Appendix & Anthems" },
  { key: "bills", label: "Bills" },
];

function Editor({
  initial,
  password,
}: {
  initial: Constitution;
  password: string;
}) {
  const [data, setData] = useState<Constitution>(initial);
  const [tab, setTab] = useState<Tab>("overview");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const set = (fn: (d: Constitution) => void) =>
    setData((cur) => {
      const next = structuredClone(cur) as Constitution;
      fn(next);
      return next;
    });

  async function publish() {
    setStatus("saving");
    setMsg("");
    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", password, content: data }),
      });
      const j = await res.json();
      if (res.ok && j.ok) {
        setStatus("done");
        setMsg(j.note || "Saved.");
      } else {
        setStatus("error");
        setMsg(j.error || "Save failed.");
      }
    } catch {
      setStatus("error");
      setMsg("Couldn't reach the server.");
    }
  }

  function copyJSON() {
    navigator.clipboard
      ?.writeText(JSON.stringify(data, null, 2))
      .then(() => {
        setStatus("done");
        setMsg("JSON copied — you can also commit it manually.");
      })
      .catch(() => setMsg("Copy failed."));
  }

  function logout() {
    sessionStorage.removeItem(PW_KEY);
    location.reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <EditIcon width={18} height={18} /> Editor
          </h1>
          <p className="text-xs text-muted">
            Edits publish to <code className="text-fg">data/constitution.json</code> and
            trigger a fresh deploy. Students then see the update — no relaunch needed.
          </p>
        </div>
        <button onClick={logout} className="btn-ghost">
          Lock
        </button>
      </header>

      {/* publish bar */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          {status === "idle" && (
            <p className="text-sm text-muted">
              Review your changes, then publish.
            </p>
          )}
          {status === "saving" && (
            <p className="text-sm text-muted">Saving to GitHub…</p>
          )}
          {status === "done" && (
            <p className="flex items-center gap-2 text-sm text-accent">
              <CheckIcon width={16} height={16} /> {msg}
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-rose-500">{msg}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={copyJSON} className="btn-outline">
            Copy JSON
          </button>
          <button
            onClick={publish}
            disabled={status === "saving"}
            className="btn-primary"
          >
            {status === "saving" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`chip shrink-0 ${tab === key ? "chip-active" : "chip-idle"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fadeIn" key={tab}>
        {tab === "overview" && <MetaEditor data={data} set={set} />}
        {tab === "articles" && (
          <div className="flex flex-col gap-4">
            {data.articles.map((a, i) => (
              <ArticleEditor
                key={a.number}
                a={a}
                onChange={(fn) =>
                  set((d) => void fn(d.articles[i]))
                }
                onRemove={() =>
                  set((d) => {
                    if (confirm(`Remove Article ${a.number} (${a.title})?`))
                      d.articles.splice(i, 1);
                  })
                }
              />
            ))}
            <button
              className="btn-primary self-start"
              onClick={() =>
                set((d) =>
                  d.articles.push({
                    number:
                      Math.max(0, ...d.articles.map((x) => x.number)) + 1,
                    word: "",
                    title: "",
                    intro: [],
                    sections: [],
                  }),
                )
              }
            >
              <PlusIcon width={16} height={16} /> Add article
            </button>
          </div>
        )}

        {tab === "appendix" && (
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
                Appendices
              </h2>
              {data.appendices.map((ap, i) => (
                <AppendixEditor
                  key={ap.number}
                  ap={ap}
                  onChange={(fn) => set((d) => void fn(d.appendices[i]))}
                />
              ))}
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
                Anthems
              </h2>
              {data.anthems.map((an, i) => (
                <AnthemEditor
                  key={i}
                  an={an}
                  onChange={(fn) => set((d) => void fn(d.anthems[i]))}
                />
              ))}
            </section>
          </div>
        )}

        {tab === "bills" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Add new or existing bills here. They appear in the student-facing
              <a href="/appendix?tab=bills" className="text-accent"> Appendix → Bills</a> tab.
            </p>
            {data.bills.map((b, i) => (
              <BillEditor
                key={b.id}
                b={b}
                onChange={(fn) => set((d) => void fn(d.bills[i]))}
                onRemove={() =>
                  set((d) => {
                    if (confirm(`Remove bill “${b.title}”?`)) d.bills.splice(i, 1);
                  })
                }
              />
            ))}
            <button
              className="btn-primary self-start"
              onClick={() =>
                set((d) =>
                  d.bills.push({
                    id: newId(),
                    title: "",
                    status: "proposed",
                    body: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }),
                )
              }
            >
              <PlusIcon width={16} height={16} /> Add bill
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── page shell ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [pw, setPw] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(PW_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", password: stored }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setPw(stored);
        else sessionStorage.removeItem(PW_KEY);
      })
      .catch(() => sessionStorage.removeItem(PW_KEY))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <p className="py-10 text-center text-sm text-muted">Loading…</p>;
  }
  if (!pw) return <Gate onUnlock={setPw} />;
  return <Editor initial={constitutionSeed as Constitution} password={pw} />;
}