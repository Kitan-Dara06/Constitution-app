"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppProviders";
import {
  HomeIcon,
  ListIcon,
  SearchIcon,
  BookmarkIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  ScaleIcon,
} from "@/components/icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/articles", label: "Articles", Icon: ListIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/bookmarks", label: "Saved", Icon: BookmarkIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

const ACTIVE = (path: string, href: string) =>
  href === "/" ? path === "/" : path.startsWith(href);

export function Nav() {
  const pathname = usePathname() || "/";
  const { resolvedDark, setTheme } = useApp();

  // Render a neutral theme-toggle button on the first pass so server HTML
  // and the first client render match. Only swap to the actual icon after
  // mount to avoid hydration mismatches (the resolved theme is browser-only).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedDark;

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-fg">
              <ScaleIcon width={18} height={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-[0.95rem] font-semibold tracking-tight">
                FUNAABSU
              </span>
              <span className="block text-[0.7rem] text-muted -mt-0.5">
                Constitution
              </span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              href="/articles"
              className={`navlink ${ACTIVE(pathname, "/articles") ? "navlink-active" : ""}`}
            >
              Articles
            </Link>
            <Link
              href="/appendix"
              className={`navlink ${ACTIVE(pathname, "/appendix") ? "navlink-active" : ""}`}
            >
              Appendix
            </Link>
            <Link
              href="/bookmarks"
              className={`navlink ${ACTIVE(pathname, "/bookmarks") ? "navlink-active" : ""}`}
            >
              Saved
            </Link>
            <Link
              href="/settings"
              className={`navlink ${ACTIVE(pathname, "/settings") ? "navlink-active" : ""}`}
            >
              Settings
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Link href="/search" className="btn-ghost !p-2" aria-label="Search">
              <SearchIcon width={18} height={18} />
            </Link>
            <button
              onClick={() => setTheme(dark ? "light" : "dark")}
              className="btn-ghost !p-2"
              aria-label="Toggle theme"
              aria-pressed={dark}
            >
              {dark ? (
                <SunIcon width={18} height={18} />
              ) : (
                <MoonIcon width={18} height={18} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-bg/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2">
          {TABS.map(({ href, label, Icon }) => {
            const active = ACTIVE(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 text-[0.65rem] transition ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                <Icon width={22} height={22} fill={active ? "currentColor" : "none"} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}