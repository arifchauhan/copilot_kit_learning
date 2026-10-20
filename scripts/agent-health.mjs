#!/usr/bin/env node
/** Probe LangGraph dev server (default 127.0.0.1:8123). Exit 0 if healthy. */
const base =
  process.env.AGENT_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8123";

const paths = ["/info", "/ok"];

async function probe(path) {
  const res = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(5000),
  });
  return res.ok;
}

let ok = false;
for (const path of paths) {
  try {
    if (await probe(path)) {
      ok = true;
      break;
    }
  } catch {
    /* try next path */
  }
}

if (ok) {
  console.log(`LangGraph agent is up at ${base}`);
  process.exit(0);
}

console.error(`LangGraph agent is not reachable at ${base}`);
console.error("Start it with:  npm run dev        (UI + agent)");
console.error("            or:  npm run dev:agent  (agent only)");
process.exit(1);
