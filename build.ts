import { build } from "./app/build.ts";
// import { createSSRApp } from "./app/ssr.tsx";

const project = await build("./example");
console.dir(project, { depth: null });

// console.log(
//   "<!DOCTYPE html>" +
//     (await createSSRApp(
//       project,
//       new Request(new URL("http://localhost:8080/about"))
//     ))
// );
