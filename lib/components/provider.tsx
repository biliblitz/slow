import { JSX } from "preact";
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
