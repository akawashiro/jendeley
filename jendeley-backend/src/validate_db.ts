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
  ID_TYPE_META,
  ENTRY_PATH,
  ENTRY_COMMENTS,
  ENTRY_URL,
  DB_META_KEY,
} from "./constants";
import { JsonDB } from "./db_schema";
import { logger } from "./logger";

// We should call this function whenever rewrite DB.
function validateJsonDB(jsonDB: JsonDB, dbPath: string | undefined): boolean {
  let validDB = true;

  if (jsonDB[DB_META_KEY] == undefined) {
    logger.warn("No metadata in DB.");
    validDB = false;
  }

  for (const id of Object.keys(jsonDB)) {
    const id_type = jsonDB[id][ENTRY_ID_TYPE];
    if (id_type == ID_TYPE_META) {
      continue;
    }

    // ENTRY_ID_TYPE check
    if (
      id_type != ID_TYPE_ARXIV &&
      id_type != ID_TYPE_DOI &&
      id_type != ID_TYPE_ISBN &&
      id_type != ID_TYPE_PATH &&
      id_type != ID_TYPE_BOOK &&
      id_type != ID_TYPE_URL
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
      if (dbPath != undefined) {
        const dbDir = path.dirname(dbPath);
        const filepath = jsonDB[id][ENTRY_PATH];
        if (!path.join(dbDir, filepath)) {
          logger.warn("File not exists: " + filepath + " id: " + id);
          validDB = false;
        }
      } else {
        logger.info("dbPath is undefined. Skip file existence check.");
      }
    }

    // ENTRY_URL check
    if (id_type != ID_TYPE_URL) {
      if (ENTRY_URL in jsonDB[id]) {
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
      function isValidUrl(urlString: string) {
        try {
          return Boolean(new URL(urlString));
        } catch (e) {
          return false;
        }
      }

      const url = jsonDB[id][ENTRY_URL];
      if (!isValidUrl(url)) {
        validDB = false;
        logger.warn(url + " is not valid. id: " + id);
      }
    }
  }
  return validDB;
}

function validateDB(dbPath: string): boolean {
  dbPath = path.resolve(dbPath);
  const jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());

  logger.info("validateDB");
  if (!fs.existsSync(dbPath)) {
    logger.warn(dbPath + "does not exists.");
    return false;
  }

  return validateJsonDB(jsonDB, dbPath);
}

export { validateJsonDB, validateDB };
