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

// Let Tab key insert a tab character (or 4 spaces) inside textareas instead
// of moving focus. Supports tab+selection (indents the block) and Shift+Tab
// (outdents). Attached to every textarea in the admin editor.
function tabKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
  if (e.key !== "Tab") return;
  e.preventDefault();
  const ta = e.currentTarget;
  const { selectionStart: start, selectionEnd: end, value } = ta;
  const indent = e.shiftKey ? "" : "\t";
  if (start === end) {
    // no selection — insert at cursor
    const next = value.slice(0, start) + indent + value.slice(end);
    ta.value = next;
    ta.selectionStart = ta.selectionEnd = start + indent.length;
  } else {
    // selection — indent/outdent each line in the range
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const lines = block.split("\n");
    const updated = lines
      .map((l) => (e.shiftKey ? l.replace(/^\t/, "") : indent + l))
      .join("\n");
    const next = value.slice(0, lineStart) + updated + value.slice(end);
    ta.value = next;
    ta.selectionStart = lineStart;
    ta.selectionEnd = lineStart + updated.length;
  }
  // trigger React's onChange so the state updates
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

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
      <div className="sm:col-span-2">
        <Label>App credit (shown in Settings → About and the footer)</Label>
        <input
          className="input"
          value={data.meta.appCredit ?? ""}
          placeholder="e.g. Built by the 32nd Assembly under the leadership of …"
          onChange={(e) => set((d) => void (d.meta.appCredit = e.target.value))}
        />
      </div>
    </div>
  );
}

