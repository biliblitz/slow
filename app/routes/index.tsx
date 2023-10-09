import { Form } from "blitz";
import { useRandomAction } from "./action.tsx";
import { useRandomLoader } from "./loader.tsx";
import { useComputed } from "@preact/signals";

export default function () {
  const randomAction = useRandomAction();
  const randomLoader = useRandomLoader();

  const loader = useComputed(() => {
    console.log("/index.tsx loader computed invoke");
    return randomLoader.value;
  });

  return (
    <article>
      <h1 class="text-2xl font-bold">Welcome to Blitz City</h1>

      <p>
        Blitz City is a Lightweight Meta-framework for{" "}
        <a href="https://preactjs.com/" class="underline">Preact</a> and{" "}
        <a href="https://deno.com/" class="underline">Deno</a>
      </p>

      <p>Loader: {loader}</p>
      <p>Action Data: {randomAction.data}</p>
      <p>Action isRunning: {randomAction.isRunning.value ? "Yes" : "No"}</p>

      <Form action={randomAction}>
        <button>Fresh</button>
      </Form>
    </article>
  );
}
