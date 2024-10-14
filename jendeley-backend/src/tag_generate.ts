import { genRight, genLeft } from "./either";
import fetch from "node-fetch";
import { logger } from "./logger";

const GENERATE_TAGS_PROMPT =
  "Generate tags from text. Tags must be comma separated. And each tag must be a single word. The number of tags must be at most 3. You must emit only tags.\n";
const MAX_TAGS_GENERATED = 3;
const MAX_TAG_LENGTH = 10;

function generatePrompt(
  title: string,
  text: string,
  tag_candidates: string[]
): string {
  let prompt = GENERATE_TAGS_PROMPT;
  prompt += "```\n" + title + "\n\n";
  prompt += text + "\n```\n";
  return prompt;
}

function filterTags(tags: string[], tag_candidates: string[]): string[] {
  for (let i = 0; i < tags.length; i++) {
    tags[i] = tags[i].trim();
  }

  let filtered_tags: string[] = [];
  for (let i = 0; i < tags.length; i++) {
    if (tag_candidates.includes(tags[i])) {
      filtered_tags.push(tags[i]);
    }
    if (filtered_tags.length >= MAX_TAGS_GENERATED) {
      break;
    }
  }
  if (filtered_tags.length < MAX_TAGS_GENERATED) {
    for (let i = 0; i < tags.length; i++) {
      if (filtered_tags.includes(tags[i])) {
        continue;
      }
      if(tags[i].length > MAX_TAG_LENGTH) {
        continue;
      }
      if(tags[i].includes(" ")) {
        continue;
      }
      filtered_tags.push(tags[i]);
    }
  }
  return filtered_tags;
}

async function genTags(
  ollama_server: string,
  title: string,
  text: string,
  tag_candidates: string[]
) {
  const prompt = generatePrompt(title, text, tag_candidates);
  logger.info("Prompt to generate tags: \n" + prompt);
  const body = {
    model: "llama3.2",
    prompt: prompt,
    stream: false,
  };
  try {
    logger.info("Sendding request to " + ollama_server);
    const response = await fetch(ollama_server + "api/generate/", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const data = (await response.json()) as Object;
    const response_data = data["response"];
    logger.info("response_data: " + response_data);
    if (typeof response_data !== "string") {
      return genLeft(
        "Failed to generate tags response from ollama_server is not string: " +
          response_data
      );
    } else {
      const tags = response_data.split(",");
      const filtered_tags = filterTags(tags, tag_candidates);
      return genRight(filtered_tags);
    }
  } catch (error) {
    console.log("error = " + error);
    return genLeft("Failed to generate tags");
  }
}

export { genTags };
