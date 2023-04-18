import { handler as fact } from "./fact";
import { handler as workout } from "./workout";
import { handler as weather } from "./weather";

export type ModuleResponse = {
  body: string;
};
export type ModuleHandler = () => Promise<ModuleResponse>;

export type ModuleMap = { [key: string]: ModuleHandler };

export const modules: ModuleMap = {
  fact,
  workout,
  weather,
};
