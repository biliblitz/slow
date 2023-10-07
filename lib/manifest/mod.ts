import { ComponentType } from "../../deps.ts";
import { Entry } from "../scan.ts";
import { LoaderStore } from "../utils/api.ts";
import { Match } from "../utils/entry.ts";

export type Manifest = {
  match: Match;
  store: LoaderStore;
  entries: Entry[];
  basePath: string;
  entryIndex: number;
  assetNames: string[];
  assetGraph: number[][];
  componentIndexes: number[];
  components: ComponentType[];
};
