import { ComponentChildren } from "preact";
import { useInitialContext } from "./hooks.ts";

export function SlowProvider(props: { children?: ComponentChildren }) {
  const context = useInitialContext();

  return <html>{props.children}</html>;
}
