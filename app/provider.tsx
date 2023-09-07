import { ComponentChildren } from "preact";
import { useManager } from "./manager/index.ts";
import { OutletContext } from "./outlet.tsx";

export function SlowCityProvider(props: { children?: ComponentChildren }) {
  const manager = useManager();

  return (
    <OutletContext.Provider value={[]}>
      <html>{props.children}</html>
    </OutletContext.Provider>
  );
}
