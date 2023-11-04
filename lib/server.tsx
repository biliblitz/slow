import { VNode } from "preact";
import { extname, typeByExtension } from "../deps.ts";
import { BlitzCity } from "./build-common.ts";
import { ManifestProvider } from "./manifest/context.tsx";
import { createServerManifest } from "./manifest/server.ts";
import {
  LoaderStore,
  ServerResponse,
  ServerResponseAction,
  ServerResponseActionData,
  ServerResponseActionError,
  ServerResponseLoader,
  ServerResponseLoaderData,
  ServerResponseRedirect,
  getStatus,
} from "./utils/api.ts";
import { matchEntries } from "./utils/entry.ts";
import { renderToString } from "preact-render-to-string";
import { Directory } from "./scan.ts";
import { RequestEvent } from "./hooks/mod.ts";
import { ActionReturnType } from "./hooks/action.ts";

const LOGO = `
 ____  _                ____ _ _         
/ ___|| | _____      __/ ___(_) |_ _   _ 
\\___ \\| |/ _ \\ \\ /\\ / / |   | | __| | | |
 ___) | | (_) \\ V  V /| |___| | |_| |_| |
|____/|_|\\___/ \\_/\\_/  \\____|_|\\__|\\__, |
                                   |___/ 
`;

async function runActions<T extends ActionReturnType>(
  action: () => Promise<T>,
  loader: () => Promise<ServerResponseLoader>
): Promise<ServerResponseAction> {
  try {
    const data = await action();
    const result = await loader();
    if (result.ok === "loader-data") {
      return {
        ok: "action-data",
        action: data,
        store: result.store,
        components: result.components,
      };
    } else {
      return result;
    }
  } catch (e) {
    if (e instanceof URL) {
      return { ok: "redirect", redirect: e.href };
    }
    if (e instanceof Response) {
      return {
        ok: "action-error",
        status: e.status,
        message: await e.text(),
      };
    }
    if (e instanceof Error) {
      return {
        ok: "action-error",
        status: 500,
        message: e.message,
        stack: e.stack,
      };
    }
    return {
      ok: "action-error",
      status: 500,
      message: String(e),
    };
  }
}

export function createBlitzCity(city: BlitzCity, vnode: VNode) {
  console.log(LOGO);

  async function runLoaders(
    event: RequestEvent,
    directories: number[]
  ): Promise<ServerResponseLoader> {
    const store: LoaderStore = [];
    const components: number[] = [];

    let stagedStore: LoaderStore = [];
    let stagedComponents: number[] = [];
    let fallbackErrorComponent: number | null = null;

    for (const index of directories) {
      const dir = city.project.directories[index];

      try {
        // run middleware if exists
        if (dir.middleware !== null) {
          await city.middlewares[dir.middleware](event);
        }

        // run loaders if has
        const loaders = dir.loaders.flatMap((index) => city.loaders[index]);
        for (const loader of loaders) {
          stagedStore.push([loader.ref, await loader.func(event)]);
        }

        // append layout to staged
        if (dir.layout !== null) {
          stagedComponents.push(dir.layout);
        }

        // if error exists, we have commit staged stores and components
        if (dir.error !== null) {
          store.push(...stagedStore);
          components.push(...stagedComponents);
          stagedStore = [];
          stagedComponents = [];
          fallbackErrorComponent = dir.error;
        }
      } catch (e) {
        if (!fallbackErrorComponent) {
          throw new Error("TODO: FallbackErrorComponent not found");
        }

        // add the error component
        components.push(fallbackErrorComponent);

        if (e instanceof URL) {
          return { ok: "redirect", redirect: e.href };
        }
        if (e instanceof Response) {
          return {
            ok: "loader-error",
            status: e.status,
            message: await e.text(),
            store,
            components,
          };
        }
        if (e instanceof Error) {
          return {
            ok: "loader-error",
            status: 500,
            message: e.message,
            stack: e.stack,
            store,
            components,
          };
        }
        return {
          ok: "loader-error",
          status: 500,
          message: String(e) || "Internal Error",
          store,
          components,
        };
      }
    }

    // add finishing stages
    store.push(...stagedStore);
    components.push(...stagedComponents);

    return { ok: "loader-data", store, components };
  }

  function createRequestEvent(
    req: Request,
    params: string[],
    headers: Headers
  ) {
    return { req, params, headers };
  }

  return async (req: Request) => {
    const url = new URL(req.url);
    let pathname = url.pathname;

    if (pathname.startsWith("/build/")) {
      const assetName = pathname.slice(1);
      const index = city.assets.assetNames.indexOf(assetName);
      console.log(assetName, index);
      if (index > -1) {
        const assetBuffer = city.assets.assetBuffers[index];
        const mimeType =
          typeByExtension(extname(assetName)) || "application/octet-stream";
        const headers = new Headers();
        headers.set("content-type", mimeType);
        headers.set("cache-control", "max-age=31536000");
        return new Response(assetBuffer, { headers });
      }
    }

    // remove tailing s-data.json if exist
    let isDataRequest = false;
    if (pathname.endsWith("/s-data.json")) {
      isDataRequest = true;
      pathname = pathname.slice(0, -11);
    }

    // try match index
    const match = matchEntries(city.project.entires, pathname);
    if (match) {
      const headers = new Headers();

      const render = (response: ServerResponse, isFetch: boolean) => {
        if (isFetch) {
          return Response.json(response, {
            status: getStatus(response),
            headers,
          });
        }

        if (response.ok === "action-error") {
          return new Response(response.message, {
            status: response.status,
            headers,
          });
        }

        if (response.ok === "redirect") {
          headers.set("location", response.redirect);
          return new Response(null, { status: 302, headers });
        }

        const status =
          response.ok === "loader-data" || response.ok === "action-data"
            ? 200
            : response.status;

        const manifest = createServerManifest(
          city,
          match.params,
          response.store,
          response.components
        );
        const html = renderToString(
          <ManifestProvider manifest={manifest}>{vnode}</ManifestProvider>
        );
        headers.set("content-type", "text/html");
        return new Response("<!DOCTYPE html>" + html, { status, headers });
      };

      // redirect if not ending with slash
      if (!pathname.endsWith("/")) {
        url.pathname = pathname + "/";
        headers.set("location", url.href);
        return new Response(null, { status: 301, headers });
      }

      const entry = city.project.entires[match.index];
      const event = createRequestEvent(req, entry.params, headers);

      // try execute action
      if (req.method === "POST") {
        const actionRef = url.searchParams.get("saction");
        const foundAction = city.actionMap.get(actionRef || "");
        // TODO: make it fails better
        if (!foundAction) return new Response(null, { status: 400 });

        const actionResponse = await runActions(
          async () => {
            // TODO: run middlewares for action
            return await foundAction.func(event);
          },
          () => runLoaders(event, entry.directories)
        );

        return render(actionResponse, isDataRequest);
      }

      const loaderResponse = await runLoaders(event, entry.directories);
      return render(loaderResponse, isDataRequest);
    }

    return new Response(null, { status: 404 });
  };
}
