import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { constitution, getArticle, relatedArticles } from "@/lib/data";
import { ArticleReader } from "@/components/ArticleReader";

export function generateStaticParams() {
  return constitution.articles.map((a) => ({ n: String(a.number) }));
}

export function generateMetadata({
  params,
}: {
  params: { n: string };
}): Metadata {
  const a = getArticle(Number(params.n));
  if (!a) return {};
  return {
    title: `Article ${a.number} — ${a.title}`,
    description: a.intro.join(" ").slice(0, 160) || a.title,
  };
}

export default function ArticlePage({ params }: { params: { n: string } }) {
  const a = getArticle(Number(params.n));
  if (!a) notFound();

  const related = relatedArticles(a.number, 4);
  const idx = constitution.articles.findIndex((x) => x.number === a.number);
  const prev = constitution.articles[idx - 1];
  const next = constitution.articles[idx + 1];

  return (
    <ArticleReader article={a} related={related} prev={prev} next={next} />
  );
}