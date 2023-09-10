import { ComponentReference } from "../utils.ts";
import { deserializeManifest, Manifest } from "./index.ts";

export function createClientManifest() {
  const json = document.querySelector("script[data-slow]")!.innerHTML;
  return deserializeManifest(json);
}

/**
 * Make every components exist in manifest.components
 *
 * Client only. Server does not need this.
 */
export async function importComponents(
  manifest: Manifest,
  componentRefs: ComponentReference[],
) {
  await Promise.all(
    componentRefs.map(async (ref) => {
      if (!manifest.components.has(ref)) {
        const assetPath = manifest.imports.get(ref)!;
        const url = manifest.basePath + assetPath;
        const { default: component } = await import(url);
        manifest.components.set(ref, component);
      }
    }),
  );
}
