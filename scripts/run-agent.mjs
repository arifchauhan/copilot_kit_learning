#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const agentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "agent");
const args = [
  "@langchain/langgraph-cli",
  "dev",
  "--host",
  "127.0.0.1",
  "--port",
  "8123",
  "--no-browser",
];

const child = spawn("npx", args, {
  cwd: agentDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
