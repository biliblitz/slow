export type ActionResponse<T> = T | Promise<T>;
export type ActionFunction<T> = (req: Request) => ActionResponse<T>;
export type ActionResult<R> = {
  data?: R | null;
};
export type Action<T = {}> = {
  ref: string;
  method: string;
  func: ActionFunction<T>;
};

export function action$<T = {}>(action: ActionFunction<T>): Action<T> {
  return { ref: "", method: "POST", func: action };
}

export function delete$<T = {}>(action: ActionFunction<T>): Action<T> {
  return { ref: "", method: "DELETE", func: action };
}

export function put$<T = {}>(action: ActionFunction<T>): Action<T> {
  return { ref: "", method: "PUT", func: action };
}

export function patch$<T = {}>(action: ActionFunction<T>): Action<T> {
  return { ref: "", method: "PATCH", func: action };
}
