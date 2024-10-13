import { genRight, genLeft } from "./either";
import fetch from "node-fetch";
import { logger } from "./logger";

const OLLAMA_SERVER = "http://localhost:11434/";
const GENERATE_TAGS_PROMPT =
  "Generate tags from text. Tags must be comma separated. And each tag must be a single word. The number of tags must be at most 3. You must emit only tags.\n";

async function genTags(text: string) {
  const body = {
    model: "llama3.2",
    prompt: GENERATE_TAGS_PROMPT + "```" + text + "```",
    stream: false,
  };
  try {
    logger.info("Sendding request to " + OLLAMA_SERVER);
    const response = await fetch(OLLAMA_SERVER + "api/generate/", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const data = (await response.json()) as Object;
    const response_data = data["response"];
    logger.info("response_data: " + response_data);
    const tags = response_data.split(",");
    for (let i = 0; i < tags.length; i++) {
      tags[i] = tags[i].trim();
    }
    return genRight(tags);
  } catch (error) {
    console.log("error = " + error);
    return genLeft("Failed to generate tags");
  }
}

export { genTags };
