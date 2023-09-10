import { Form } from "slow";
import { useRandomAction } from "./action.tsx";
import { useRandomLoader } from "./loader.tsx";

export default function () {
  const randomAction = useRandomAction();
  const randomLoader = useRandomLoader();

  return (
    <article>
      <h1 class="text-2xl font-bold">Welcome to Slow City</h1>

      <p>
        Slow City is a Lightweight Meta-framework for{" "}
        <a href="https://preactjs.com/" class="underline">Preact</a> and{" "}
        <a href="https://deno.com/" class="underline">Deno</a>
      </p>

      <p>Loader: {randomLoader}</p>
      <p>Action Data: {randomAction.data}</p>
      <p>Action isRunning: {randomAction.isRunning.value ? "Yes" : "No"}</p>

      <Form action={randomAction}>
        <button>Fresh</button>
      </Form>
    </article>
  );
}
