import { Module, RoutePathType } from "./utils.ts";

export type MatchRoute = {
  module: Module;
  param?: [string, string];
};

export function matchRoutes(
  module: Module,
  pathname: string,
): MatchRoute[] | null {
  const result: MatchRoute[] = [];

  function searchRoute(module: Module, pathname: string) {
    // remove leading double slash

    // matches!
    if (pathname === "/" && module.index) {
      result.push({ module });
      return true;
    }

    for (const route of module.routes) {
      switch (route.path.type) {
        case RoutePathType.MATCH: {
          if (
            pathname.startsWith("/" + route.path.value + "/") &&
            searchRoute(
              route.module,
              pathname.slice(route.path.value.length + 1),
            )
          ) {
            result.unshift({ module });
            return true;
          }
          break;
        }
        case RoutePathType.PASS: {
          if (searchRoute(route.module, pathname)) {
            result.unshift({ module });
            return true;
          }
          break;
        }
        case RoutePathType.PARAM: {
          if (pathname === "/") continue;
          // slash is the second position of '/'
          const slash = pathname.slice(1).indexOf("/") + 1;
          if (searchRoute(route.module, pathname.slice(slash))) {
            result.unshift({
              module,
              param: [route.path.value, pathname.slice(1, slash)],
            });
            return true;
          }
          break;
        }
        case RoutePathType.CATCH: {
          result.unshift({ module: route.module });
          result.unshift({ module, param: ["$", pathname] });
          return true;
        }
      }
    }
  }

  if (searchRoute(module, pathname)) {
    return result;
  }

  return null;
}
