import {
  ComponentChildren,
  createContext,
  ReadonlySignal,
  useContext,
  useSignal,
} from "../../deps.ts";
import { importComponents } from "../manager/client.ts";
import { useManager } from "../manager/index.ts";
import { ComponentReference, ServerDataResponse } from "../utils.ts";

type Router = {
  preloads: ReadonlySignal<ComponentReference[]>;
  outlets: ReadonlySignal<ComponentReference[]>;
  navigate(href: string): Promise<void>;
};

const RouterContext = createContext<Router | null>(null);

export function RouterProvider(props: { children?: ComponentChildren }) {
  const manager = useManager();

  const outlets = useSignal(manager.renderTree);
  const preloads = useSignal(manager.renderTree);

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
      preloads.value = data.renderTree;
      // import components
      await importComponents(manager, data.renderTree);

      // push history
      history.pushState({ url: location.href }, "", targetUrl);
      // update actions & loaders
      data.actions.forEach(([ref, value]) => manager.actions.set(ref, value));
      data.loaders.forEach(([ref, value]) => manager.loaders.set(ref, value));
      // start render whole page
      outlets.value = data.renderTree;
      // now everything is done
    } else if (data.ok === "redirect") {
      await navigate(data.redirect);
    }
  };

  const router = {
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
