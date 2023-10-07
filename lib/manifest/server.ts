import { SlowCity } from "../build-common.ts";
import { LoaderStore } from "../utils/api.ts";
import { Match } from "../utils/entry.ts";
import { Manifest } from "./mod.ts";

export function createServerManifest(
  city: SlowCity,
  match: Match,
  store: LoaderStore,
): Manifest {
  return {
    store,
    match,
    entries: city.project.entires,
    basePath: "/",
    components: city.components,
    assetNames: city.assets.assetNames,
    assetGraph: city.assets.assetGraph,
    entryIndex: city.assets.entryIndex,
    componentIndexes: city.assets.componentIndexes,
  };
}
