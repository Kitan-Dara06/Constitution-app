import { createHash, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Env {
  salt?: string;
  hash?: string;
  token?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  path?: string;
}

function checkPassword(pw: string, e: Env): boolean {
  const salt = e.salt;
  const expected = e.hash;
  if (!salt || !expected) return false;
  const calc = createHash("sha256").update(salt + pw).digest("hex");
  const a = Buffer.from(calc, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Simple in-memory throttle: max 10 attempts / 10 min / IP.
const attempts = new Map<string, { n: number; t: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.t < 10 * 60 * 1000) {
    if (rec.n >= 10) return false;
    rec.n++;
  } else {
    attempts.set(ip, { n: 1, t: now });
  }
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "anon";
  if (!rateLimit(ip)) {
    return Response.json({ ok: false, error: "Too many attempts. Try later." }, { status: 429 });
  }

  let body: { action?: "verify" | "save"; password?: string; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const e: Env = {
    salt: process.env.ADMIN_PASSWORD_SALT,
    hash: process.env.ADMIN_PASSWORD_HASH,
    token: process.env.GH_TOKEN,
    owner: process.env.GH_OWNER,
    repo: process.env.GH_REPO,
    branch: process.env.GH_BRANCH || "main",
    path: process.env.GH_PATH || "data/constitution.json",
  };

  if (!checkPassword(body.password || "", e)) {
    return Response.json({ ok: false, error: "Wrong password." }, { status: 401 });
  }

  if (body.action === "verify") {
    return Response.json({ ok: true });
  }

  // action === "save" → commit to GitHub
  if (body.content == null) {
    return Response.json({ ok: false, error: "Missing content." }, { status: 400 });
  }
  if (!e.token || !e.owner || !e.repo) {
    return Response.json(
      {
        ok: false,
        error:
          "Server not configured. Set GH_TOKEN, GH_OWNER and GH_REPO (see .env.example).",
      },
      { status: 503 },
    );
  }

  const api = "https://api.github.com";
  const url = `${api}/repos/${e.owner}/${e.repo}/contents/${e.path}?ref=${e.branch}`;
  const auth = `Bearer ${e.token}`;

  try {
    // 1. fetch current file (need its blob sha to update)
    const cur = await fetch(url, {
      headers: {
        Authorization: auth,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
    let sha: string | undefined;
    if (cur.ok) {
      const j = await cur.json();
      sha = j.sha as string;
    } else if (cur.status !== 404) {
      return Response.json(
        { ok: false, error: `GitHub read failed (${cur.status}).` },
        { status: 502 },
      );
    }

    // 2. write new content
    const encoded = Buffer.from(
      JSON.stringify(body.content, null, 2) + "\n",
      "utf8",
    ).toString("base64");

    const put = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: auth,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore(constitution): admin update via app`,
        content: encoded,
        branch: e.branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!put.ok) {
      const txt = await put.text();
      return Response.json(
        { ok: false, error: `GitHub write failed (${put.status}). ${txt.slice(0, 160)}` },
        { status: 502 },
      );
    }

    const res = (await put.json()) as { commit?: { html_url?: string } };
    return Response.json({
      ok: true,
      commit: res.commit?.html_url,
      note: "Saved. A new deploy is building — students will see it shortly.",
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: "Network error talking to GitHub." },
      { status: 502 },
    );
  }
}