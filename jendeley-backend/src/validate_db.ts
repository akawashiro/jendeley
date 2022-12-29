import fs from "fs";
import path from "path";
import {
  ENTRY_TAGS,
  ENTRY_ID_TYPE,
  ID_TYPE_ARXIV,
  ID_TYPE_BOOK,
  ID_TYPE_DOI,
  ID_TYPE_ISBN,
  ID_TYPE_PATH,
  ID_TYPE_URL,
  ENTRY_PATH,
  ENTRY_COMMENTS,
} from "./constants";
import { logger } from "./logger";

function validateDB(dbPath: string): boolean {
  dbPath = path.resolve(dbPath);

  logger.info("validateDB");
  if (!fs.existsSync(dbPath)) {
    logger.warn(dbPath + "does not exists.");
    return false;
  }

  const jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());
  let validDB = true;

  for (const id of Object.keys(jsonDB)) {
    const id_type = jsonDB[id][ENTRY_ID_TYPE];

    // ENTRY_ID_TYPE check
    if (
      id_type != ID_TYPE_ARXIV &&
      id_type != ID_TYPE_DOI &&
      id_type != ID_TYPE_ISBN &&
      id_type != ID_TYPE_PATH &&
      id_type != ID_TYPE_BOOK
    ) {
      logger.warn("Invalid id_type: " + id_type);
      validDB = false;
    }

    if (
      !id.startsWith(id_type) &&
      (!id.startsWith(ID_TYPE_ISBN) || id_type != ID_TYPE_BOOK)
    ) {
      logger.warn("Invalid id: " + id + " id_type: " + id_type);
      validDB = false;
    }

    // ENTRY_TAGS check
    if (
      !Array.isArray(jsonDB[id][ENTRY_TAGS]) ||
      !jsonDB[id][ENTRY_TAGS].every((t: any) => typeof t == "string")
    ) {
      logger.warn(
        "Invalid tags in id:" + id + " tags: " + jsonDB[id][ENTRY_TAGS]
      );
      validDB = false;
    }

    // ENTRY_COMMENTS check
    if (typeof jsonDB[id][ENTRY_COMMENTS] != "string") {
      logger.warn(
        "Invalid comments in id:" +
          id +
          " comments: " +
          jsonDB[id][ENTRY_COMMENTS]
      );
      validDB = false;
    }

    // ENTRY_PATH check
    if (id_type == ID_TYPE_URL) {
      if (ENTRY_PATH in jsonDB[id]) {
        logger.warn(
          ENTRY_PATH +
            " should not exists in id_type of " +
            ID_TYPE_URL +
            " id: " +
            id
        );
        validDB = false;
      }
    } else {
      const dbDir = path.dirname(dbPath);
      const filepath = jsonDB[id][ENTRY_PATH];
      if (!path.join(dbDir, filepath)) {
        logger.warn("File not exists: " + filepath + " id: " + id);
        validDB = false;
      }
    }
  }
  return validDB;
}

export { validateDB };
