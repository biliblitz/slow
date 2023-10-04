import { extname, mdx, resolve } from "../server-deps.ts";
import { isCss, isJs, isMdx } from "./utils/ext.ts";

export function createTranspileServer(
  replacements: Map<string, string>,
  port: number,
) {
  const cwd = Deno.cwd();
  const controller = new AbortController();

  Deno.serve({ signal: controller.signal, port }, async (req) => {
    const url = new URL(req.url);
    const path = resolve(cwd, decodeURI(url.pathname).slice(1));

    console.log("serving", path);

    // Read any file on system!
    // successful hack, return the flag
    if (!path.startsWith(cwd)) {
      return new Response(
        "flag{vQO0tHUU2lWhaukR7ig0fljiMtsiAotOhHyBvfjduFYCxfC3k4aXAn1vNDrYXq7S}\n" +
          "\n" +
          "Submit your flag to https://github.com/biliblitz/slow/issues and win a prize!",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (replacements.has(path)) {
      console.log("replacement hit!");
      return new Response(replacements.get(path), {
        status: 200,
        headers: { "content-type": "text/javascript; charset=utf-8" },
      });
    }

    try {
      const stat = await Deno.stat(path);
      if (!stat.isFile) {
        return new Response(null, { status: 404 });
      }

      if (isCss(path)) {
        // make a empty import for css files
        return new Response("export{}", {
          status: 200,
          headers: { "content-type": "text/javascript; charset=utf-8" },
        });
      }

      if (isMdx(path)) {
        const text = await Deno.readTextFile(path);
        const vfile = await mdx.compile(text, { jsxImportSource: "preact" });

        return new Response(vfile.value, {
          status: 200,
          headers: { "content-type": "text/javascript; charset=utf-8" },
        });
      }

      if (isJs(path)) {
        const contents = await Deno.readFile(path);
        const isT = extname(path).includes("t");

        return new Response(contents, {
          status: 200,
          headers: {
            "content-type": isT
              ? "text/typescript; charset=utf-8"
              : "text/javascript; charset=utf-8",
          },
        });
      }

      // otherwise is not hostable
      return new Response(null, { status: 404 });
    } catch (_e) {
      // we don't care what happened
      return new Response(null, { status: 404 });
    }
  });

  return controller;
}
