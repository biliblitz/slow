import { Manager, SerializedManager } from "./index.ts";

export function createClientManager() {
  const json = document.querySelector("script[data-slow=manager]")?.innerHTML;
  if (!json) {
    throw new Error("No SSR data provided");
  }
  const data = JSON.parse(json) as SerializedManager;

  return {
    actions: new Map(data.actions),
    loaders: new Map(data.loaders),
    entryPath: data.entryPath,
    basePath: data.basePath,
    buildGraph: new Map(data.buildGraph),
    imports: new Map(data.imports),
  } as Manager;
}
