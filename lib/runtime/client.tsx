import {
  ComponentChildren,
  ComponentType,
  useRef,
  useSignal,
} from "../../deps.ts";
import { useManifest } from "../manifest/context.tsx";
import { LoaderStore } from "../utils/api.ts";
import { RuntimeContext } from "./context.ts";

export type Runtime = {
  importComponent(index: number): void;
  importComponents(indexes: number[]): void;
  getComponent(index: number): ComponentType;
  getComponents(indexes: number[]): ComponentType[];
  updateLoaderStore(store: LoaderStore): void;
};

type RuntimeProviderProps = {
  components: ComponentType[];
  loaders: LoaderStore;
  children?: ComponentChildren;
};

export function RuntimeProvider(props: RuntimeProviderProps) {
  const manifest = useManifest();
  const components = useRef(props.components);
  const loaders = useSignal(props.loaders);

  function updateLoaderStore(store: LoaderStore) {
    loaders.value = store;
  }

  return (
    <RuntimeContext.Provider
      value={{
        updateLoaderStore,
      }}
    >
      {props.children}
    </RuntimeContext.Provider>
  );
}
