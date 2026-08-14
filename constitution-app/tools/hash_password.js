#!/usr/bin/env node
/**
 * Generate a salted SHA-256 password hash for the admin route.
 *   node tools/hash_password.js "your new password"
 *
 * Prints ADMIN_PASSWORD_SALT and ADMIN_PASSWORD_HASH — paste them into your
 * .env.local (dev) or Vercel project env vars (prod). The plaintext is never
 * stored anywhere; the route handler recomputes this hash on each save.
 */
const crypto = require("crypto");

const pw = process.argv[2] || (() => {
  const a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^*-";
  const b = crypto.randomBytes(22);
  let s = "";
  for (let i = 0; i < 22; i++) s += a[b[i] % a.length];
  return s;
})();

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.createHash("sha256").update(salt + pw).digest("hex");

console.log("Admin password (keep this private, share only with admins):");
console.log("  " + pw);
console.log("");
console.log("Put these in your environment (do NOT commit the password):");
console.log("ADMIN_PASSWORD_SALT=" + salt);
console.log("ADMIN_PASSWORD_HASH=" + hash);