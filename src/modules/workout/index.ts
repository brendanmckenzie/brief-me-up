import { ModuleHandler } from "..";
import { openai } from "../../shared/openai";

export const handler: ModuleHandler = async () => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that provides daily workouts in the style of Crossfit, excluding any preamble.",
      },
      {
        role: "system",
        content:
          "You are produce output in the Markdown format with headings starting at level 3 and start the response immediately with no transition.",
      },
      {
        role: "user",
        content:
          "Could you please generate a workout for my day today - include a detailed warmup with stretches, strength component and a metcon.",
      },
    ],
  });

  return { body: response.data.choices[0].message?.content ?? "" };
};
