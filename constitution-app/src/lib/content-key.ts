import { constitution, getArticle } from "@/lib/data";

export type ContentKey = string;

export const kArticle = (n: number) => `a:${n}`;
export const kSection = (secNum: number) => `s:${secNum}`;
export const kPreamble = "pre";
export const kAppendix = (n: number) => `ap:${n}`;
export const kBill = (id: string) => `bill:${id}`;

export interface Resolved {
  key: ContentKey;
  title: string;
  subtitle: string;
  href: string;
  kind: string;
}

/** Map any stored key to a displayable, linkable entry. */
export function resolveKey(key: ContentKey): Resolved | null {
  const [kind, ...rest] = key.split(":");
  switch (kind) {
    case "a": {
      const a = getArticle(Number(rest[0]));
      if (!a) return null;
      return {
        key,
        kind: "Article",
        title: `Article ${a.number}`,
        subtitle: a.title,
        href: `/articles/${a.number}`,
      };
    }
    case "s": {
      const secNum = Number(rest[0]);
      for (const a of constitution.articles) {
        const s = a.sections.find((x) => x.number === secNum);
        if (s)
          return {
            key,
            kind: "Section",
            title: `S.${s.number} ${s.title}`,
            subtitle: `Article ${a.number} — ${a.title}`,
            href: `/articles/${a.number}#s${s.number}`,
          };
      }
      return null;
    }
    case "pre":
      return {
        key,
        kind: "Preamble",
        title: "Preamble",
        subtitle: "Founding resolve",
        href: "/preamble",
      };
    case "ap": {
      const ap = constitution.appendices.find((x) => x.number === Number(rest[0]));
      if (!ap) return null;
      return {
        key,
        kind: "Appendix",
        title: `${ap.label}`,
        subtitle: ap.title,
        href: `/appendix#ap${ap.number}`,
      };
    }
    case "bill": {
      const b = constitution.bills.find((x) => x.id === rest.join(":"));
      if (!b) return null;
      return {
        key,
        kind: "Bill",
        title: b.title,
        subtitle: b.summary ?? "Student bill",
        href: `/appendix#bill-${b.id}`,
      };
    }
    default:
      return null;
  }
}