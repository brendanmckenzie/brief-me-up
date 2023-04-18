import Handlebars from "handlebars";
import showdown from "showdown";
import fs from "fs";
import { modules } from "../modules";

export const hbs = Handlebars.create();

hbs.registerHelper("md", (input: string) => {
  if (!input) {
    return "";
  }

  const md = new showdown.Converter();

  return new Handlebars.SafeString(md?.makeHtml(input));
});

Object.keys(modules).forEach((key) => {
  const templateFile = `./src/modules/${key}/template.hbs`;
  if (fs.existsSync(templateFile)) {
    hbs.registerPartial(
      key,
      Handlebars.compile(fs.readFileSync(templateFile).toString("utf8"))
    );
  }
});
