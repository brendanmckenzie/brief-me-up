import { ModuleHandler } from "..";
import Parser from "rss-parser";

type CustomItem = { category: string; description: string };

export const handler: ModuleHandler = async () => {
  const parser: Parser = new Parser<{}, CustomItem>({
    customFields: { item: ["category", "description"] },
  });
  const feed = await parser.parseURL("https://www.theage.com.au/rss/feed.xml");
  return {
    body: feed.items
      .filter((item) => !["Sport"].some((cat) => item.category.includes(cat)))
      .filter((_, idx) => idx < 9)
      .map(
        (item) =>
          `**[${item.title}](${item.link?.replace(
            "?ref=rss&utm_medium=rss&utm_source=rss_feed",
            ""
          )})** _${item.category}_  \n${item.description}`
      )
      .join("\n\n"),
  };
};
