import { Project } from "../utils.ts";
import { Manager } from "./manager.ts";

/** client controller */
export class ClientManager extends Manager {
  constructor(project: Project) {
    super(project);
  }

  navigate(target: string) {
    const url = new URL(target, location.href);
    // TODO: resolve url
  }
}
