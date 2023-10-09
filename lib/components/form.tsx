import { JSX } from "../../deps.ts";
import { ActionReturnType, ActionState } from "../hooks/action.ts";

type FormProps<T extends ActionReturnType> =
  & Omit<JSX.HTMLAttributes<HTMLFormElement>, "action">
  & { action: ActionState<T> };

export function Form<T extends ActionReturnType>(props: FormProps<T>) {
  const { action, ...remains } = props;

  return (
    <form
      action={`?saction=${props.action.ref}`}
      method="POST"
      onSubmit={(e) => {
        e.preventDefault();
        action.submit(new FormData(e.currentTarget));
      }}
      {...remains}
    />
  );
}
