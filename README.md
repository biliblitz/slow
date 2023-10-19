# Blitz City

A full-stack framework for Deno.

Our target is to keep everything simple and stupid.

## Install

TODO

## Route

All route files should be put inside `app/routes` directory.

Routing is pretty simple, just look at those examples:

| directory           | URL Pathname Regex        | Description         |
| ------------------- | ------------------------- | ------------------- |
| `/index.tsx`        | `^/?$`                    |                     |
| `/(fake)/index.tsx` | `^/?$`                    |                     |
| `/foobar/index.tsx` | `^/foobar/?$`             |                     |
| `/[name]/index.tsx` | `^/([^/]+)/?$`            | Match one fragment  |
| `/[...]/index.tsx`  | `^/(.+)/?$`               | Match all fragments |
| `/中文/index.tsx`   | `^/%E4%B8%AD%E6%96%87/?$` | UTF-8 supported     |

### Layouts

Somethings you need to nest some pages inside a same frame, you can use layouts to do this.

> E.g. If you have `/(fake)/foobar/[name]/index.tsx`, Blitz will look at these files and try to nest you page inside them.
>
> - `app/routes/layout.tsx`
> - `app/routes/(fake)/layout.tsx`
> - `app/routes/(fake)/foobar/layout.tsx`
> - `app/routes/(fake)/foobar/[name]/layout.tsx`

### Loaders

Every `index.tsx` and `layout.tsx` may requires some backend-data to render. You can write those data-queries inside `loader.ts` inside same directory.

```ts
// loader.ts
import { loader$ } from "blitz";
import { kv } from "./db.ts";

export const useMyUsername = loader$<string>((event) => {
  const username = await kv.get(["username", "alice"]);
  return username.value;
});
```

```tsx
// index.tsx
import { index$ } from "blitz";
import { useMyUsername } from "./loader.ts";

export default index$(() => {
  // ReadonlySignal<string>
  const username = useMyUsername();

  return <div>My username is {username}</div>;
});
```

Furthermore, if you need to organize your loaders more elegantly, you can adding custom prefix to `.loader.ts`. such as `custom.loader.ts`, every file ending with `.loader.ts` will be regard as `loader.ts` as well.

You can only export `loader$` results in loader files, any other exports will trigger an error and stops Blitz from work.

### Actions

Sometimes you need to perform some action to data, such as login or register, which should be triggered as a Form submit. You can use action files to deal with form submissions when user triggers it.

```ts
// action.ts
import { action$ } from "blitz";
import { kv } from "./db.ts";

export const useLogin = action$(({ req }) => {
  const form = await req.formData();
  const username = form.get("username");
  const password = form.get("password");
  // check username and password...
  return { success: username === password };
});
```

```tsx
// index.tsx
import { Form } from "blitz";
import { useLogin } from "./action.ts";

export default index$(() => {
  const login = useLogin();

  return (
    <Form action={login}>
      <input type="text" name="username" />
      <input type="password" name="password" />
      <button type="submit">Log in</button>
    </Form>
  );
});
```

Custom prefix also works with actions, such as `custom.action.ts`.

### Middlewares

Sometimes you want to do some permission checks before user access any sub-route in a directory, and you are not willing to write the same thing in every loader functions, you can write these in middlewares.

Middlewares are files name with `middleware.ts`.

### Error Handling

In many cases you will have error thrown in loaders, actions and middlewares, such as 403 Permission Denied, or 404 Not Found. Even if you want to assert the whole request and redirect to another page.

The following table shows what you can do and what will happen if you throws during requests handing.

| throws   | Loader / Action / Middleware       |
| -------- | ---------------------------------- |
| URL      | 302                                |
| Response | Error Route (res.status, res.body) |
| Error    | Error Route (500, err.message)     |

Note what throwing an `Response` does not take over the whole request, it just used to provide error status and error messages.

### Error Pages

When request meets some unexpected (or expected) errors, Blitz will try to render error pages.

Error pages acts the same as index pages, but named as `error.tsx`.

You can use `useErrorStatus()` and `useErrorMessage()` to get informations.

```tsx
export default function () {
  const status = useErrorStatus();
  const message = useErrorMessage();

  return (
    <div className="text-red-500 font-bold">
      <p>Error: {status}</p>
      <p>{message}</p>
    </div>
  );
}
```
