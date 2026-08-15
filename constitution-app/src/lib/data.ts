import constitutionData from "../../data/constitution.json";

// ── Types ──────────────────────────────────────────────────────────────────
export interface Meta {
  title: string;
  fullTitle: string;
  subtitle: string;
  version: string;
  /** Credit for the app itself (distinct from the document's own drafting
   *  history). Shown in Settings → About and the footer. */
  appCredit?: string;
}

export interface Subsection {
  label: string;
  title: string;
  clauses: string[];
}

/** A block in a section's ordered content stream. Either a flat clause
 * (rendered as a single bullet/paragraph) or a labelled sub-part with its
 * own clauses. Order in the array = order on the page. */
export type ContentBlock =
  | { kind: "clause"; text: string }
  | { kind: "subsection"; label: string; title: string; clauses: string[] };

export interface Section {
  number: number;
  title: string;
  text: string;
  /** Ordered list of clauses and subsections. Renders in array order, so
   * clauses and subsections can interleave freely (e.g. clauses first, then
   * a B subsection, then more clauses). Falls back to the legacy
   * `clauses` + `subsections` arrays when `content` is absent. */
  content?: ContentBlock[];
  /** @deprecated use `content` — kept for backwards compatibility with
   * pre-migration data. Rendered after `content` if both are present. */
  subsections: Subsection[];
  clauses: string[];
}

export interface Article {
  number: number;
  word: string;
  title: string;
  intro: string[];
  sections: Section[];
}

export interface Appendix {
  number: number;
  label: string;
  title: string;
  clauses: string[];
}

export interface Anthem {
  title: string;
  lines: string[];
}

export type BillStatus = "proposed" | "debated" | "passed" | "rejected" | "withdrawn";

