import { Configuration, OpenAIApi } from "openai";
import { ModuleHandler } from "..";
import { Config } from "../../config";

export const handler: ModuleHandler = async (config: Config) => {
  const client = new OpenAIApi(
    new Configuration({ apiKey: config.OPENAI_API_KEY })
  );

  const response = await client.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that provides daily fun facts, excluding any preamble.",
      },
      {
        role: "system",
        content:
          "You produce output in the Markdown format and start the response immediately with no transition.",
      },
      {
        role: "user",
        content: [
          "Tell me a fact about something that happened on or around this day in history, today being.",
          "Today is",
          new Date().toLocaleDateString("en-AU", {
            weekday: "long",
            month: "long",
            day: "2-digit",
            year: "numeric",
          }),
        ].join(" "),
      },
    ],
  });

  return { body: response.data.choices[0].message?.content ?? "" };
};
