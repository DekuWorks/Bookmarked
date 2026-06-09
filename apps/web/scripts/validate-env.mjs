#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnvFile(filename) {
  const filePath = join(rootDir, filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  loadDotEnvFile(".env.local");
  loadDotEnvFile(".env");
}

const checks = [
  ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()],
];

let failed = false;

for (const [name, value] of checks) {
  if (!value) {
    console.error(`::error::Missing ${name}`);
    console.error(
      `Missing ${name}. Set it in apps/web/.env.local locally and add it as a GitHub repository secret for CI builds.`
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Supabase environment variables validated.");
