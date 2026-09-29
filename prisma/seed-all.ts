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

// Read-only, non-sensitive catalogue is logged on deploy to verify every gift.
execFileSync("npx", ["tsx", "prisma/audit-gift-images.ts"], {
  stdio: "inherit",
  env: process.env
});
