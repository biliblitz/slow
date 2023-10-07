import { JSX } from "../../deps.ts";
import { RouterProvider } from "./router.tsx";

export function BlitzCityProvider(
  props: JSX.HTMLAttributes<HTMLHtmlElement>,
) {
  return (
    <RouterProvider>
      <html {...props} />
    </RouterProvider>
  );
}
