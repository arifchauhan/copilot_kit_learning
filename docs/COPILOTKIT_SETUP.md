# CopilotKit setup in this repo

This project is a **Next.js 16 App Router** app with **CopilotKit v2** and a **LangGraph JS** agent. The four setup steps from the [quickstart](https://docs.copilotkit.ai/quickstart.md) are already done here; use this doc to understand the wiring or to mirror the same pattern in another app.

## 1. Framework and structure (detected)

| Item | Value |
|------|--------|
| Framework | Next.js 16 (`app/` router) |
| UI | React 19, Tailwind 4 |
| CopilotKit surface | `@copilotkit/react-core/v2` |
| Runtime | `@copilotkit/runtime/v2` on `/api/copilotkit` |
| Agent | LangGraph via `@ag-ui/langgraph` → `http://127.0.0.1:8123` |
| Optional cloud | CopilotKit Intelligence (threads) when `CPK_INTELLIGENCE_API_KEY` is set |
| Generative UI | A2UI catalog + `openGenerativeUI` |

Key paths:

```
src/app/layout.tsx              → CopilotKit provider (client root layout)
src/app/page.tsx                → CopilotChat + threads drawer
src/app/api/copilotkit/[[...slug]]/route.ts  → CopilotRuntime + endpoint
src/agent.ts                    → LangGraphAgent client config
agent/                          → LangGraph graph (tools, A2UI, todos)
```

## 2. Packages (installed)

Required for chat + custom agent (already in `package.json`):

- `@copilotkit/react-core` — provider, chat, hooks
- `@copilotkit/runtime` — server runtime and HTTP endpoint
- `@copilotkit/a2ui-renderer` — A2UI catalog (optional; remove if you only want plain chat)

Always import from **`/v2`** subpaths. `tsconfig.json` uses `"moduleResolution": "bundler"` (required for `/v2` types).

To add CopilotKit to a **different** Next app:

```bash
npm install @copilotkit/react-core @copilotkit/runtime
```

## 3. Runtime (server)

Pattern in `src/app/api/copilotkit/[[...slug]]/route.ts`:

1. Build `CopilotRuntime` with `agents: { default: … }`.
2. This starter registers **`LangGraphAgent`** (your graph), not `BuiltInAgent`.
3. Optionally attach `CopilotKitIntelligence` for persisted threads.
4. Expose routes with `createCopilotEndpoint` + Hono `handle` (Next.js adapter).

Minimal **built-in model only** (no LangGraph) would look like:

```ts
import { CopilotRuntime, createCopilotEndpoint, BuiltInAgent } from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: { default: new BuiltInAgent({ model: "openai:gpt-5.4-mini" }) },
});
```

This repo keeps LangGraph so tools, A2UI, and shared state live in `agent/`.

## 4. Provider (client)

Pattern in `src/app/layout.tsx`:

1. `"use client"` on the layout (or a dedicated `providers.tsx` imported from a server layout).
2. Import `@copilotkit/react-core/v2/styles.css`.
3. Wrap the tree in `<CopilotKit runtimeUrl="/api/copilotkit" …>`.

`runtimeUrl` must match the API `basePath` (`/api/copilotkit`).

## 5. Chat UI

Pattern in `src/app/page.tsx`:

- `CopilotChatConfigurationProvider` with `agentId="default"` (matches runtime agent key).
- `CopilotChat` for the message UI.
- Optional: `CopilotThreadsDrawer` when Intelligence is enabled.

For a minimal sidebar instead of the demo layout, you can use `CopilotSidebar` from the same v2 package (see quickstart).

## Environment

Copy `.env.example` to `.env` and fill in keys. Minimum for **local chat + LangGraph**:

- `OPENAI_API_KEY` — used by the agent in `agent/`
- `AGENT_URL=http://127.0.0.1:8123` — runtime → agent (defaults match if unset)

For **saved threads** (what this project uses in dev):

- `CPK_INTELLIGENCE_API_KEY` — from CopilotKit Intelligence / `copilotkit init`

## Run and verify

```bash
npm run dev          # Next.js :3000 + LangGraph :8123 (both required for chat)
npm run agent:health # quick probe of http://127.0.0.1:8123
```

If the browser shows **connection refused** on port **8123**, you started only the UI (`npm run dev:ui`). Run `npm run dev` or `npm run dev:agent` in another terminal.

Wiring check (per CopilotKit skill):

```bash
npx copilotkit@latest verify --json
```

With Intelligence configured, all checks should pass when the dev server is up.

## Adapting to your product app

1. Copy the **runtime route** and **provider + styles** into your Next app.
2. Either keep **LangGraph** (copy `agent/` + `createDefaultAgent`) or switch runtime to **BuiltInAgent** for a model-only copilot.
3. Replace demo UI (`ExampleCanvas`, A2UI catalog) with your pages; keep `CopilotChat` where users should talk to the agent.
4. Replace `identifyUser: () => ({ id: "demo-user" })` with real auth before production.
5. Use frontend tools and `useCopilotReadable` to pass page context into the agent.

## Agent skills in this repo

Installed under `.agents/skills/` (e.g. `copilotkit`, `copilotkit-cli`). In Cursor, ask the agent to follow the **copilotkit** skill when changing runtime, chat, or Intelligence behavior.
