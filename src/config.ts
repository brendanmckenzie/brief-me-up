import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export type Config = { [key: string]: string };

export const fetchConfig = async (): Promise<Config> => {
  const client = new SecretsManagerClient({ region: "ap-southeast-2" });

  const res = await client.send(
    new GetSecretValueCommand({ SecretId: "prod/briefmeup" })
  );

  const value = JSON.parse(res.SecretString || "{}");

  return value;
};
