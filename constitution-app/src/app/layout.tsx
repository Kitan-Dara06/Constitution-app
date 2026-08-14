import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/AppProviders";
import { Nav } from "@/components/Nav";
import "./globals.css";

const THEME_INIT = `(function(){try{
var t=localStorage.getItem('cc:theme'); t=t?JSON.parse(t):'system';
var fs=localStorage.getItem('cc:fs'); fs=fs?JSON.parse(fs):1;
var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
var r=document.documentElement;
r.classList.toggle('dark',d); r.style.colorScheme=d?'dark':'light';
r.style.setProperty('--fs',String(fs));
}catch(e){}})();`;

export const metadata: Metadata = {
  title: "FUNAABSU Constitution",
  description:
    "The 2019 Revised Constitution of the Federal University of Agriculture, Abeokuta Student Union — a clean, offline-friendly reader.",
  applicationName: "FUNAABSU Constitution",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FUNAABSU" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e100f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <AppProviders>
          <Nav />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:pb-20">
            {children}
          </main>
          <footer className="border-t">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-4 pb-28 pt-6 text-center text-xs text-muted md:pb-6">
              <p>
                The 2019 Revised Constitution of FUNAABSU · {new Date().getFullYear()}
              </p>
              <p className="flex items-center gap-2">
                <a href="/admin" className="hover:text-fg transition">
                  Admin
                </a>
                <span aria-hidden>·</span>
                <span>Read-only for students</span>
              </p>
            </div>
          </footer>
        </AppProviders>
      </body>
    </html>
  );
}