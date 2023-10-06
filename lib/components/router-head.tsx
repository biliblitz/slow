import { useComputed } from "../../deps.ts";
import { useManifest } from "../manifest/context.tsx";
import { getLinkPreloadAs } from "../utils/ext.ts";
import { useRouter } from "./router.tsx";

function resolveDependencies(graph: number[][], initial: number[]) {
  const set = new Set<number>();
  while (initial.length > 0) {
    const elem = initial.pop()!;
    if (!set.has(elem)) {
      set.add(elem);
      initial.push(...graph[elem]);
    }
  }
  return Array.from(set);
}

function Preloads() {
  const manifest = useManifest();
  const router = useRouter();

  const dependencyPaths = useComputed(() =>
    resolveDependencies(
      manifest.assetGraph,
      router.preloads.value
        .concat(manifest.entryIndex),
    ).map((index) => manifest.basePath + manifest.assetNames[index])
  );

  return (
    <>
      {dependencyPaths.value.map((path) => {
        const usage = getLinkPreloadAs(path);
        return usage === "script"
          ? <link key={path} rel="modulepreload" href={path} />
          : <link key={path} rel="preload" href={path} as={usage} />;
      })}
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
