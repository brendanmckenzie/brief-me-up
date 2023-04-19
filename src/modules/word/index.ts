import { ModuleHandler } from "..";
import { openai } from "../../shared/openai";

export const handler: ModuleHandler = async () => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that provides an interesting, unique word each day without any preable.",
      },
      {
        role: "system",
        content: "You produce output in the Markdown format.",
      },
      {
        role: "system",
        content: "Please start the response immediately with no transition.",
      },
      {
        role: "user",
        content:
          "Could you please generate a word of the day with a definition and etymology if appropriate.",
      },
    ],
  });

  return { body: response.data.choices[0].message?.content ?? "" };
};
