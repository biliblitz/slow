import { Project } from "../utils.ts";
import { Manager } from "./manager.ts";

/** server side manager */
export class ServerManager extends Manager {
  constructor(project: Project, url: URL) {
    super(project, url);
  }
}
