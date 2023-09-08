import {
  ComponentChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "../../deps.ts";
import { importComponents } from "../manager/client.ts";
import { useManager } from "../manager/index.ts";
import { ComponentReference, ServerDataResponse } from "../utils.ts";

type Router = {
  preloads: ComponentReference[];
  outlets: ComponentReference[];
  updateRouteAfterNavigate(
    data: Extract<ServerDataResponse, { ok: "data" }>,
  ): Promise<void>;
};

const RouterContext = createContext<Router | null>(null);

export function RouterProvider(props: { children?: ComponentChildren }) {
  const manager = useManager();
  const [outlets, setOutlets] = useState(manager.renderTree);
  const [preloads, setPreloads] = useState(manager.renderTree);
  const updateRouteAfterNavigate = useCallback(
    async (data: Extract<ServerDataResponse, { ok: "data" }>) => {
      // start preload modules
      setPreloads(data.renderTree);
      // import components
      await importComponents(manager, data.renderTree);
      // update actions
      for (const [ref, value] of data.actions) {
        manager.actions.set(ref, value);
      }
      // update loaders
      for (const [ref, value] of data.loaders) {
        manager.loaders.set(ref, value);
      }
      // start render whole page
      setOutlets(data.renderTree);
    },
    [],
  );
  const router = useMemo(() => {
    return { outlets, preloads, updateRouteAfterNavigate };
  }, [outlets, preloads, updateRouteAfterNavigate]);

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
