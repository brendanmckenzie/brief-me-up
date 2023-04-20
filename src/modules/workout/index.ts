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
          // "Output will be in JSON format, there should be 3 fields: `warmup`, `strength`, `workout`",
          "You produce output in the Markdown format with headings starting at level 3 and start the response immediately with no transition.",
      },
      {
        role: "user",
        content:
          "Could you please generate a workout for my day today based on the following schedule - include a detailed warmup with stretches, strength component and a metcon",
      },
      {
        role: "user",
        content: "The metcon should compliment the strength component.",
      },
      {
        role: "user",
        content: [
          "Monday - cleans",
          "Tuesday - squats",
          "Wednesday - gymnastics (handstands/muscle ups/rings/bars/etc)",
          "Thursday - snatches",
          "Friday - deadlift and bench press",
          "Saturday - long-form chipper workout.",
        ].join("; "),
      },
      {
        role: "user",
        content: [
          "Today is",
          new Date().toLocaleDateString("en-AU", {
            weekday: "long",
          }),
        ].join(" "),
      },
    ],
  });

  return { body: response.data.choices[0].message?.content ?? "" };
};
