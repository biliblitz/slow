import { ActionReturnType } from "../hooks/action.ts";
import { LoaderReturnType } from "../hooks/loader.ts";

export type LoaderStore = [string, LoaderReturnType][];

export type ServerResponseData = {
  ok: "data";
  store: LoaderStore;
  action?: ActionReturnType;
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