// ── section editor ────────────────────────────────────────────────────────────
// Add up/down arrow icons if not already imported — using Chevron up/down-// like symbols. We’ll reuse ChevronLeft rotated, but cleaner to inline small SVGs.
const ArrowUpIcon = (p: { width?: number; height?: number; className?: string }) => (
  <svg width={p.width ?? 14} height={p.height ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="m6 15 6-6 6 6" />
  </svg>
);
const ArrowDownIcon = (p: { width?: number; height?: number; className?: string }) => (
  <svg width={p.width ?? 14} height={p.height ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function SectionEditor({
  s,
  onChange,
  onRemove,
}: {
  s: Section;
  onChange: (fn: (s: Section) => void) => void;
  onRemove: () => void;
}) {
  // Work on the ordered `content` array; lazily migrate from legacy fields.
  const ensureContent = (): NonNullable<Section["content"]> => {
    if (s.content) return s.content;
    const c: NonNullable<Section["content"]> = [];
    for (const text of s.clauses) c.push({ kind: "clause", text });
    for (const sub of s.subsections)
      c.push({ kind: "subsection", label: sub.label, title: sub.title, clauses: sub.clauses });
    return c;
  };

  const update = (fn: (content: NonNullable<Section["content"]>) => void) =>
    onChange((x) => {
      const content = x.content ?? ensureContentFor(x);
      fn(content);
      x.content = content;
      x.clauses = [];
      x.subsections = [];
    });
  // ensureContentFor: same as ensureContent but operates on the draft `x`
  function ensureContentFor(x: Section): NonNullable<Section["content"]> {
    if (x.content) return x.content;
    const c: NonNullable<Section["content"]> = [];
    for (const text of x.clauses) c.push({ kind: "clause", text });
    for (const sub of x.subsections)
      c.push({ kind: "subsection", label: sub.label, title: sub.title, clauses: sub.clauses });
    return c;
  }

  const content = s.content ?? ensureContent();

  const addClause = (idx: number) =>
    update((c) => c.splice(idx, 0, { kind: "clause", text: "" }));
  const addSubsection = (idx: number) =>
    update((c) =>
      c.splice(idx, 0, { kind: "subsection", label: "", title: "", clauses: [] }));
  const remove = (idx: number) => update((c) => void c.splice(idx, 1));
  const move = (idx: number, dir: -1 | 1) =>
    update((c) => {
      const j = idx + dir;
      if (j < 0 || j >= c.length) return;
      const [item] = c.splice(idx, 1);
      c.splice(j, 0, item);
    });

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
          onKeyDown={tabKeyDown}
          placeholder="Lead text (optional — opens the section before any blocks)"
          onChange={(e) => onChange((x) => void (x.text = e.target.value))}
        />

        <Label>Content blocks (in order — clauses + sub-sections can interleave)</Label>

        {/* Insert rail at the top */}
        <InsertRail onClause={() => addClause(0)} onSub={() => addSubsection(0)} />

        {content.map((b, i) => (
          <div key={i}>
            {b.kind === "clause" ? (
              <div className="rounded-lg border bg-surface p-2.5">
                <div className="mb-1.5 flex items-center gap-1">
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[0.65rem] font-bold text-accent">CLAUSE</span>
                  <div className="ml-auto flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      className="btn-ghost !px-1.5 !py-1 text-muted"
                      aria-label="Move up"
                    ><ArrowUpIcon /></button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      className="btn-ghost !px-1.5 !py-1 text-muted"
                      aria-label="Move down"
                    ><ArrowDownIcon /></button>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="btn-ghost !px-1.5 !py-1 text-muted hover:text-rose-500"
                      aria-label="Remove"
                    ><CloseIcon width={14} height={14} /></button>
                  </div>
                </div>
                <textarea
                  className="input min-h-[44px]"
                  value={b.text}
                  onKeyDown={tabKeyDown}
                  placeholder="Clause text"
                  onChange={(e) =>
                    update((c) => void (c[i] = { kind: "clause", text: e.target.value }))
                  }
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-surface p-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[0.65rem] font-bold text-accent">SUB-SECTION</span>
                  <input
                    className="input !w-12 !py-1.5 text-center"
                    value={b.label}
                    placeholder="-"
                    onChange={(e) =>
                      update((c) => void (c[i] = { ...b, label: e.target.value }))
                    }
                  />
                  <input
                    className="input flex-1 !py-1.5"
                    value={b.title}
                    placeholder="Sub-section title (e.g. The President)"
                    onChange={(e) =>
                      update((c) => void (c[i] = { ...b, title: e.target.value }))
                    }
                  />
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      className="btn-ghost !px-1.5 !py-1 text-muted"
                      aria-label="Move up"
                    ><ArrowUpIcon /></button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      className="btn-ghost !px-1.5 !py-1 text-muted"
                      aria-label="Move down"
                    ><ArrowDownIcon /></button>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="btn-ghost !px-1.5 !py-1 text-muted hover:text-rose-500"
                      aria-label="Remove sub-section"
                    ><CloseIcon width={14} height={14} /></button>
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {b.clauses.map((c, j) => (
                    <ItemRow
                      key={j}
                      label="clause"
                      onRemove={() =>
                        update((arr) => void ((arr[i] as typeof b).clauses.splice(j, 1)))
                      }
                    >
                      <textarea
                        className="input min-h-[40px]"
                        value={c}
                        onKeyDown={tabKeyDown}
                        onChange={(e) =>
                          update((arr) =>
                            void ((arr[i] as typeof b).clauses.splice(j, 1, e.target.value)))
                        }
                      />
                    </ItemRow>
                  ))}
                  <button
                    type="button"
                    className="btn-outline !py-1 self-start"
                    onClick={() =>
                      update((arr) => void ((arr[i] as typeof b).clauses.push("")))
                    }
                  >
                    <PlusIcon width={12} height={12} /> Clause
                  </button>
                </div>
              </div>
            )}
            {/* Insert rail after each block */}
            <InsertRail onClause={() => addClause(i + 1)} onSub={() => addSubsection(i + 1)} />
          </div>
        ))}

        {content.length === 0 && (
          <p className="text-xs text-muted py-2">No blocks yet — add a clause or sub-section above.</p>
        )}
      </div>
    </div>
  );
}

/** A slim strip with two small buttons to insert a clause or a sub-section
 *  at a specific position in the ordered content list. */
function InsertRail({
  onClause,
  onSub,
}: {
  onClause: () => void;
  onSub: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="h-px flex-1 bg-border" />
      <button type="button" onClick={onClause} className="btn-ghost !px-2 !py-1 !text-xs text-muted">
        <PlusIcon width={12} height={12} /> Clause
      </button>
      <button type="button" onClick={onSub} className="btn-ghost !px-2 !py-1 !text-xs text-muted">
        <PlusIcon width={12} height={12} /> Sub-section
      </button>
      <span className="h-px flex-1 bg-border" />
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
            onKeyDown={tabKeyDown}
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
                content: [],
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
            onKeyDown={tabKeyDown}
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
        onKeyDown={tabKeyDown}
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
        onKeyDown={tabKeyDown}
        placeholder="One-line summary"
        onChange={(e) => onChange((x) => void (x.summary = e.target.value))}
      />
      <Label>Body (each line is a paragraph)</Label>
      <textarea
        className="input min-h-[120px] font-serif"
        value={b.body.join("\n")}
        onKeyDown={tabKeyDown}
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

      {/* sticky publish bar — stays visible while scrolling so you can
          save without scrolling back to the top */}
      <div className="sticky top-[3.25rem] z-30 -mx-4 rounded-none border-b bg-bg/85 px-4 py-2.5 backdrop-blur-xl md:-mx-6 md:rounded-2xl md:border md:px-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            {status === "idle" && (
              <span className="truncate text-muted">Unsaved changes</span>
            )}
            {status === "saving" && (
              <span className="flex items-center gap-1.5 text-muted">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Publishing…
              </span>
            )}
            {status === "done" && (
              <span className="flex items-center gap-1.5 text-accent">
                <CheckIcon width={15} height={15} /> <span className="truncate">{msg || "Saved"}</span>
              </span>
            )}
            {status === "error" && (
              <span className="truncate text-rose-500">{msg}</span>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={copyJSON}
              className="btn-outline !px-3 !py-1.5"
              title="Copy JSON to clipboard"
            >
              Copy
            </button>
            <button
              onClick={publish}
              disabled={status === "saving"}
              className="btn-primary !px-3.5 !py-1.5"
            >
              {status === "saving" ? "Publishing…" : "Publish"}
            </button>
          </div>
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