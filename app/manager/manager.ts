import { Project } from "../utils.ts";

export class Manager {
  project: Project;
  loaderData = new Map<string, any>();

  constructor(project: Project) {
    this.project = project;
  }

  setLoaderData(key: string, value: any) {
    this.loaderData.set(key, value);
  }

  getLoaderData(key: string) {
    return this.loaderData.get(key);
  }
}
