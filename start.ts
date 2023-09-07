import { build } from "./app/build.ts";
import { serveDir } from "http/file_server";

console.log("[start] building...");
const project = await build("./example");
console.log("[start] finished.");

const entry = (await import("./example/entry.server.tsx")).default(project);

const server = Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/build/")) {
    return await serveDir(req, {
      fsRoot: project.buildDir,
      urlRoot: "build",
    });
  }
  return await entry(req);
});
await server.finished;
