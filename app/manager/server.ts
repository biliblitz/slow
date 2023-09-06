import { ActionReference, Dictionary, LoaderReference } from "../utils.ts";
import { Manager } from "./index.ts";

type ComponentDictionary = Dictionary["components"];

type ServerManagerOptions = {
  components: ComponentDictionary;
  loaders: Map<LoaderReference, any>;
  actions: Map<ActionReference, any>;
};

export function createServerManager(options: ServerManagerOptions): Manager {
  return {
    getLoaderData(key) {
      return options.loaders.get(key)!;
    },
    getActionData(key) {
      return options.actions.get(key)!;
    },
    getComponent(key) {
      return options.components.get(key)!;
    },
  };
}
