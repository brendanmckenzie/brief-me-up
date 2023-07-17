import { OpenAIApi, Configuration } from "openai";
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
          "You are a helpful assistant that provides an interesting, unique word each day without any preable.  You speak Australian English.",
      },
      {
        role: "system",
        content:
          "You produce output in the JSON format with 3 fields: `word`, `definition`, and `etymology`.  Each field should be a plain text string, please exclude a title introducing the field.",
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
      {
        role: "user",
        content: [
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

  try {
    const data = JSON.parse(response.data.choices[0].message!.content);

    const body = `**${data.word}**

**Definition:**

${data.definition}

**Etymology:**

${data.etymology}`;

    return { body };
  } catch (ex) {
    console.error(ex);
    console.error(response.data.choices[0].message!.content);
    return { body: "failed to load word" };
  }
};
