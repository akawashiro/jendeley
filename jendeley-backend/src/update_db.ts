import { concatDirs } from "./path_util";
import fs from "fs";
import pdfparse from "pdf-parse";
import { logger } from "./logger";
import { loadDB } from "./load_db";
import fetch from "node-fetch";
import { Request as NFRequest } from "node-fetch";
import { Either, genLeft, genRight } from "./either";
import { validateJsonDB } from "./validate_db";
import {
  ENTRY_AUTHORS,
  ENTRY_TEXT,
  DB_META_KEY,
  JENDELEY_VERSION,
} from "./constants";

async function getTextsFromPDF(
  pdfFullpath: string,
): Promise<Either<string, string>> {
  let dataBuffer: Buffer;
  try {
    dataBuffer = fs.readFileSync(pdfFullpath);
  } catch (err) {
    const msg = "Cannot read " + pdfFullpath + ".";
    logger.warn(msg);
    return genLeft(msg);
  }

  try {
    const data = await pdfparse(dataBuffer);
    const texts = data.text;
    return genRight(texts);
  } catch (err: any) {
    logger.warn(err.message);
    return genLeft(err.message);
  }
}

// Run
// git diff v1.3.0 jendeley-backend/src/db_schema.ts
// to see what has changed.
async function update_db(dbPathVer1: string[], dbPathVer2: string[]) {
  logger.info(
    "Updating " + concatDirs(dbPathVer1) + " to " + concatDirs(dbPathVer2),
  );
  if (!fs.existsSync(concatDirs(dbPathVer1))) {
    logger.error(dbPathVer1 + " does not exist.");
    return;
  }

  const jsonDB = loadDB(dbPathVer1, true);
  for (const id in jsonDB) {
    const entry = jsonDB[id];
    // ENTRY_TEXT
    if (
      entry.idType == "arxiv" ||
      entry.idType == "doi" ||
      entry.idType == "isbn" ||
      entry.idType == "book" ||
      entry.idType == "path"
    ) {
      const path = concatDirs(dbPathVer1.slice(0, -1).concat(entry.path));
      logger.info("Reading id = " + id + " path = " + path);
      const text = await getTextsFromPDF(path);
      if (text._tag == "right") {
        jsonDB[id][ENTRY_TEXT] = text.right;
      } else {
        logger.warn(text.left);
        jsonDB[id][ENTRY_TEXT] = "";
      }
    } else if (entry.idType == "url") {
      logger.info("url = " + entry.url);
      const options = { headers: { Accept: "text/html" } };
      const res = await fetch(new NFRequest(entry.url, options));
      const html = res.text();

      const { convert } = require("html-to-text");
      const text = convert(html, {});
      jsonDB[id][ENTRY_TEXT] = text;
    }

    // ENTRY_AUTHORS
    if (entry.idType === "path" || entry.idType === "url") {
      jsonDB[id][ENTRY_AUTHORS] = [];
    }
  }
  jsonDB[DB_META_KEY]["version"] = JENDELEY_VERSION;

  if (fs.existsSync(concatDirs(dbPathVer2))) {
    logger.fatal(dbPathVer2 + " already exists.");
    return;
  }
  if (!validateJsonDB(jsonDB, undefined)) {
    logger.fatal("validateJsonDB failed.");
    return;
  }
  fs.writeFileSync(concatDirs(dbPathVer2), JSON.stringify(jsonDB, null, 2));
}

export { update_db };
