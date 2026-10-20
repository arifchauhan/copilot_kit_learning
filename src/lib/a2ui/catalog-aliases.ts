import { Catalog } from "@a2ui/web_core/v0_9";

/** Common mistaken or legacy catalog ids emitted by models and older tools. */
export const A2UI_CATALOG_ALIAS_IDS = [
  "a2ui-v0.9",
  "copilotkit://basic-catalog",
  "https://a2ui.org/specification/v0_9/basic_catalog.json",
] as const;

/** Register the primary catalog plus aliases so createSurface lookups succeed. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildProcessorCatalogs(primary: Catalog<any>): Catalog<any>[] {
  const components = [...primary.components.values()];
  const functions = [...primary.functions.values()];
  const seen = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catalogs: Catalog<any>[] = [];

  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    catalogs.push(
      id === primary.id
        ? primary
        : new Catalog(id, components, functions),
    );
  };

  add(primary.id);
  for (const id of A2UI_CATALOG_ALIAS_IDS) add(id);

  return catalogs;
}
