export type ModuleResponse = {
  body: string;
};
export type ModuleHandler = () => Promise<ModuleResponse>;
