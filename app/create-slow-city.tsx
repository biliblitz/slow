import { VNode } from "preact";
import { render as renderToString } from "preact-render-to-string";

import {
  ActionReference,
  ComponentReference,
  LoaderReference,
} from "./utils.ts";
import { fixPathname, isValidPathname, matchRoutes } from "./route.ts";
import { ManagerContext } from "./manager/index.ts";
import { createServerManager } from "./manager/server.ts";
import { Project } from "./build.ts";

export function createSlowCity(root: VNode) {
  return (project: Project) => {
    return async (req: Request) => {
      const url = new URL(req.url);

      let pathname = url.pathname;
      const isFetchData = pathname.endsWith("/s-data.json");
      if (isFetchData) pathname = pathname.slice(0, -11);

      // fix pathname if request can be valid after fix
      if (!isValidPathname(pathname)) {
        pathname = fixPathname(pathname);
        // if fixed path could match any existing route
        const matches = matchRoutes(project.root, pathname);
        if (matches) {
          // then redirect to fixed path
          url.pathname = pathname;
          if (isFetchData) url.pathname += "s-data.json";
          return Response.redirect(url.href);
        } else {
          // otherwise return 404 page
          return new Response(null, { status: 404 });
        }
      }

      const routes = matchRoutes(project.root, pathname);
      if (!routes) {
        return new Response(null, { status: 404 });
      }

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
            return new Response(null, { status: 404 });
          }

          // check if method is allowed
          const action = project.dictionary.action.get(actionRef)!;
          if (req.method !== action.method) {
            return new Response(null, {
              status: 405,
              headers: { allow: action.method },
            });
          }

          // run action
          for (const route of routes) {
            if (route.module.middleware) {
              const middleware = project.dictionary.middlewares.get(
                route.module.middleware
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
          return new Response(null, { status: 405, headers: { allow: "GET" } });
        }

        // run loaders
        for (const route of routes) {
          // apply middleware
          if (route.module.middleware) {
            const middleware = project.dictionary.middlewares.get(
              route.module.middleware
            )!;
            await middleware(req);
          }
          // run all loader parallel
          const results = await Promise.all(
            route.module.loaders.map(async (ref) => {
              const loader = project.dictionary.loader.get(ref)!;
              const result = await loader.func(req);
              return [ref, result] as const;
            })
          );
          loaderResults.push(...results);
        }
      } catch (e) {
        // === handle throws in middleware/action/loader ===

        // if throw Response, we just return it as is.
        if (e instanceof Response) {
          return e;
        }
        // if throw URL, we return redirect data or redirect directly.
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

      // if just fetch data, we can return now
      if (isFetchData) {
        return Response.json({
          ok: "data",
          actions: actionResults,
          loaders: loaderResults,
        });
      }

      const tree: ComponentReference[] = [];
      for (const route of routes) {
        if (route.module.layout) {
          tree.push(route.module.layout);
        }
      }
      tree.push(routes.at(-1)!.module.index!);

      const manager = createServerManager({
        actions: new Map(actionResults),
        loaders: new Map(loaderResults),
        imports: project.dictionary.componentImports,
        entrance: project.entrance,
        buildGraph: project.buildGraph,
      });

      const html = renderToString(
        <ManagerContext.Provider value={manager}>
          {root}
        </ManagerContext.Provider>
      );

      return new Response("<!DOCTYPE html>" + html, {
        headers: {
          "content-type": "text/html",
        },
      });
    };
  };
}
