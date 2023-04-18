import Handlebars from "handlebars";
import showdown from "showdown";

export const hbs = Handlebars.create();

hbs.registerHelper("md", (input: string) => {
  if (!input) {
    return "";
  }

  const md = new showdown.Converter();

  return new Handlebars.SafeString(md?.makeHtml(input));
});
