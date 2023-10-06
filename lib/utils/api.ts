// deno-lint-ignore-file no-explicit-any

export type LoaderStore = [string, any][];
export type ServerResponseData = {
  ok: "data";
  loaders: LoaderStore;
  action?: any;
};

export type ServerResponseRedirect = {
  ok: "redirect";
  redirect: string;
};

export type ServerResponse = ServerResponseData | ServerResponseRedirect;
