import { RoutePath } from "./utils.ts";

function isDynamicRoute(path: string) {
  return path.startsWith("[") && path.endsWith("]");
}

function isCatchAllRoute(path: string) {
  return path === "[...]";
}

export function validateRoutePath(path: RoutePath) {
  // catch all route must be the last one
  for (let i = 0; i < path.length; ++i) {
    if (isCatchAllRoute(path[i]) && i !== path.length - 1) {
      throw new Error("Invalid Path");
    }
  }
}

export function compareRoutePaths(a: RoutePath, b: RoutePath) {
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    const ca = isCatchAllRoute(a[i]);
    const cb = isCatchAllRoute(b[i]);
    // conflicts if both are catch all routes
    if (ca && cb) {
      throw new Error("Dynamic route conflicts");
    }
    // if one is catch all route, must be greater
    if (ca) return 1;
    if (cb) return -1;

    // if same depends on nest routes
    if (a[i] === b[i]) {
      continue;
    }

    const da = isDynamicRoute(a[i]);
    const db = isDynamicRoute(b[i]);
    // conflicts if both are dynamic routes
    if (da && db) {
      throw new Error("Dynamic route conflicts");
    }
    // if one is dynamic route, must be greater
    if (da) return 1;
    if (db) return -1;

    // if both are normal path, sort by dictionary order
    return a[i] > b[i] ? 1 : -1;
  }

  // if a and b are totally same, it is not good
  if (a.length === b.length) {
    throw new Error("duplicated routes");
  }

  // if a includes b / b includes a
  // the longer is greater
  return a.length - b.length;
}
