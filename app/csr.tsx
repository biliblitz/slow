import { render } from "preact";
import { Project } from "./utils.ts";
import { App } from "./render.tsx";

export function createApp(project: Project) {
  const url = new URL(location.href);

  render(<App initial={{ project, url }}></App>, document);
}
