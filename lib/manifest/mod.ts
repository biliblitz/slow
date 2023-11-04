import { ComponentType } from "preact";
import { Entry } from "../scan.ts";
import { LoaderStore } from "../utils/api.ts";

export type Manifest = {
  store: LoaderStore;
  entries: Entry[];
  basePath: string;
  params: string[];
  outlets: number[];
  entryIndex: number;
  assetNames: string[];
  assetGraph: number[][];
  componentIndexes: number[];
  components: ComponentType[];
};
