import { useComputed } from "../../deps.ts";
import { useManifest } from "../manifest/index.ts";
import { resolveDependencies } from "../utils.ts";
import { useRouter } from "./router.tsx";

function Preloads() {
  const manifest = useManifest();
  const router = useRouter();

  const deps = useComputed(() => {
    return resolveDependencies(
      manifest.graph,
      router.preloads.value
        .map((ref) => manifest.imports.get(ref)!)
        .concat(manifest.entryPath),
    );
  });

  return (
    <>
      {deps.value.map((dep) => (
        <link key={dep} rel="modulepreload" href={manifest.basePath + dep} />
      ))}
    </>
  );
}

export function RouterHead() {
  return (
    <>
      <title>233</title>

      <Preloads />
    </>
  );
}
