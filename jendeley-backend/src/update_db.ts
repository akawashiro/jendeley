import { concatDirs } from "./path_util";
import fs from "fs";
import pdfparse from "pdf-parse";
import { logger } from "./logger";
import { loadDB } from "./load_db";
import { Either, genLeft, genRight } from "./either";
import { validateJsonDB } from "./validate_db";

async function getTextsFromPDF(
  pdfFullpath: string
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

async function update_db(dbPathVer1: string[], dbPathVer2: string[]) {
  logger.info(
    "Updating " + concatDirs(dbPathVer1) + " to " + concatDirs(dbPathVer2)
  );
  if (!fs.existsSync(concatDirs(dbPathVer1))) {
    logger.error(dbPathVer1 + " does not exist.");
    return;
  }

  const jsonDB = loadDB(dbPathVer1, true);
  for (const id in jsonDB) {
    const entry = jsonDB[id];
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
        jsonDB[id]["text"] = text.right;
      } else {
        logger.warn(text.left);
        jsonDB[id]["text"] = "";
      }
    } else if (entry.idType == "url") {
      logger.info("url = " + entry.url);
      let { got } = await import("got");
      const options = { headers: { Accept: "text/html" } };
      const html = await got(entry.url, options).text();
      const { convert } = require("html-to-text");
      const text = convert(html, {});
      jsonDB[id]["text"] = text;
    }
  }

  if (fs.existsSync(concatDirs(dbPathVer2))) {
    logger.fatal(dbPathVer2 + " already exists.");
    return;
  }
  if (validateJsonDB(jsonDB, undefined)) {
    logger.fatal("validateJsonDB failed.");
    return;
  }
  fs.writeFileSync(concatDirs(dbPathVer2), JSON.stringify(jsonDB, null, 2));
}

export { update_db };
