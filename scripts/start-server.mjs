import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const port = process.env.PORT || "3000";

if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("Invalid PORT");
}

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
