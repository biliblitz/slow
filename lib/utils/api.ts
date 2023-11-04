import { ActionReturnType } from "../hooks/action.ts";
import { LoaderReturnType } from "../hooks/loader.ts";

export type LoaderStore = [string, LoaderReturnType][];

export type ServerResponseRedirect = {
  ok: "redirect";
  redirect: string;
};

export type ServerResponseLoaderData = {
  ok: "loader-data";
  store: LoaderStore;
  components: number[];
};

export type ServerResponseActionData = {
  ok: "action-data";
  store: LoaderStore;
  action: ActionReturnType;
  components: number[];
};

export type ServerResponseLoaderError = {
  ok: "loader-error";
  status: number;
  message: string;
  store: LoaderStore;
  components: number[];
  stack?: string;
};

export type ServerResponseActionError = {
  ok: "action-error";
  status: number;
  message: string;
  stack?: string;
};

export type ServerResponseLoader =
  | ServerResponseRedirect
  | ServerResponseLoaderError
  | ServerResponseLoaderData;

export type ServerResponseAction =
  | ServerResponseRedirect
  | ServerResponseLoaderError
  | ServerResponseActionError
  | ServerResponseActionData;

export type ServerResponse = ServerResponseAction | ServerResponseLoader;

export function getStatus(response: ServerResponse) {
  if (response.ok === "action-data") return 200;
  if (response.ok === "loader-data") return 200;
  if (response.ok === "redirect") return 200;
  return response.status;
}
