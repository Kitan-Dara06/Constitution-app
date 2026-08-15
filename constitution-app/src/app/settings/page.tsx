"use client";

import { useState } from "react";
import { useApp, FONT_SCALES } from "@/components/AppProviders";
import { constitution } from "@/lib/data";
import { SunIcon, MoonIcon, AutoIcon, CheckIcon } from "@/components/icons";

const THEMES: { key: "light" | "dark" | "system"; label: string; Icon: typeof SunIcon }[] = [
  { key: "light", label: "Light", Icon: SunIcon },
  { key: "dark", label: "Dark", Icon: MoonIcon },
  { key: "system", label: "Auto", Icon: AutoIcon },
];

export default function SettingsPage() {
  const { theme, setTheme, fontScale, setFontScale, clearLibrary, bookmarks } =
    useApp();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      {/* Appearance */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ key, label, Icon }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition ${
                  active ? "border-accent bg-accent-soft/50" : "bg-card hover:bg-surface-2"
                }`}
              >
                <Icon
                  width={22}
                  height={22}
                  className={active ? "text-accent" : "text-muted"}
                />
                <span className={`text-sm ${active ? "font-medium" : "text-muted"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Font size */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          Reading text size
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {FONT_SCALES.map(({ label, value }) => {
            const active = fontScale === value;
            return (
              <button
                key={label}
                onClick={() => setFontScale(value)}
                className={`rounded-2xl border px-2 py-4 text-center transition ${
                  active ? "border-accent bg-accent-soft/50" : "bg-card hover:bg-surface-2"
                }`}
              >
                <span
                  className="font-serif font-medium"
                  style={{ fontSize: `${0.95 * value}rem` }}
                >
                  A
                </span>
                <span
                  className={`mt-1 block text-[0.7rem] ${active ? "font-medium" : "text-muted"}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="card p-4">
          <p className="reading font-serif text-fg/90">
            The Union shall be known, called and addressed as the Federal
            University of Agriculture, Abeokuta Student Union (FUNAABSU).
          </p>
        </div>
      </section>

      {/* Data */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          Your data
        </h2>
        <div className="card flex flex-col gap-2 p-4">
          <p className="text-sm text-muted">
            Bookmarks, notes and recently-read items are stored only in this
            browser. No account, no tracking.
          </p>
          {!confirm ? (
            <button onClick={() => setConfirm(true)} className="btn-outline self-start">
              Clear saved data
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">Clear all {bookmarks.length} bookmark(s)?</span>
              <button
                onClick={() => {
                  clearLibrary();
                  setConfirm(false);
                }}
                className="btn-primary"
              >
                <CheckIcon width={16} height={16} /> Yes, clear
              </button>
              <button onClick={() => setConfirm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
          About
        </h2>
        <div className="card flex flex-col gap-1 p-4 text-sm">
          <p className="font-medium">{constitution.meta.fullTitle}</p>
          <p className="text-muted">{constitution.meta.subtitle}</p>
          <p className="text-muted">Edition: {constitution.meta.version}</p>
          {constitution.meta.appCredit && (
            <p className="mt-2 border-t pt-2 text-muted italic">
              {constitution.meta.appCredit}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}