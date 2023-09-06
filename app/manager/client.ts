import { Project } from "../utils.ts";
import { Manager } from "./manager.ts";

/** client controller */
export class ClientManager extends Manager {
  constructor(project: Project, url: URL) {
    super(project, url);
  }

  navigate(target: string) {
    const url = new URL(target, this.url);
    // TODO: resolve url
  }
}
