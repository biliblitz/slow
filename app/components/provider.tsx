import { JSX, useEffect } from "../../deps.ts";
import { RouterProvider } from "./router.tsx";

export function SlowCityProvider(
  props: JSX.HTMLAttributes<HTMLHtmlElement>,
) {
  // register history.popState
  useEffect(() => {
    addEventListener("popstate", (e) => {
      // TODO: restore session here
      console.log(e);
    });
  }, []);

  return (
    <RouterProvider>
      <html {...props} />
    </RouterProvider>
  );
}
