import { render, VNode } from "../deps.ts";
import { createClientManifest, importComponents } from "./manifest/client.ts";
import { ManifestContext } from "./manifest/index.ts";

export async function hydrate(root: VNode) {
  const manifest = createClientManifest();
  await importComponents(manifest, manifest.outlets);

  render(
    <ManifestContext.Provider value={manifest}>
      {root}
    </ManifestContext.Provider>,
    document,
    document.documentElement,
  );
}
