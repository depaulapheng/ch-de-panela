import { execFileSync } from "node:child_process";

execFileSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  env: process.env
});

execFileSync("npx", ["tsx", "prisma/seed-open-images.ts"], {
  stdio: "inherit",
  env: process.env
});
