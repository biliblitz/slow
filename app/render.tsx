import { ComponentChildren } from "preact";
import { InitialContext, SlowInitialContext } from "./hooks.ts";

export function App(props: {
  initial: InitialContext;
  children?: ComponentChildren;
}) {
  return (
    <SlowInitialContext.Provider value={props.initial}>
      {props.children}
    </SlowInitialContext.Provider>
  );
}
