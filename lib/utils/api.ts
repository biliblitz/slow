// deno-lint-ignore-file no-explicit-any

export type LoaderStore = [string, any][];
export type ServerResponseData = {
  ok: "data";
  store: LoaderStore;
  action?: any;
};

export type ServerResponseRedirect = {
  ok: "redirect";
  redirect: string;
};

export type ServerResponseError = {
  ok: "error";
  status: number;
  message: string;
};

export type ServerResponse =
  | ServerResponseData
  | ServerResponseRedirect
  | ServerResponseError;
