import { fetchConfig } from "../../config";
import { handler } from "./index";

(async () => {
  const config = await fetchConfig();
  const res = await handler(config);
  console.log({ res });
})();
