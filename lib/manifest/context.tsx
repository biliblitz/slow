import { ComponentChildren, createContext } from "preact";
import { useContextOrThrows } from "../utils/hooks.ts";
import { Manifest } from "./mod.ts";

export const ManifestContext = createContext<Manifest | null>(null);

type ManifestProviderProps = {
  manifest: Manifest;
  children?: ComponentChildren;
};

export function ManifestProvider(props: ManifestProviderProps) {
  return (
    <ManifestContext.Provider value={props.manifest}>
      {props.children}
    </ManifestContext.Provider>
  );
}

export function useManifest() {
  return useContextOrThrows(ManifestContext);
}
