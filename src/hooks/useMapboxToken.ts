import { useState } from "react";
import { parseMapboxToken } from "../lib/mapbox";

export function useMapboxToken() {
  const [input, setInput] = useState("");
  const token = parseMapboxToken(input);

  return { input, token, update: setInput };
}
