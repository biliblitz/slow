import { ComponentChildren } from "preact";

export function SlowCityProvider(props: { children?: ComponentChildren }) {
  return <html>{props.children}</html>;
}
