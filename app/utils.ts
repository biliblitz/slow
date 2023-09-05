export type ModuleAction = {
  filepath: string;
  exports: string[];
};

export type ModuleLoader = {
  filepath: string;
  exports: string[];
};

export type RoutePath = string[];
export type Middlewares = string[];
export type Layouts = string[];

export type Module = {
  path: RoutePath;
  index: string | null;
  layouts: Layouts;
  actions: ModuleAction[];
  loaders: ModuleLoader[];
  middlewares: Middlewares;
};

export type Project = {
  rootpath: string;
  routes: Module[];
};
