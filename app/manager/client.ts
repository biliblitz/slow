import { deserializeManager, Manager } from "./index.ts";

export function createClientManager() {
  const json = document.querySelector("script[data-slow=manager]")!.innerHTML;
  return deserializeManager(json);
}

/**
 * Load manager.components due to manager.renderTree in browser
 */
export async function preloadClientManager(manager: Manager) {
  await Promise.all(
    manager.renderTree.map(async (ref) => {
      const assetPath = manager.imports.get(ref)!;
      const url = manager.basePath + assetPath;
      const { default: component } = await import(url);
      manager.components.set(ref, component);
    }),
  );
}
