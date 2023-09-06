import { ComponentChildren } from "preact";
import { OutletContext } from "./outlet.tsx";

export function SlowCityProvider(props: { children?: ComponentChildren }) {
  return (
    <OutletContext.Provider value={[]}>
      <html>{props.children}</html>
    </OutletContext.Provider>
  );
}
