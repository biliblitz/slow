import { Entry } from "../scan.ts";

export type Manifest = {
  entries: Entry[];
  basePath: string;
  entryIndex: number;
  assetNames: string[];
  assetGraph: number[][];
  componentIndexes: number[];
};
