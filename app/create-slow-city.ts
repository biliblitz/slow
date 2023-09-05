import renderToString from "preact-render-to-string";

import { VNode } from "preact";
import { Project } from "./utils.ts";
import { fixPathname, isValidPathname, matchPageRoutes } from "./route.ts";

export function createSlowCity(root: VNode) {
  return (project: Project) => {
    return async (req: Request) => {
      const url = new URL(req.url);

      // fix pathname
      const pathname = url.pathname;
      if (!isValidPathname(pathname)) {
        url.pathname = fixPathname(pathname);
        return Response.redirect(url.href);
      }

      const routes = matchPageRoutes(project.root, pathname);

      if (!routes) {
        return new Response("404 not found", { status: 404 });
      }

      if (req.method === "POST") {
        // if is action request
        if (url.searchParams.has("_action")) {
          const nick = url.searchParams.get("_action");
          const action = nick && project.dictionary.action.get(nick);

          if (!action) {
            return new Response("Action not found", {
              status: 404,
            });
          }

          try {
            const result = await action.func(req);
            if (result instanceof Response) {
              return result;
            }
            if (result instanceof URL) {
              return Response.redirect(result, 302);
            }
            return Response.json(result);
          } catch (e) {
            console.error(e);
            return new Response("500 Internal Server Error", {
              status: 500,
            });
          }
        }
      }

      if (req.method === "GET" && url.searchParams.has("_data")) {
        // we didn't finish this yet
      }

      if (req.method === "GET") {
        const html = renderToString(root);
        return new Response("<!DOCTYPE html>" + html);
      }

      return new Response("");
    };
  };
}
