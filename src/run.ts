import { modules } from "./modules";
import { sendMail } from "./shared/email";
import mjml2html from "mjml";
import fs from "fs";
import { hbs } from "./shared/hbs";
import { fetchConfig } from "./config";

export const main = async () => {
  console.log("fetching config...");
  const config = await fetchConfig();

  console.log("executing modules...");
  const entries = await Promise.all(
    Object.keys(modules).map(async (key) => [key, await modules[key](config)])
  );

  const responses = Object.fromEntries(entries);

  console.log("generating template...");
  const template = hbs.compile(
    fs.readFileSync("./res/container.hbs.mjml").toString("utf8")
  );
  console.log("processing template...");
  const mjml = template({ data: responses });

  console.log("converting mjml...");
  const { html } = mjml2html(mjml);

  const subject = `Daily briefing - ${new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;

  console.log("sending email...");
  await sendMail(config, config.MAIL_TO!, subject, html);
};
