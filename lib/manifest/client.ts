import { Manifest } from "./mod.ts";

export function serialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => serialize(item)).join(",")}]`;
  }
  if (value instanceof RegExp) return value.toString();
  if (typeof value === "string") {
    return JSON.stringify(value).replaceAll("/", "\\/");
  }
  if (typeof value === "boolean") return value ? "!0" : "!1";
  if (typeof value === "number") return String(value);
  throw new Error("Unknown Object serialization");
}

export function shortenManifest(manifest: Manifest) {
  return [
    manifest.basePath,
    manifest.entryIndex,
    manifest.entries.map((entry) =>
      [
        entry.regex,
        entry.params,
        entry.loaders,
        entry.components,
        entry.middlewares,
      ] as const
    ),
    manifest.assetNames,
    manifest.assetGraph,
    manifest.componentIndexes,
  ] as const;
}

export type ShortenManifest = ReturnType<typeof shortenManifest>;

export function serializeManifest(manifest: Manifest) {
  return serialize(shortenManifest(manifest));
}

export function lengthenManifest(shorten: ShortenManifest): Manifest {
  return {
    basePath: shorten[0],
    entryIndex: shorten[1],
    entries: shorten[2].map((entry) => ({
      regex: entry[0],
      params: entry[1],
      loaders: entry[2],
      components: entry[3],
      middlewares: entry[4],
    })),
    assetNames: shorten[3],
    assetGraph: shorten[4],
    componentIndexes: shorten[5],
  };
}

export function deserializeManifest(shorten: ShortenManifest) {
  return lengthenManifest(shorten);
}

// we cannot use symbol here
export const ManifestInjectSymbol = "__slow_manifest__";

declare global {
  interface Window {
    [ManifestInjectSymbol]?: ShortenManifest;
  }
}

export function createClientManifest() {
  if (!window[ManifestInjectSymbol]) {
    throw new Error(
      "Injection code not found, did you forget <ManifestInjector />?",
    );
  }

  return deserializeManifest(window[ManifestInjectSymbol]);
}
