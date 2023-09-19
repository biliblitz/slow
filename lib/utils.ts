// deno-lint-ignore-file no-explicit-any

import { FunctionComponent } from "../deps.ts";
import { Action } from "./hooks/action.ts";
import { Loader } from "./hooks/loader.ts";
import { Middleware } from "./hooks/middleware.ts";
import { PageData } from "./manifest/index.ts";

export type ActionReference = string;
export type LoaderReference = string;

export type ComponentReference = string;
export type MiddlewareReference = string;

export type BuiltFile = string;

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
  error: ComponentReference | null;
  layout: ComponentReference | null;
  middleware: MiddlewareReference | null;
  actions: ActionReference[];
  loaders: LoaderReference[];
  routes: Route[];
};

export type Dictionary = {
  action: Map<ActionReference, Action<any>>;
  loader: Map<LoaderReference, Loader<any>>;
  components: Map<ComponentReference, FunctionComponent>;
  middlewares: Map<MiddlewareReference, Middleware>;
  /** "cccccccc" => "file:///project/component.tsx" */
  componentUrls: Map<ComponentReference, string>;
  /** "cccccccc" => "build/s-XXXXXXXX.js" */
  componentImports: Map<ComponentReference, BuiltFile>;
};

export type ServerRedirectResponse = {
  ok: "redirect";
  redirect: string;
};
export type ServerErrorResponse = {
  ok: "error";
  status: number;
  message: string;
};
export type ServerLoaderResponse =
  | { ok: "data"; data: PageData }
  | ServerRedirectResponse
  | ServerErrorResponse;

export type ServerActionResponse =
  | { ok: "success"; data: PageData; action: any }
  | ServerRedirectResponse
  | ServerErrorResponse;

export function createModule(): Module {
  return {
    index: null,
    error: null,
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

export async function hash(message: string) {
  return (await sha256(message)).slice(0, 8);
}

const JS_REGEX = /\.[jt]sx?$/i;
const CSS_REGEX = /\.css$/i;

export function isJavaScriptFile(filename: string) {
  return JS_REGEX.test(filename);
}

export function isCssFile(filename: string) {
  return CSS_REGEX.test(filename);
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

export function resolveDependencies(
  buildGraph: Map<BuiltFile, BuiltFile[]>,
  entries: BuiltFile[],
) {
  const set = new Set<string>();
  while (entries.length > 0) {
    const entry = entries.pop()!;
    if (!set.has(entry)) {
      set.add(entry);
      const deps = buildGraph.get(entry)!;
      entries.push(...deps);
    }
  }
  return Array.from(set);
}