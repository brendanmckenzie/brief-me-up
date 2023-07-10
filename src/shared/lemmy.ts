import { LemmyHttp, Login } from "lemmy-js-client";
import { Config } from "../config";

export const createLemmyClient = async (config: Config) => {
  let baseUrl = "https://lemmy.bmck.au";
  let client: LemmyHttp = new LemmyHttp(baseUrl);
  let loginForm: Login = {
    username_or_email: config.LEMMY_USER!,
    password: config.LEMMY_PASS!,
  };

  const { jwt } = await client.login(loginForm);

  return { client, jwt };
};
