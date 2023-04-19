import { ModuleHandler } from "..";
import { openai } from "../../shared/openai";

export const handler: ModuleHandler = async () => {
  const response = await openai.createChatCompletion({
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
        content: "Tell me a fun historical fact.",
      },
    ],
  });

  return { body: response.data.choices[0].message?.content ?? "" };
};
