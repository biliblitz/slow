// deno-lint-ignore-file no-explicit-any
import { extname, renderToString, typeByExtension } from "../server-deps.ts";
import { VNode } from "../deps.ts";

import { ServerDataResponse } from "./utils.ts";
import {
  extractErrorOutlets,
  extractIndexOutlets,
  extractParams,
  Loaders,
  matchErrorRoutes,
  MatchRoute,
  matchRoutes,
} from "./route.ts";
import { ManifestContext, PageData } from "./manifest/index.ts";
import { createServerManifest } from "./manifest/server.ts";
import { Project } from "./build.ts";
import { RequestEvent } from "./hooks/mod.ts";

const LOGO = `
 ____  _                ____ _ _         
/ ___|| | _____      __/ ___(_) |_ _   _ 
\\___ \\| |/ _ \\ \\ /\\ / / |   | | __| | | |
 ___) | | (_) \\ V  V /| |___| | |_| |_| |
|____/|_|\\___/ \\_/\\_/  \\____|_|\\__|\\__, |
                                   |___/ 
`;

export function createSlowCity(root: VNode, project: Project) {
  console.log(LOGO);

  /**
   * Run the action, and returns
   */
  async function runAction(
    routes: MatchRoute[],
    event: RequestEvent,
    ref: string,
  ) {
    const action = project.dictionary.action.get(ref)!;
    for (const route of routes) {
      if (route.module.middleware) {
        const middleware = project.dictionary.middlewares
          .get(route.module.middleware)!;
        await middleware(event);
      }
      if (route.module.actions.includes(ref)) {
        return await action.__func(event);
      }
    }
  }

  async function runLoaders(
    routes: MatchRoute[],
    event: RequestEvent,
  ) {
    const loaders: Loaders = [];
    for (const route of routes) {
      // apply middleware
      if (route.module.middleware) {
        const middleware = project.dictionary.middlewares
          .get(route.module.middleware)!;
        await middleware(event);
      }
      // run all loader concurrently
      const results = await Promise.all(
        route.module.loaders.map(async (ref) => {
          const loader = project.dictionary.loader.get(ref)!;
          const result = await loader.__func(event);
          return [ref, result] as [string, any];
        }),
      );
      loaders.push(...results);
    }
    return loaders;
  }

  return async (req: Request) => {
    const url = new URL(req.url);
    const headers = new Headers();

    // === STATIC ASSETS ===

    // if is fetch assets
    if (url.pathname.startsWith("/build/")) {
      const assetName = url.pathname.slice(1);
      const contents = project.buildAssets.get(assetName);
      if (contents) {
        const mime = typeByExtension(extname(assetName)) ||
          "application/octet-stream";
        headers.set("Content-Type", mime);
        headers.set("Cache-Control", "max-age=604800");
        return new Response(contents, { headers });
      }
      return new Response(null, { status: 404 });
    }

    // === RENDER ===

    function renderPage(data: PageData, status = 200) {
      const manifest = createServerManifest({
        graph: project.buildGraph,
        params: data.params,
        outlets: data.outlets,
        loaders: data.loaders,
        imports: project.dictionary.componentImports,
        entryPath: project.entryPath,
        stylePath: project.stylePath,
        components: project.dictionary.components,
      });

      const html = renderToString(
        <ManifestContext.Provider value={manifest}>
          {root}
        </ManifestContext.Provider>,
      );

      headers.set("Content-Type", "text/html");
      return new Response("<!DOCTYPE html>" + html, { status, headers });
    }

    async function renderErrorPage(status: number) {
      const routes = matchErrorRoutes(project.root, url.pathname);

      // assert for non-error page websites
      if (!routes) {
        return new Response(null, { status, headers });
      }

      const params = extractParams(routes);
      const event = { req, headers, params: new Map(params) };
      const loaders = await runLoaders(routes, event);
      const outlets = extractErrorOutlets(routes);
      return renderPage({ loaders, outlets, params }, status);
    }

    // === PREPARES ===

    // check if url is a valid page
    let pathname = url.pathname;
    // Remove 's-data.json' if request for data
    const isFetchData = pathname.endsWith("/s-data.json");
    if (isFetchData) pathname = pathname.slice(0, -11);
    // Add the final slash if missing
    const missingFinalSlash = !pathname.endsWith("/");
    if (missingFinalSlash) pathname += "/";

    // === EARLY REJECTIONS ===

    // Reject all non-POST and non-GET requests
    if (req.method !== "POST" && req.method !== "GET") {
      headers.set("Allow", "GET, POST");
      return await renderErrorPage(405);
    }

    // === MATCH ROUTES ===

    // Try to match routes with given pathname
    const routes = matchRoutes(project.root, pathname);

    // If we find a valid route with a slash, we then redirect to it
    if (routes && missingFinalSlash) {
      // In this case, `isFetchData` will always be false
      // We modify url to preserve searchParams, etc.
      url.pathname = pathname;
      // Make a permanently redirect response
      return Response.redirect(url, 301);
    }

    // If no route matches, set error code to 404
    if (!routes) {
      return await renderErrorPage(404);
    }

    // === PREPARE FOR ACTIONS / LOADERS ===

    // All params in routes
    const params = extractParams(routes);
    const event = { req, headers, params: new Map(params) };

    // === handle action ===
    // if actions exists and method is POST then we try to execute it.
    if (req.method === "POST") {
      const actionRef = url.searchParams.get("saction");
      const hasAction = actionRef &&
        routes.some(({ module }) => module.actions.includes(actionRef));

      // render 405 page if actions does not exist
      if (!hasAction) {
        headers.set("Allow", "GET");
        return await renderErrorPage(405);
      }

      // run action
      const action = await runAction(routes, event, actionRef);
      if (isFetchData) {
        const loaders = await runLoaders(routes, event);
        const outlets = extractIndexOutlets(routes);
        const data = { params, loaders, outlets };

        return Response.json(
          { ok: "success", action, data } satisfies ServerDataResponse,
          { headers },
        );
      }

      // otherwise we just ignore the result
    }

    const loaders = await runLoaders(routes, event);
    const outlets = extractIndexOutlets(routes);
    const data = { params, loaders, outlets };
    if (isFetchData) {
      return Response.json(
        { ok: "data", data } satisfies ServerDataResponse,
        { headers },
      );
    }

    return renderPage(data);
  };
}
