import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const a2uiProviderReplacement = path.join(
  projectRoot,
  "src/lib/a2ui/A2UIProvider.tsx",
);

const nextConfig: NextConfig = {
  // Page on localhost while assets/API use 127.0.0.1 (or the reverse).
  allowedDevOrigins: ["127.0.0.1"],
  // Pin the root to this folder. Otherwise a lockfile in a parent folder
  // becomes the workspace root. This value also sets the file tracing root.
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      "@copilotkit/a2ui-renderer/dist/react-renderer/core/A2UIProvider.mjs":
        a2uiProviderReplacement,
      "@copilotkit/a2ui-renderer/dist/react-renderer/core/A2UIProvider":
        a2uiProviderReplacement,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@copilotkit/a2ui-renderer/dist/react-renderer/core/A2UIProvider.mjs":
        a2uiProviderReplacement,
    };
    return config;
  },
  output: "standalone",
  serverExternalPackages: ["@copilotkit/runtime"],
  env: {
    // NEXT_PUBLIC_* resolves at build time while the Runtime reads the project key
    // per request. Provide CPK_INTELLIGENCE_API_KEY during the host build so the
    // browser gate matches the managed Runtime configuration.
    NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED: process.env.CPK_INTELLIGENCE_API_KEY
      ? "true"
      : "false",
  },
  typescript: {
    // Docker route override uses HttpAgent which has a type mismatch with CopilotRuntime
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
