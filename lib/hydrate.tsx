import { render, VNode } from "../deps.ts";
import { createClientManifest } from "./manifest/client.ts";
import { ManifestProvider } from "./manifest/context.tsx";

export function hydrate(root: VNode) {
  const manifest = createClientManifest();

  render(
    <ManifestProvider manifest={manifest}>
      {root}
    </ManifestProvider>,
    document,
    document.documentElement,
  );
}
