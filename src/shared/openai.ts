import { Configuration, ConfigurationParameters, OpenAIApi } from "openai";

export const openai = (params: ConfigurationParameters) =>
  new OpenAIApi(new Configuration(params));
