import { ModuleHandler } from "./modules";
import { handler as fact } from "./modules/fact";
import { handler as workout } from "./modules/workout";
import { handler as weather } from "./modules/weather";
import { sendMail } from "./shared/email";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import fs from "fs";
import showdown from "showdown";

const handlers: { [key: string]: ModuleHandler } = {
  fact,
  workout,
  weather,
};

const hbs = Handlebars.create();

hbs.registerHelper("md", (input) => {
  if (!input) {
    return "";
  }

  const md = new showdown.Converter();

  return new Handlebars.SafeString(md?.makeHtml(input));
});

Object.keys(handlers).forEach((key) => {
  const templateFile = `./src/modules/${key}/template.hbs`;
  if (fs.existsSync(templateFile)) {
    hbs.registerPartial(
      key,
      Handlebars.compile(fs.readFileSync(templateFile).toString("utf8"))
    );
  }
});

const main = async () => {
  const entries = await Promise.all(
    Object.keys(handlers).map(async (key) => [key, await handlers[key]()])
  );

  const responses = Object.fromEntries(entries);

  const template = hbs.compile(
    fs.readFileSync("./src/shared/container.hbs.mjml").toString("utf8")
  );
  const mjml = template({ data: responses });

  const { html } = mjml2html(mjml);

  const subject = `Daily briefing - ${new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}`;

  await sendMail(process.env.MAIL_TO!, subject, html);
};

main();
