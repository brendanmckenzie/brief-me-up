import { main } from "./run";

export const handler = async (): Promise<void> => {
  await main();
};
