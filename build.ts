import { build } from "./app/build.ts";

const project = await build("./example");
// console.dir(project, { depth: null });
console.log("finished");

// const entry = (await import("./example/entry.server.tsx")).default(project);

// Deno.serve(entry);