export interface Bill {
  id: string;
  title: string;
  number?: string;
  date?: string;
  sponsor?: string;
  status: BillStatus;
  summary?: string;
  body: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Constitution {
  meta: Meta;
  preamble: { title: string; clauses: string[] };
  articles: Article[];
  appendices: Appendix[];
  anthems: Anthem[];
  signatures: string[];
  bills: Bill[];
}

// ── Access ──────────────────────────────────────────────────────────────────
export const constitution = constitutionData as Constitution;

export const getArticle = (n: number): Article | undefined =>
  constitution.articles.find((a) => a.number === n);

export const articleCount = constitution.articles.length;
export const sectionCount = constitution.articles.reduce(
  (t, a) => t + a.sections.length,
  0,
);

/** Flatten a section's content (new `content` array + legacy `clauses` /
 * `subsections`) into one ordered list of text strings. Used by search and
 * the related-articles keyword extractor so they see every block regardless
 * of which field it lives in. */
export function sectionText(s: Section): string[] {
  const out: string[] = [];
  if (s.content) {
    for (const b of s.content) {
      if (b.kind === "clause") out.push(b.text);
      else out.push(b.title, ...b.clauses);
    }
  }
  // legacy
  out.push(...s.clauses);
  for (const sub of s.subsections) out.push(sub.title, ...sub.clauses);
  return out;
}

/** Flat, de-duplicated keyword set for an article (used for "related"). */
export function articleKeywords(a: Article): Set<string> {
  const text = [
    a.title,
    ...a.intro,
    ...a.sections.map((s) => `${s.title} ${s.text}`),
    ...a.sections.flatMap((s) => sectionText(s)),
  ]
    .join(" ")
    .toLowerCase();
  return new Set(
    text
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

const STOP = new Set(
  "the,and,shall,shallbe,this,that,with,from,for,into,upon,there,their,have,been,each,such,other,which,what,when,where,they,them,these,those,shallbe,shallnot,may,any,his,her,its,not,are,wis,was,were,has,had,all,also,more,most,than,then,only,very,can,will,shall,such,been,being,same,both,either".split(
    ",",
  ),
);

/** Articles whose titles share the most keywords with the target. */
export function relatedArticles(n: number, limit = 4): Article[] {
  const target = getArticle(n);
  if (!target) return [];
  const kw = articleKeywords(target);
  if (kw.size === 0) return [];
  return constitution.articles
    .filter((a) => a.number !== n)
    .map((a) => {
      const ak = articleKeywords(a);
      let shared = 0;
      for (const w of ak) if (kw.has(w)) shared++;
      return { a, shared };
    })
    .filter((x) => x.shared >= 2)
    .sort((x, y) => y.shared - x.shared)
    .slice(0, limit)
    .map((x) => x.a);
}

export interface SearchHit {
  kind: "article" | "section" | "appendix" | "anthem" | "bill" | "preamble";
  articleNumber?: number;
  sectionNumber?: number;
  title: string;
  snippet: string;
  href: string;
}

export interface SearchFilters {
  article?: boolean;
  section?: boolean;
  appendix?: boolean;
  anthem?: boolean;
  bill?: boolean;
}

export function search(query: string, filters?: SearchFilters): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const f = filters ?? {};
  const want = (k: keyof SearchFilters) =>
    f[k] !== false; // default all true unless explicitly false
  const hits: SearchHit[] = [];

  const match = (text: string) => text.toLowerCase().includes(q);

  if (want("article")) {
    for (const a of constitution.articles) {
      if (match(a.title)) {
        hits.push({
          kind: "article",
          articleNumber: a.number,
          title: `Article ${a.number} — ${a.title}`,
          snippet: a.intro.join(" ").slice(0, 140) || a.sections[0]?.title || "",
          href: `/articles/${a.number}`,
        });
      }
    }
  }

  if (want("section")) {
    for (const a of constitution.articles) {
      for (const s of a.sections) {
        const hay = `${s.title} ${s.text} ${sectionText(s).join(" ")}`;
        if (match(hay)) {
          hits.push({
            kind: "section",
            articleNumber: a.number,
            sectionNumber: s.number,
            title: `S.${s.number} ${s.title} — Article ${a.number}`,
            snippet: (s.text || sectionText(s).join(" ") || "").slice(0, 140),
            href: `/articles/${a.number}#s${s.number}`,
          });
          break; // one hit per section is enough
        }
      }
    }
  }

  if (want("appendix")) {
    for (const ap of constitution.appendices) {
      const hay = `${ap.title} ${ap.clauses.join(" ")}`;
      if (match(hay)) {
        hits.push({
          kind: "appendix",
          title: `${ap.label} — ${ap.title}`,
          snippet: ap.clauses.join(" ").slice(0, 140),
          href: `/appendix#ap${ap.number}`,
        });
      }
    }
  }

  // Preamble is always included (not part of the filter chips).
  if (match(constitution.preamble.clauses.join(" "))) {
    hits.unshift({
      kind: "preamble",
      title: "Preamble",
      snippet: constitution.preamble.clauses.join(" ").slice(0, 140),
      href: "/preamble",
    });
  }

  if (want("anthem")) {
    for (const an of constitution.anthems) {
      if (match(`${an.title} ${an.lines.join(" ")}`)) {
        hits.push({
          kind: "anthem",
          title: an.title,
          snippet: an.lines.join(" ").slice(0, 140),
          href: `/appendix#anthem`,
        });
      }
    }
  }

  if (want("bill")) {
    for (const b of constitution.bills) {
      const hay = `${b.title} ${b.summary ?? ""} ${b.body.join(" ")}`;
      if (match(hay)) {
        hits.push({
          kind: "bill",
          title: b.title,
          snippet: (b.summary ?? b.body.join(" ")).slice(0, 140),
          href: `/appendix#bill-${b.id}`,
        });
      }
    }
  }

  return hits.slice(0, 60);
}

// ── Home categories (honest to what the document contains) ──────────────────
export interface Category {
  key: string;
  label: string;
  blurb: string;
  href: string;
  count?: number;
  accent?: boolean;
}

export function categories(): Category[] {
  return [
    {
      key: "preamble",
      label: "Preamble",
      blurb: "The founding resolve of the Union.",
      href: "/preamble",
    },
    {
      key: "articles",
      label: "Articles",
      blurb: `${articleCount} articles · ${sectionCount} sections`,
      href: "/articles",
      count: articleCount,
      accent: true,
    },
    {
      key: "amendments",
      label: "Amendments",
      blurb: "How the constitution may be changed.",
      href: "/articles/22",
    },
    {
      key: "appendix",
      label: "Appendices & Anthems",
      blurb: "Oath of office, guarantor form & anthems.",
      href: "/appendix",
    },
    {
      key: "bills",
      label: "Bills",
      blurb: "Proposed & passed student bills.",
      href: "/appendix?tab=bills",
      count: constitution.bills.length,
    },
    {
      key: "rights",
      label: "Rights & Duties",
      blurb: "Membership rights, code of conduct & duties.",
      href: "/rights",
    },
  ];
}