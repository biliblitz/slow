import { ManagerContext, useServerManager } from "./manager/index.ts";
import { OutletContext } from "./outlet.tsx";
import { createClientManager } from "./manager/client.ts";
import { JSX as JSXInternal } from "preact";

export function SlowCityProvider(
  props: JSXInternal.HTMLAttributes<HTMLHtmlElement>,
) {
  const serverManager = useServerManager();
  const manager = serverManager || createClientManager();

  return (
    <ManagerContext.Provider value={manager}>
      <OutletContext.Provider value={[]}>
        <html {...props} />
      </OutletContext.Provider>
    </ManagerContext.Provider>
  );
}
