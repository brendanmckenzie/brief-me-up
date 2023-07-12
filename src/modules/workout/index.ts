import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from "openai";
import { ModuleHandler } from "..";
import { Config } from "../../config";
import { hbs } from "../../shared/hbs";
import { createLemmyClient } from "../../shared/lemmy";

export const handler: ModuleHandler = async (config: Config) => {
  const key = dateToKey(new Date());

  const client = new OpenAIApi(
    new Configuration({ apiKey: config.OPENAI_API_KEY })
  );

  const input: CreateChatCompletionRequest = {
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
          "You produce output in the JSON format with 4 fields: `warmup`, `strength`, `workout` and `summary`.  Each field should be a Markdown formatted string, please exclude a title introducing the field.",
      },
      {
        role: "user",
        content:
          "Generate a workout for today based on the following schedule - include a detailed warmup with stretches, strength component and a metcon",
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
          "Saturday - long-form chipper workout, strength is optional today as the focus is on a longer workout.",
        ].join("; "),
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
  };

  const response = await client.createChatCompletion(input);
  const transcript = [...input.messages, response.data.choices[0].message!];

  const url = `https://${process.env.WEB_ROOT}/workouts/${key}.html`;

  try {
    const data = JSON.parse(response.data.choices[0].message!.content);

    const markdown = `### Warmup

${data.warmup}

### Strength

${data.strength}

### Workout

${data.workout}

### Summary

${data.summary}`;

    await storeTranscript(key, transcript);
    await store(config, key, url, data.summary, markdown);

    return {
      body: markdown,
      url,
    };
  } catch (ex) {
    console.error(ex);
    console.error(response.data.choices[0].message!.content);
    return { body: "failed to load workout" };
  }
};

const storeTranscript = async (key: string, input: object): Promise<void> => {
  const client = new S3Client({ region: "ap-southeast-2" });

  client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET,
      ContentType: "application/json",
      ContentEncoding: "utf-8",
      Key: `workouts/${key}.json`,
      Body: JSON.stringify(input, null, 2),
    })
  );
};

const dateToKey = (date: Date): string => {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((num) => num.toString().padStart(2, "0"))
    .join("")
    .substring(2);
};

const store = async (
  config: Config,
  key: string,
  url: string,
  summary: string,
  body: string
): Promise<void> => {
  const client = new S3Client({ region: "ap-southeast-2" });

  const template = hbs.compile(
    fs.readFileSync("./res/workout.hbs").toString("utf8")
  );
  const html = template({ key, body });

  client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET,
      ContentType: "text/html",
      ContentEncoding: "utf-8",
      Key: `public/workouts/${key}.html`,
      Body: html,
    })
  );

  client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET,
      ContentType: "text/markdown",
      ContentEncoding: "utf-8",
      Key: `public/workouts/${key}.md`,
      Body: body,
    })
  );

  const { client: lemmy, jwt } = await createLemmyClient(config);

  lemmy.createPost({
    name: key,
    community_id: 61 /*"workouts"*/,
    body: summary + "\n\nPost your workout results in the comments.",
    url,
    auth: jwt!,
    nsfw: false,
  });
};
