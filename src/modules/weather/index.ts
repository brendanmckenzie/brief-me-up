import { ModuleHandler } from "..";

export const handler: ModuleHandler = async () => {
  const response = await fetch(
    "https://api.weather.bom.gov.au/v1/locations/r1r0w2r/forecasts/daily" // ref: https://api.weather.bom.gov.au/v1/locations?search=mount%20waverley
  );
  const data = await response.json();

  return {
    body: [
      `**Today** (min: ${data.data[0].temp_min}, max: ${data.data[0].temp_max}) ${data.data[0].extended_text}`,
      `**Tomorrow** (min: ${data.data[1].temp_min}, max: ${data.data[1].temp_max}) ${data.data[1].extended_text}`,
    ].join("\n\n"),
  };
};
