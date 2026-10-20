/**
 * Server-safe A2UI inline schema (no @copilotkit/a2ui-renderer — that bundle is client/React).
 */
import { demonstrationCatalogDefinitions } from "@/app/declarative-generative-ui/definitions";
import { APP_DASHBOARD_CATALOG_ID } from "@/lib/a2ui-catalog-id";
import { zodToJsonSchema } from "zod-to-json-schema";

const components: Record<string, Record<string, unknown>> = {};

for (const [name, def] of Object.entries(demonstrationCatalogDefinitions)) {
  const zodSchema = zodToJsonSchema(def.props, {
    target: "jsonSchema2019-09",
  }) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };
  components[name] = {
    allOf: [
      { $ref: "common_types.json#/$defs/ComponentCommon" },
      {
        properties: {
          component: { const: name },
          ...(zodSchema.properties ?? {}),
        },
        required: ["component", ...(zodSchema.required ?? [])],
      },
    ],
  };
}

export const serverA2uiInlineSchema = {
  catalogId: APP_DASHBOARD_CATALOG_ID,
  components,
};
