import Anthropic from "@anthropic-ai/sdk";
import { ModuleHandler } from "..";
import { Config } from "../../config";

export const handler: ModuleHandler = async (config: Config) => {
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: [
      "You provide daily fun facts, excluding any preamble.",
      "Output in Markdown format and start the response immediately with no transition.",
      "Draw from world history broadly — Europe, Asia, Africa, the Americas, Oceania, the Middle East, etc.",
      "Avoid defaulting to United States history. American facts are fine occasionally, but should not dominate; prefer events from elsewhere in the world unless something genuinely globally significant happened on this date in the US.",
      "Vary the type of fact across science, culture, politics, exploration, art, sport, and everyday life — not just famous battles or political milestones.",
    ].join(" "),
    messages: [
      {
        role: "user",
        content: `Tell me a fact about something that happened on or around this day in history. Today is ${today}. Please pick something from outside the United States where reasonable.`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return { body: text };
};
