import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const port = process.env.PORT || "3000";

if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("Invalid PORT");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Keep the database schema and baseline data ready on cold starts.
// Prisma db push is idempotent and keeps this personal project portable
// between managed PostgreSQL providers without provider-specific setup.
run("npx", ["prisma", "db", "push"]);
run("npx", ["tsx", "prisma/seed.ts"]);

const child = spawn(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "start", "-H", "0.0.0.0", "-p", port],
  { stdio: "inherit", env: process.env }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", error => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", code => {
  process.exitCode = code ?? 1;
});
