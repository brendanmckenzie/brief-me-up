import { ModuleHandler } from "..";
import { openai } from "../../shared/openai";

export const handler: ModuleHandler = async () => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that provides daily fun facts.",
      },
      {
        role: "system",
        content: "You are produce output in the Markdown format.",
      },
      {
        role: "user",
        content:
          "Tell me a fun historical fact, keep it light hearted, please.",
      },
    ],
  });

  return { body: response.data.choices[0].message?.content ?? "" };
};
