import { genRight, genLeft } from "./either";
import fetch from "node-fetch";
import { logger } from "./logger";

const GENERATE_TAGS_PROMPT =
  "Generate tags from text. Tags must be comma separated. And each tag must be a single word. The number of tags must be at most 3. You must emit only tags.\n";
const MAX_TAGS_GENERATED = 3;
const MAX_TAG_LENGTH = 10;
const OLLAMA_MODEL = "llama3.2";

function generatePrompt(title: string, text: string): string {
  let prompt = GENERATE_TAGS_PROMPT;
  prompt += "```\n" + title + "\n\n";
  const lines = text.split("\n");
  for (let i = 0; i < lines.length && prompt.length < 4096; i++) {
    prompt += lines[i] + "\n";
  }
  prompt += "\n```\n";
  return prompt;
}

function normalizeTag(tag: string, tag_candidates: string[]): string | null {
  for (let i = 0; i < tag_candidates.length; i++) {
    if (tag_candidates[i].toLowerCase() === tag.toLowerCase()) {
      return tag_candidates[i];
    }
  }
  return null;
}

function isAlphaNumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

function filterTags(tags: string[], tag_candidates: string[]): string[] {
  for (let i = 0; i < tags.length; i++) {
    tags[i] = tags[i].trim();
  }

  let rest_tags: string[] = [];
  let filtered_tags: string[] = [];
  for (let i = 0; i < tags.length; i++) {
    const normalized_tag = normalizeTag(tags[i], tag_candidates);
    if (normalized_tag !== null) {
      filtered_tags.push(normalized_tag);
    } else {
      rest_tags.push(tags[i]);
    }
    if (filtered_tags.length >= MAX_TAGS_GENERATED) {
      continue;
    }
  }

  tags = rest_tags;
  for (let i = 0; i < tags.length; i++) {
    if (
      filtered_tags.length >= MAX_TAGS_GENERATED ||
      filtered_tags.includes(tags[i]) ||
      tags[i].length > MAX_TAG_LENGTH ||
      !isAlphaNumeric(tags[i])
    ) {
      continue;
    }
    filtered_tags.push(tags[i]);
  }
  return filtered_tags;
}

async function checkOllamaServer(ollama_server: string): Promise<boolean> {
  const body = {
    model: OLLAMA_MODEL,
    prompt: "1 + 1 = ?",
    stream: false,
  };
  try {
    logger.info("Sending request to ollama server: " + ollama_server);
    const response = await fetch(ollama_server + "api/generate/", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const data = (await response.json()) as Object;
    const response_data = data["response"];
    logger.info("response_data: " + response_data);
    if (typeof response_data !== "string") {
      logger.error(
        "Failed to check ollama server: response_data is not string: " +
          response_data,
      );
      return false;
    } else {
      logger.info("Ollama server is working");
      return true;
    }
  } catch (error) {
    logger.error("Failed to check ollama server: " + error);
    return false;
  }
}

async function genTags(
  ollama_server: string,
  title: string,
  text: string,
  tag_candidates: string[],
) {
  const prompt = generatePrompt(title, text);
  logger.debug("Prompt to generate tags: \n" + prompt);
  const body = {
    model: "llama3.2",
    prompt: prompt,
    stream: false,
  };
  try {
    logger.info("Sending request to ollama server: " + ollama_server);
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
          response_data,
      );
    } else {
      const tags = response_data.split(",");
      logger.info("Generated tags: " + tags);
      const filtered_tags = filterTags(tags, tag_candidates);
      logger.info("Filtered tags: " + filtered_tags);
      return genRight(filtered_tags);
    }
  } catch (error) {
    console.log("error = " + error);
    return genLeft("Failed to generate tags");
  }
}

export { genTags, checkOllamaServer };
