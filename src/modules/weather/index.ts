import { ModuleHandler } from "..";

const format = (
  label: string,
  input: { temp_min?: number; temp_max?: number; extended_text: string }
): string => {
  const tempRange = [
    input.temp_min ? `min: ${input.temp_min}` : "",
    input.temp_max ? `max: ${input.temp_max}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return [
    label ? `**${label}**` : "",
    tempRange ? `(${tempRange}) ` : "",
    input.extended_text,
  ].join(" ");
};

export const handler: ModuleHandler = async () => {
  const response = await fetch(
    "https://api.weather.bom.gov.au/v1/locations/r1r0w2r/forecasts/daily" // ref: https://api.weather.bom.gov.au/v1/locations?search=mount%20waverley
  );
  const data = await response.json();

  return {
    body: [
      format("Today", data.data[0]),
      format("Tomorrow", data.data[1]),
    ].join("\n\n"),
  };
};
