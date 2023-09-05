import { Action } from "./hooks/action.ts";
import { Loader } from "./hooks/loader.ts";

export type ActionReference = string;
export type LoaderReference = string;

export enum RoutePathType {
  MATCH = 0,
  PASS = 1,
  PARAM = 2,
  CATCH = 3,
}

export type RoutePathComponent =
  | { type: RoutePathType.MATCH; value: string }
  | { type: RoutePathType.PASS }
  | { type: RoutePathType.PARAM; value: string }
  | { type: RoutePathType.CATCH };

export type Route = {
  path: RoutePathComponent;
  module: Module;
};

export type Module = {
  index: string | null;
  layout: string | null;
  middleware: string | null;
  actions: ActionReference[];
  loaders: LoaderReference[];
  routes: Route[];
};

export type Project = {
  root: Module;
  dictionary: {
    action: Map<ActionReference, Action<any>>;
    loader: Map<LoaderReference, Loader<any>>;
  };
};

export function createModule(): Module {
  return {
    index: null,
    layout: null,
    middleware: null,
    actions: [],
    loaders: [],
    routes: [],
  };
}

/**
 * parse dirname into route component
 */
export function getRoutePathComponent(dirname: string): RoutePathComponent {
  if (dirname === "[...]") {
    return { type: RoutePathType.CATCH };
  } else if (dirname.startsWith("[") && dirname.endsWith("]")) {
    return { type: RoutePathType.PARAM, value: dirname.slice(1, -1) };
  } else if (dirname.startsWith("(") && dirname.endsWith(")")) {
    return { type: RoutePathType.PASS };
  } else return { type: RoutePathType.MATCH, value: dirname };
}

export async function sha256(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const key = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(key))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
