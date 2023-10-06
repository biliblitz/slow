import { JSX } from "../../deps.ts";
import { useManifest } from "../manifest/context.tsx";
import { RouterProvider } from "./router.tsx";

export function SlowCityProvider(
  props: JSX.HTMLAttributes<HTMLHtmlElement>,
) {
  const manifest = useManifest();

  return (
    <RouterProvider>
      <html {...props} />
    </RouterProvider>
  );
}
