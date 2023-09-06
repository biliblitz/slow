import { ComponentChildren } from "preact";
import { useManager } from "./manager/index.ts";
import { OutletContext } from "./outlet.tsx";

export function SlowCityProvider(props: { children?: ComponentChildren }) {
  const manager = useManager();
  const tree = manager.getCurrentRenderTree();

  return (
    <OutletContext.Provider value={tree}>
      <html>{props.children}</html>
    </OutletContext.Provider>
  );
}
