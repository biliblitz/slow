import render from "preact-render-to-string";
import { Project } from "./utils.ts";
import { App } from "./render.tsx";

export async function createSSRApp(project: Project, request: Request) {
  const RootComponent = (await import(project.root.layout)).default;
  const url = new URL(request.url);

  return render(
    <App initial={{ project, url }}>
      <RootComponent />
    </App>
  );
}
