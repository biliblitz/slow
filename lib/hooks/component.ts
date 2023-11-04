// deno-lint-ignore-file ban-types
import { ComponentChildren, ComponentType } from "preact";

export type LayoutBasicProps = {
  children?: ComponentChildren;
};

export function layout$<T = {}>(
  component: ComponentType<T & LayoutBasicProps>,
) {
  return component;
}

export function index$<T = {}>(component: ComponentType<T>) {
  return component;
}

export function error$<T = {}>(component: ComponentType<T>) {
  return component;
}
