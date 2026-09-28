import { execFileSync } from "node:child_process";

execFileSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  env: process.env
});

// Idempotent cleanup: do not run an image search or rewrite curated image URLs at startup.
execFileSync("npx", ["tsx", "prisma/cleanup-gift-images.ts"], {
  stdio: "inherit",
  env: process.env
});
