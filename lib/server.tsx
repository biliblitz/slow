// deno-lint-ignore-file no-explicit-any
import { extname, renderToString, typeByExtension } from "../server-deps.ts";
import { VNode } from "../deps.ts";

import {
  ActionReference,
  ComponentReference,
  LoaderReference,
  ServerDataResponse,
} from "./utils.ts";
import { matchRoutes } from "./route.ts";
import { ManifestContext } from "./manifest/index.ts";
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
      // make a permanently redirect response
      return Response.redirect(url, 301);
    }

    // get all params
    const params = routes
      .filter((route) => route.param)
      .map((route) => route.param!);

    // now we start to run actions/loaders
    const actions: [ActionReference, any][] = [];
    const loaders: [LoaderReference, any][] = [];
    const event: RequestEvent = {
      req,
      params: new Map(params),
      headers: new Headers(),
    };

    try {
      // Reject all non-POST and non-GET requests
      if (req.method !== "POST" && req.method !== "GET") {
        return new Response(null, {
          status: 405,
          headers: { allow: "GET, POST" },
        });
      }

      // === handle action ===
      // if actions exists and method is POST then we try to execute it.
      if (req.method === "POST") {
        const actionRef = url.searchParams.get("saction");
        const hasAction = actionRef &&
          routes.some(({ module }) => module.actions.includes(actionRef));

        // render 405 page if actions does not exist
        if (!hasAction) {
          return new Response(null, { status: 405, headers: { allow: "GET" } });
        }

        const action = project.dictionary.action.get(actionRef)!;
        // run action
        for (const route of routes) {
          if (route.module.middleware) {
            const middleware = project.dictionary.middlewares
              .get(route.module.middleware)!;
            await middleware(event);
          }
          if (route.module.actions.includes(actionRef)) {
            actions.push([actionRef, await action.__func(event)]);
            break;
          }
        }
      }

      // === handle loaders ===
      // run loaders
      for (const route of routes) {
        // apply middleware
        if (route.module.middleware) {
          const middleware = project.dictionary.middlewares
            .get(route.module.middleware)!;
          await middleware(event);
        }
        // run all loader parallel
        const results = await Promise.all(
          route.module.loaders.map(async (ref) => {
            const loader = project.dictionary.loader.get(ref)!;
            const result = await loader.__func(event);
            return [ref, result] as [string, any];
          }),
        );
        loaders.push(...results);
      }
    } catch (e) {
      // === handle throws in middleware/action/loader ===

      // If throw Response, we just return it as is.
      if (e instanceof Response) {
        // TODO: pass existing header?
        return e;
      }
      // If throw URL, we return redirect data or redirect directly.
      if (e instanceof URL) {
        if (isFetchData) {
          // we make client to redirect
          return Response.json(
            { ok: "redirect", redirect: e.href } satisfies ServerDataResponse,
            { headers: event.headers },
          );
        } else {
          event.headers.set("Location", e.href);
          return new Response(null, { status: 302, headers: event.headers });
        }
      }
      // Otherwise it's a internal error
      console.error(e);
      return new Response(null, { status: 500 });
    }

    // If loaders & actions are done, we can start render pages
    // Firstly, get all components we need to render
    const outlets: ComponentReference[] = [];
    for (const route of routes) {
      if (route.module.layout) {
        outlets.push(route.module.layout);
      }
    }
    outlets.push(routes.at(-1)!.module.index!);

    // if just fetch data, we can return now
    if (isFetchData) {
      return Response.json(
        {
          ok: "data",
          data: { actions, loaders, outlets, params },
        } satisfies ServerDataResponse,
        { headers: event.headers },
      );
    }

    const manifest = createServerManifest({
      graph: project.buildGraph,
      params,
      outlets,
      actions,
      loaders,
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

    event.headers.set("content-type", "text/html");
    return new Response(
      "<!DOCTYPE html>" + html,
      { headers: event.headers },
    );
  };
}
