import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { ModuleHandler } from "..";
import { Config } from "../../config";

const WordSchema = z.object({
  word: z.string(),
  definition: z.string(),
  etymology: z.string(),
});

export const handler: ModuleHandler = async (config: Config) => {
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  const response = await client.beta.messages.parse({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system:
      "You provide an interesting, unique word each day without any preamble. You speak Australian English.",
    messages: [
      {
        role: "user",
        content: `Today is ${today}. Generate a word of the day with a definition and etymology if appropriate.`,
      },
    ],
    output_format: betaZodOutputFormat(WordSchema),
  });

  const data = response.parsed_output;
  if (!data) {
    console.error("failed to parse word of the day");
    return { body: "failed to load word" };
  }

  const body = `## ${data.word}

**Definition:** ${data.definition}

**Etymology:** ${data.etymology}`;

  return { body };
};
