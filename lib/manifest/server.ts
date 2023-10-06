import { ClientAssets } from "../build-client.ts";
import { Project } from "../scan.ts";
import { Manifest } from "./mod.ts";

export function createServerManifest(
  project: Project,
  assets: ClientAssets,
): Manifest {
  return {
    entries: project.entires,
    basePath: "/",
    entryIndex: assets.entryIndex,
    assetNames: assets.assets,
    assetGraph: assets.assetsDependencyGraph,
    componentIndexes: assets.componentIndexes,
  };
}
