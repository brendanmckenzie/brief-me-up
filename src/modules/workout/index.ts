import { OpenAIApi, Configuration, CreateChatCompletionRequest } from "openai";
import { ModuleHandler } from "..";
import { Config } from "../../config";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const handler: ModuleHandler = async (config: Config) => {
  const key = dateToKey(new Date());

  const client = new OpenAIApi(
    new Configuration({ apiKey: config.OPENAI_API_KEY })
  );

  const yesterday = await fetchContext();

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
      ...yesterday,
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

  const transcript = [...input.messages, response.data.choices[0].message];

  console.log({ transcript });

  await storeTranscript(key, transcript);

  return { body: response.data.choices[0].message?.content ?? "" };
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

const fetchContext = async (): Promise<any[]> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const key = dateToKey(yesterday);
    const client = new S3Client({ region: "ap-southeast-2" });
    const dataRes = await client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET,
        Key: `workouts/${key}.json`,
      })
    );

    const dataStr = await dataRes.Body?.transformToString("utf-8");

    if (dataStr) {
      const dataObj = JSON.parse(dataStr ?? "[]");

      // TODO: make this smarter by looking back further than 1 day
      return dataObj.slice(-2);
    } else {
      return [];
    }
  } catch {
    return [];
  }
};

const dateToKey = (date: Date): string => {
  return date.toISOString().substring(2, 10).replaceAll("-", "");
};
