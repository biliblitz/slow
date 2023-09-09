// deno-lint-ignore-file no-explicit-any
import {
  batch,
  ComponentChildren,
  createContext,
  ReadonlySignal,
  useComputed,
  useContext,
  useSignal,
} from "../../deps.ts";
import { importComponents } from "../manifest/client.ts";
import { useManifest } from "../manifest/index.ts";
import { ComponentReference, ServerDataResponse } from "../utils.ts";

type Navigate = (href: string) => Promise<void>;
type Router = {
  params: ReadonlySignal<ReadonlyMap<string, string>>;
  loaders: ReadonlySignal<ReadonlyMap<string, any>>;
  actions: ReadonlySignal<ReadonlyMap<string, any>>;
  outlets: ReadonlySignal<ComponentReference[]>;
  preloads: ReadonlySignal<ComponentReference[]>;
  navigate: Navigate;
};

const RouterContext = createContext<Router | null>(null);

export function RouterProvider(props: { children?: ComponentChildren }) {
  const manifest = useManifest();

  const outlets = useSignal(manifest.outlets);
  const preloads = useSignal(manifest.outlets);
  const params = useSignal(manifest.params);
  const loaders = useSignal(manifest.loaders);
  const actions = useSignal(manifest.actions);

  const navigate = async (href: string) => {
    // calculate target url
    const targetUrl = new URL(href, location.href);

    // if is the same page, then we don't need fetch any data
    if (targetUrl.pathname === location.pathname) {
      const targetAnchor = targetUrl.hash;
      const originAnchor = location.hash;

      // check if is hash update
      if (targetAnchor !== originAnchor && targetAnchor) {
        const targetElem = document.getElementById(targetAnchor.slice(1));
        targetElem?.scrollIntoView({ behavior: "smooth" });
        history.pushState({ url: location.href }, "", targetUrl);
        return;
      }

      // then there is nothing to do
      return;
    }

    // fix pathname for new target
    if (!targetUrl.pathname.endsWith("/")) {
      targetUrl.pathname += "/";
    }

    // fetch data
    const dataUrl = new URL(targetUrl);
    dataUrl.pathname += "s-data.json";
    // now sending request to dataUrl
    const response = await fetch(dataUrl);
    const data = await response.json() as ServerDataResponse;

    // if everything is ok
    if (data.ok === "data") {
      // start preload modules
      preloads.value = data.outlets;
      // import components
      await importComponents(manifest, data.outlets);
      // push history
      history.pushState({ url: location.href }, "", targetUrl);
      // start render whole page
      batch(() => {
        // update actions & loaders & params
        params.value = data.params;
        loaders.value = data.loaders;
        actions.value = data.actions;
        outlets.value = data.outlets;
      });
      // now everything is done
    } else if (data.ok === "redirect") {
      await navigate(data.redirect);
    }
  };

  const router = {
    params: useComputed(() => new Map(params.value)),
    loaders: useComputed(() => new Map(loaders.value)),
    actions: useComputed(() => new Map(actions.value)),
    outlets,
    preloads,
    navigate,
  } satisfies Router;

  return (
    <RouterContext.Provider value={router}>
      {props.children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error("Please nest your project inside <SlowCityProvider />");
  }
  return router;
}

export function useNavigate() {
  return useRouter().navigate;
}
