import { assert } from "https://deno.land/std@0.201.0/assert/assert.ts";
import { Module, ActionReference, RoutePathType } from "./utils.ts";

export type MatchRoute = {
  module: Module;
  param?: [string, string];
};

export function matchRoutes(
  module: Module,
  pathname: string,
  condition: (module: Module) => boolean
): MatchRoute[] | false {
  // assert(isValidPathname(pathname));

  const result: MatchRoute[] = [];

  function dfs(module: Module, pathname: string) {
    // remove leading double slash

    // matches!
    if (condition(module) && pathname === "/") {
      result.push({ module });
      return true;
    }

    for (const route of module.routes) {
      switch (route.path.type) {
        case RoutePathType.MATCH: {
          if (
            pathname.startsWith("/" + route.path.value + "/") &&
            dfs(route.module, pathname.slice(route.path.value.length + 1))
          ) {
            result.unshift({ module: route.module });
            return true;
          }
          break;
        }
        case RoutePathType.PASS: {
          if (dfs(route.module, pathname)) {
            result.unshift({ module: route.module });
            return true;
          }
          break;
        }
        case RoutePathType.PARAM: {
          if (pathname === "/") continue;
          // slash is the second position of '/'
          const slash = pathname.slice(1).indexOf("/") + 1;
          if (dfs(route.module, pathname.slice(slash))) {
            result.unshift({
              module: route.module,
              param: [route.path.value, pathname.slice(1, slash)],
            });
            return true;
          }
          break;
        }
        case RoutePathType.CATCH: {
          result.unshift({
            module: route.module,
            param: ["$", pathname],
          });
          return true;
        }
      }
    }
  }

  if (dfs(module, pathname)) {
    return result;
  }

  return false;
}

export function matchPageRoutes(module: Module, pathname: string) {
  return matchRoutes(module, pathname, (module) => !!module.index);
}

export function matchActionRoutes(
  module: Module,
  pathname: string,
  action: ActionReference
) {
  return matchRoutes(module, pathname, (module) =>
    module.actions.includes(action)
  );
}

export function isValidPathname(pathname: string) {
  return (
    pathname.startsWith("/") &&
    pathname.endsWith("/") &&
    !pathname.includes("//")
  );
}

export function fixPathname(pathname: string) {
  while (pathname.includes("//")) pathname = pathname.replaceAll("//", "/");
  if (!pathname.startsWith("/")) pathname = "/" + pathname;
  if (!pathname.endsWith("/")) pathname = pathname + "/";
  return pathname;
}
