import { render, VNode } from "../deps.ts";
import { importComponents } from "./components/router.tsx";
import { createClientManifest } from "./manifest/client.ts";
import { ManifestProvider } from "./manifest/context.tsx";

export async function hydrate(root: VNode) {
  const manifest = createClientManifest();
  await importComponents(
    manifest,
    manifest.components,
    manifest.entries[0].components,
  );

  render(
    <ManifestProvider manifest={manifest}>
      {root}
    </ManifestProvider>,
    document,
    document.documentElement,
  );
}
