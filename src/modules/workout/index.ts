import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import fs from "fs";
import { ModuleHandler } from "..";
import { Config } from "../../config";
import { hbs } from "../../shared/hbs";
import { createLemmyClient } from "../../shared/lemmy";

const WorkoutSchema = z.object({
  warmup: z.string(),
  strength: z.string(),
  workout: z.string(),
  summary: z.string(),
});

export const handler: ModuleHandler = async (config: Config) => {
  const key = dateToKey(new Date());

  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  const schedule = [
    "Monday - cleans",
    "Tuesday - squats",
    "Wednesday - gymnastics (handstands/muscle ups/rings/bars/etc)",
    "Thursday - snatches",
    "Friday - deadlift and bench press",
    "Saturday - long-form chipper workout, strength is optional today as the focus is on a longer workout.",
  ].join("; ");

  const userPrompt = [
    "Generate a workout for today based on the following schedule - include a detailed warmup with stretches, strength component and a metcon.",
    "The metcon should compliment the strength component.",
    `Schedule: ${schedule}`,
    `Today is ${today}.`,
  ].join("\n\n");

  const request = {
    model: "claude-opus-4-7" as const,
    max_tokens: 4096,
    system:
      "You provide daily workouts in the style of Crossfit, excluding any preamble. Each field is Markdown formatted; do not include titles introducing the fields.",
    messages: [{ role: "user" as const, content: userPrompt }],
    output_format: betaZodOutputFormat(WorkoutSchema),
  };

  const response = await client.beta.messages.parse(request);
  const transcript = { request, response };

  const url = `https://${process.env.WEB_ROOT}/workouts/${key}.html`;

  const data = response.parsed_output;
  if (!data) {
    console.error("failed to parse workout");
    return { body: "failed to load workout" };
  }

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

  await lemmy.createPost({
    name: key,
    community_id: 61 /*"workouts"*/,
    body: summary + "\n\nPost your workout results in the comments.",
    url,
    nsfw: false,
  });
};
