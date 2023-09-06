import renderToString from "preact-render-to-string";

import { VNode } from "preact";
import { ActionReference, LoaderReference, Project } from "./utils.ts";
import { fixPathname, isValidPathname, matchRoutes } from "./route.ts";
import { ManagerContext } from "./manager/index.ts";
import { ServerManager } from "./manager/server.ts";

export function createSlowCity(root: VNode) {
  return (project: Project) => {
    // function runAction(routes: MatchRoute[], actionRef: ActionReference) {
    //   const actionResults: (readonly [ActionReference, any])[] = [];
    //   const loaderResults: (readonly [LoaderReference, any])[] = [];

    //     // search action in routes
    //     const actionRoute = routes.find((route) =>
    //       route.module.actions.includes(actionRef)
    //     );
    //     if (!actionRoute) {
    //       return new Response("404 Action not Found", { status: 404 });
    //     }

    //     // check if method is allowed
    //     const action = project.dictionary.action.get(actionRef)!;
    //     if (action.method !== req.method) {
    //       const headers = new Headers();
    //       headers.set("Allow", action.method);
    //       return new Response("405 Method not Allowed", {
    //         status: 405,
    //         headers,
    //       });
    //     }

    //     // run action
    //     for (const route of routes) {
    //       if (route.module.middleware) {
    //         const middleware = await import(route.module.middleware);
    //         await middleware(req);
    //       }
    //       if (route.module.actions.includes(actionRef)) {
    //         actionResults.push([actionRef, await action.func(req)]);
    //         break;
    //       }
    //     }

    //     // get all loaders
    //     for (const route of routes) {
    //       // apply middleware
    //       if (route.module.middleware) {
    //         const middleware = await import(route.module.middleware);
    //         await middleware(req);
    //       }

    //       // run all loader parallel
    //       const results = await Promise.all(
    //         route.module.loaders.map(async (ref) => {
    //           const loader = project.dictionary.loader.get(ref)!;
    //           const result = await loader.func(req);
    //           return [ref, result] as const;
    //         })
    //       );
    //       loaderResults.push(...results);
    //   }
    //   // otherwise should be a normal get request
    //   else {
    //     // normal loader must be GET
    //     if (req.method !== "GET") {
    //       const headers = new Headers();
    //       headers.set("allow", "GET");
    //       return new Response("405 Method not Allowed", {
    //         status: 405,
    //         headers,
    //       });
    //     }

    //     // get all loaders
    //     for (const route of routes) {
    //       // apply middleware
    //       if (route.module.middleware) {
    //         const middleware = await import(route.module.middleware);
    //         await middleware(req);
    //       }

    //       // run all loader parallel
    //       const results = await Promise.all(
    //         route.module.loaders.map(async (ref) => {
    //           const loader = project.dictionary.loader.get(ref)!;
    //           const result = await loader.func(req);
    //           return [ref, result] as const;
    //         })
    //       );
    //       loaderResults.push(...results);
    //     }
    //   }
    // }

    return async (req: Request) => {
      const url = new URL(req.url);

      let pathname = url.pathname;
      const isFetchData = pathname.endsWith("/s-data.json");
      if (isFetchData) pathname = pathname.slice(0, -11);

      // fix pathname if is request a page
      if (!isValidPathname(pathname)) {
        url.pathname = fixPathname(pathname);
        if (isFetchData) url.pathname += "s-data.json";
        return Response.redirect(url.href);
      }

      const routes = matchRoutes(project.root, pathname);
      if (!routes) {
        return new Response(null, { status: 404 });
      }

      const actionResults: (readonly [ActionReference, any])[] = [];
      const loaderResults: (readonly [LoaderReference, any])[] = [];

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
              const middleware = await import(route.module.middleware);
              await middleware.default(req);
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
            const middleware = await import(route.module.middleware);
            await middleware.default(req);
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

      const manager = new ServerManager(project, url);
      for (const [key, value] of loaderResults) {
        manager.setLoaderData(key, value);
      }
      for (const [key, value] of actionResults) {
        manager.setActionData(key, value);
      }

      const html = renderToString(
        <ManagerContext.Provider value={manager}>
          {root}
        </ManagerContext.Provider>
      );
      return new Response("<!DOCTYPE html>" + html);
    };
  };
}
