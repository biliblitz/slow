// deno-lint-ignore-file no-explicit-any
import {
  ComponentReference,
  LoaderReference,
  Module,
  RoutePathType,
} from "./utils.ts";

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
          const segment = pathname.slice(1, slash);
          if (!segment) continue;
          if (searchRoute(route.module, pathname.slice(slash))) {
            result.unshift({ module, param: [route.path.value, segment] });
            return true;
          }
          break;
        }
        case RoutePathType.CATCH: {
          if (searchRoute(route.module, "/")) {
            result.unshift({ module, param: ["$", pathname] });
            return true;
          }
          break;
        }
      }
    }
  }

  if (searchRoute(module, pathname)) {
    return result;
  }

  return null;
}

export function matchErrorRoutes(
  module: Module,
  pathname: string,
): MatchRoute[] | null {
  const result: MatchRoute[] = [];

  function searchRoute(module: Module, pathname: string) {
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
          const segment = pathname.slice(1, slash);
          if (!segment) continue;
          if (searchRoute(route.module, pathname.slice(slash))) {
            result.unshift({ module, param: [route.path.value, segment] });
            return true;
          }
          break;
        }
        case RoutePathType.CATCH: {
          if (searchRoute(route.module, "/")) {
            result.unshift({ module, param: ["$", pathname] });
            return true;
          }
          break;
        }
      }
    }

    if (module.error) {
      result.unshift({ module });
      return true;
    }
  }

  if (searchRoute(module, pathname)) {
    return result;
  }

  return null;
}

export type Loaders = [LoaderReference, any][];
export type Outlets = ComponentReference[];
export type Params = [string, string][];

export function extractLayouts(routes: MatchRoute[]): Outlets {
  const outlets: Outlets = [];
  for (const route of routes) {
    if (route.module.layout) {
      outlets.push(route.module.layout);
    }
  }
  return outlets;
}

export function extractIndexOutlets(routes: MatchRoute[]): Outlets {
  const outlets = extractLayouts(routes);
  const last = routes.at(-1)?.module.index;
  if (last) outlets.push(last);
  return outlets;
}

export function extractErrorOutlets(routes: MatchRoute[]): Outlets {
  const outlets = extractLayouts(routes);
  const last = routes.at(-1)?.module.error;
  if (last) outlets.push(last);
  return outlets;
}

export function extractParams(routes: MatchRoute[]): Params {
  return routes
    .filter((route) => route.param)
    .map((route) => route.param!);
}
