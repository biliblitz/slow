import { FunctionComponent } from "preact";
import { Action } from "./hooks/action.ts";
import { Loader } from "./hooks/loader.ts";
import { Middleware } from "./hooks/middleware.ts";

export type ActionReference = string;
export type LoaderReference = string;

export type ComponentReference = string;
export type MiddlewareReference = string;

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
  index: ComponentReference | null;
  layout: ComponentReference | null;
  middleware: MiddlewareReference | null;
  actions: ActionReference[];
  loaders: LoaderReference[];
  routes: Route[];
};

export type Dictionary = {
  action: Map<ActionReference, Action>;
  loader: Map<LoaderReference, Loader>;
  components: Map<ComponentReference, FunctionComponent>;
  middlewares: Map<MiddlewareReference, Middleware>;
};

export type Project = {
  root: Module;
  dictionary: Dictionary;
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

const jsreg = /\.[jt]sx?$/;

function isJavaScriptFile(filename: string) {
  if (Deno.build.os === "windows") {
    filename = filename.toLocaleLowerCase();
  }
  return jsreg.test(filename);
}

/**
 * Matches `loader.ts`, `loader.nick.tsx`, `loader.anything.else.ts`
 */
export function filenameMatchesWithNickname(filename: string, target: string) {
  return isJavaScriptFile(filename) && filename.startsWith(target + ".");
}

/**
 * Matches `root.ts`, `root.tsx`
 */
export function filenameMatches(filename: string, target: string) {
  return (
    filename.startsWith(target) &&
    isJavaScriptFile(filename.slice(target.length))
  );
}
