import Link from "next/link";
import { constitution, getArticle } from "@/lib/data";
import { ChevronRight, ScaleIcon } from "@/components/icons";
import type { Section } from "@/lib/data";

const findSection = (num: number): { article: number; section?: Section } => {
  for (const a of constitution.articles) {
    const s = a.sections.find((x) => x.number === num);
    if (s) return { article: a.number, section: s };
  }
  return { article: 0 };
};

type Group = {
  tag: "Right" | "Duty" | "Objective";
  title: string;
  blurb: string;
  href: string;
};

function buildGroups(): Group[] {
  const g: Group[] = [];
  const s5 = findSection(5);
  if (s5.section)
    g.push({
      tag: "Right",
      title: `S.5 · ${s5.section.title}`,
      blurb: "Membership categories, privileges and the membership rights of every student.",
      href: `/articles/${s5.article}#s5`,
    });
  const s11 = findSection(11);
  if (s11.section)
    g.push({
      tag: "Right",
      title: `S.11 · ${s11.section.title}`,
      blurb: s11.section.text || "Who may vote in the Union.",
      href: `/articles/${s11.article}#s${s11.section.number}`,
    });
  const s4 = findSection(4);
  if (s4.section)
    g.push({
      tag: "Objective",
      title: `S.4 · ${s4.section.title}`,
      blurb: s4.section.clauses[0] || "The fundamental objectives of the Union.",
      href: `/articles/${s4.article}#s4`,
    });
  const a5 = getArticle(5);
  if (a5)
    g.push({
      tag: "Duty",
      title: `Article ${a5.number} · ${a5.title}`,
      blurb: "The code of conduct for members and order in the Senate.",
      href: `/articles/5`,
    });
  const a1 = getArticle(1);
  if (a1)
    g.push({
      tag: "Duty",
      title: "S.3 · Supremacy of the Constitution",
      blurb: "The constitution binds every member and organ of the Union.",
      href: `/articles/1#s3`,
    });
  return g;
}

const TAG_STYLES: Record<Group["tag"], string> = {
  Right: "bg-accent/15 text-accent",
  Duty: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  Objective: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export default function RightsPage() {
  const groups = buildGroups();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
          <ScaleIcon width={14} height={14} /> Rights &amp; Duties
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Rights &amp; Duties
        </h1>
        <p className="text-sm text-muted">
          Curated references to the sections that define what members are owed and
          owe. This document frames these as membership rights, objectives and a
          code of conduct.
        </p>
      </header>

      <ul className="flex flex-col gap-2.5">
        {groups.map((g) => (
          <li key={g.title}>
            <Link
              href={g.href}
              className="group flex items-center gap-3 rounded-2xl border bg-card p-4 transition hover:bg-surface-2"
            >
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-medium ${TAG_STYLES[g.tag]}`}
              >
                {g.tag}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {g.title}
                </span>
                <span className="clamp-2 block text-xs text-muted">
                  {g.blurb}
                </span>
              </span>
              <ChevronRight
                width={18}
                height={18}
                className="text-muted transition group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}