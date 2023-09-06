import { Project } from "../utils.ts";

export class Manager {
  project: Project;
  url: URL;
  loaderData = new Map<string, any>();
  actionData = new Map<string, any>();

  constructor(project: Project, url: URL) {
    this.project = project;
    this.url = url;
  }

  setLoaderData(key: string, value: any) {
    this.loaderData.set(key, value);
  }

  getLoaderData(key: string) {
    return this.loaderData.get(key);
  }

  setActionData(key: string, value: any) {
    this.actionData.set(key, value);
  }

  getActionData(key: string) {
    return this.actionData.get(key);
  }
}
