import { concatDirs } from "./path_util";
import fs from "fs";
import pdfparse from "pdf-parse";
import { logger } from "./logger";
import { loadDB } from "./load_db";
import { Either, genLeft, genRight, isRight } from "./either";

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

async function compileDB(dbPath: string[], compiledDBPath: string[]) {
  logger.info(
    "Compiling " + concatDirs(dbPath) + " to " + concatDirs(compiledDBPath)
  );
  if (fs.existsSync(concatDirs(dbPath))) {
    const jsonDB = loadDB(dbPath, false);
    let compiledDB: { [key: string]: string } = {};
    for (const id in jsonDB) {
      const entry = jsonDB[id];
      if (
        entry.idType == "arxiv" ||
        entry.idType == "doi" ||
        entry.idType == "isbn" ||
        entry.idType == "book"
      ) {
        const path = concatDirs(dbPath.slice(0, -1).concat(entry.path));
        logger.info("Reading id = " + id + " path = " + path);
        const text = await getTextsFromPDF(path);
        if (text._tag == "right") {
          compiledDB[id] = text.right;
          logger.info("text = " + text.right);
        }
      }
    }

    fs.writeFileSync(
      concatDirs(compiledDBPath),
      JSON.stringify(compiledDB, null, 2)
    );
  } else {
    logger.error(dbPath + " is not exist.");
  }
}

export { compileDB };
