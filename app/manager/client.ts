import { Manager, SerializedManager } from "./index.ts";

export function createClientManager() {
  const json = document.querySelector("script[data-slow=manager]")?.innerHTML;
  if (!json) {
    throw new Error("No SSR data provided");
  }
  const data = JSON.parse(json) as SerializedManager;

  return {
    actions: new Map(data.actions),
    loaders: new Map(data.loaders),
    entryPath: data.entryPath,
    basePath: data.basePath,
    buildGraph: new Map(data.buildGraph),
    imports: new Map(data.imports),
    renderTree: data.renderTree,
    components: new Map(),
  } as Manager;
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
