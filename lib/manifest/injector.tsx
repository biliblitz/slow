import { ManifestInjectSymbol, serializeManifest } from "./client.ts";
import { useManifest } from "./context.tsx";

export function ManifestInjector() {
  const manifest = useManifest();
  const code = `window.${ManifestInjectSymbol}=${serializeManifest(manifest)}`;

  return <script type="module" dangerouslySetInnerHTML={{ __html: code }} />;
}
