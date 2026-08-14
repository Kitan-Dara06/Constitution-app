import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <span className="text-5xl">404</span>
      <p className="text-sm text-muted">
        That article or page doesn&apos;t exist in this constitution.
      </p>
      <Link href="/" className="btn-outline">
        Back home
      </Link>
    </div>
  );
}