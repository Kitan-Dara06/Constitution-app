import Link from "next/link";
import { constitution } from "@/lib/data";
import { SaveBar } from "@/components/SaveBar";
import { RecentTracker } from "@/components/RecentTracker";
import { kPreamble } from "@/lib/content-key";
import { ChevronLeft } from "@/components/icons";

export default function PreamblePage() {
  const pre = constitution.preamble;
  return (
    <div className="flex flex-col gap-6">
      <RecentTracker bookKey={kPreamble} />
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg transition"
        >
          <ChevronLeft width={16} height={16} /> Home
        </Link>
        <SaveBar bookKey={kPreamble} />
      </div>

      <header className="flex flex-col gap-1.5 border-b pb-5">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
          Preamble
        </span>
        <h1 className="font-serif text-2xl font-medium tracking-tight">
          Preamble
        </h1>
      </header>

      <article className="reading font-serif text-fg/90 flex flex-col gap-4">
        <p className="first-letter:float-left first-letter:mr-2 first-letter:font-sans first-letter:text-5xl first-letter:font-semibold first-letter:text-accent">
          {pre.clauses[0]}
        </p>
        {pre.clauses.slice(1).map((c, i) => (
          <p key={i}>{c}</p>
        ))}
      </article>
    </div>
  );
}