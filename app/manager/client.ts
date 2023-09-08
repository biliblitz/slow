import { ComponentReference } from "../utils.ts";
import { deserializeManager, Manager } from "./index.ts";

export function createClientManager() {
  const json = document.querySelector("script[data-slow=manager]")!.innerHTML;
  return deserializeManager(json);
}

/**
 * Make every components exist in manager.components
 *
 * Client only. Server does not need this.
 */
export async function loadComponents(
  manager: Manager,
  componentRefs: ComponentReference[],
) {
  await Promise.all(
    componentRefs.map(async (ref) => {
      if (!manager.components.has(ref)) {
        const assetPath = manager.imports.get(ref)!;
        const url = manager.basePath + assetPath;
        const { default: component } = await import(url);
        manager.components.set(ref, component);
      }
    }),
  );
}
