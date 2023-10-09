import { render, VNode } from "preact";
import { importComponents } from "./components/router.tsx";
import { createClientManifest } from "./manifest/client.ts";
import { ManifestProvider } from "./manifest/context.tsx";

export async function hydrate(root: VNode) {
  const manifest = createClientManifest();
  await importComponents(
    manifest,
    manifest.components,
    manifest.entries[manifest.match.index].components,
  );
  console.log(manifest);

  render(
    <ManifestProvider manifest={manifest}>
      {root}
    </ManifestProvider>,
    document,
    document.documentElement,
  );
}
