import { handler as fact } from "./fact";
import { handler as news } from "./news";
import { handler as weather } from "./weather";
import { handler as word } from "./word";
import { handler as workout } from "./workout";

export type ModuleResponse = {
  body: string;
};
export type ModuleHandler = () => Promise<ModuleResponse>;

export type ModuleMap = { [key: string]: ModuleHandler };

export const modules: ModuleMap = {
  fact,
  workout,
  weather,
  news,
  word,
};
