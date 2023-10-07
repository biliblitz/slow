import { ComponentType } from "../../deps.ts";
import { Entry } from "../scan.ts";
import { LoaderStore } from "../utils/api.ts";

export type Manifest = {
  store: LoaderStore;
  entries: Entry[];
  basePath: string;
  entryIndex: number;
  assetNames: string[];
  assetGraph: number[][];
  componentIndexes: number[];
  components: ComponentType[];
};
