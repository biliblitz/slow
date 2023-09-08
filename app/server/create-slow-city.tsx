import { extname, renderToString, typeByExtension } from "../../server-deps.ts";
import { VNode } from "../../deps.ts";

import {
  ActionReference,
  ComponentReference,
  LoaderReference,
} from "../utils.ts";
import { matchRoutes } from "../route.ts";
import { ManagerContext } from "../manager/index.ts";
import { createServerManager } from "../manager/server.ts";
import { Project } from "./build.ts";

export function createSlowCity(root: VNode, project: Project) {
  return async (req: Request) => {
    const url = new URL(req.url);

    // if is fetch assets
    if (url.pathname.startsWith("/build/")) {
      const assetName = url.pathname.slice(1);
      const contents = project.buildAssets.get(assetName);
      if (contents) {
        const mime = typeByExtension(extname(assetName)) ||
          "application/octet-stream";

        return new Response(contents, {
          headers: {
            "content-type": mime,
            "cache-control": "max-age=604800",
          },
        });
      }
    }

    // We must return a valid html page
    let pathname = url.pathname;
    // Remove 's-data.json' if request for data
    const isFetchData = pathname.endsWith("/s-data.json");
    if (isFetchData) pathname = pathname.slice(0, -11);
    // Add the final slash if missing
    const missingFinalSlash = !pathname.endsWith("/");
    if (missingFinalSlash) pathname += "/";

    // Try to match routes with fixed pathname
    const routes = matchRoutes(project.root, pathname);
    // If no route matches, return 404 page
    if (!routes) {
      // TODO: render 404 page here
      return new Response(null, { status: 404 });
    }

    // Otherwise redirect with final slash
    if (missingFinalSlash) {
      // In this case, `isFetchData` will always be false
      // We modify url to preserve searchParams, etc.
      url.pathname = pathname;
      return Response.redirect(url);
    }

    // now we start to run actions/loaders
    const actionResults: (readonly [ActionReference, unknown])[] = [];
    const loaderResults: (readonly [LoaderReference, unknown])[] = [];

    try {
      const actionRef = url.searchParams.get("saction");

      // === handle action ===
      if (actionRef) {
        // if action does not exist in routes
        if (
          !routes.some(({ module }) => module.actions.includes(actionRef))
        ) {
          // TODO: render 404 page if not fetch data
          return new Response(null, { status: 404 });
        }

        // check if method is allowed
        const action = project.dictionary.action.get(actionRef)!;
        if (req.method !== action.method) {
          // TODO: render 405 page if not fetch data (?)
          return new Response(null, {
            status: 405,
            headers: { allow: action.method },
          });
        }

        // run action
        for (const route of routes) {
          if (route.module.middleware) {
            const middleware = project.dictionary.middlewares.get(
              route.module.middleware,
            )!;
            await middleware(req);
          }
          if (route.module.actions.includes(actionRef)) {
            actionResults.push([actionRef, await action.func(req)]);
            break;
          }
        }
      }

      // === handle loaders ===
      // if without action the method must be GET
      if (!actionRef && req.method !== "GET") {
        // TODO: render 405 page if not fetch data (?)
        return new Response(null, { status: 405, headers: { allow: "GET" } });
      }

      // run loaders
      for (const route of routes) {
        // apply middleware
        if (route.module.middleware) {
          const middleware = project.dictionary.middlewares.get(
            route.module.middleware,
          )!;
          await middleware(req);
        }
        // run all loader parallel
        const results = await Promise.all(
          route.module.loaders.map(async (ref) => {
            const loader = project.dictionary.loader.get(ref)!;
            const result = await loader.func(req);
            return [ref, result] as const;
          }),
        );
        loaderResults.push(...results);
      }
    } catch (e) {
      // === handle throws in middleware/action/loader ===

      // If throw Response, we just return it as is.
      if (e instanceof Response) {
        return e;
      }
      // If throw URL, we return redirect data or redirect directly.
      if (e instanceof URL) {
        return isFetchData
          ? Response.json({
            ok: "redirect",
            redirect: e.href,
          })
          : Response.redirect(e);
      }
      // otherwise it's a internal error
      console.error(e);
      return new Response(null, { status: 500 });
    }

    // otherwise we not start render pages
    const renderTree: ComponentReference[] = [];
    for (const route of routes) {
      if (route.module.layout) {
        renderTree.push(route.module.layout);
      }
    }
    renderTree.push(routes.at(-1)!.module.index!);

    // if just fetch data, we can return now
    if (isFetchData) {
      return Response.json({
        ok: "data",
        actions: actionResults,
        loaders: loaderResults,
        renderTree,
      });
    }

    const manager = createServerManager({
      actions: new Map(actionResults),
      loaders: new Map(loaderResults),
      imports: project.dictionary.componentImports,
      entrance: project.entrance,
      buildGraph: project.buildGraph,
      renderTree,
      components: project.dictionary.components,
    });

    const html = renderToString(
      <ManagerContext.Provider value={manager}>
        {root}
      </ManagerContext.Provider>,
    );

    return new Response("<!DOCTYPE html>" + html, {
      headers: {
        "content-type": "text/html",
      },
    });
  };
}
