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
  ENTRY_TEXT,
} from "./constants";
import { JsonDB } from "./db_schema";
import { logger } from "./logger";
import { concatDirs } from "./path_util";

// We should call this function whenever rewrite DB.
function validateJsonDB(jsonDB: JsonDB, dbPath: string[] | undefined): boolean {
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

    // ENTRY_TEXT check
    if (typeof jsonDB[id][ENTRY_TEXT] != "string") {
      logger.warn(
        "Invalid text in id:" + id + " text: " + jsonDB[id][ENTRY_TEXT]
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
        const dbDir = dbPath.slice(0, dbPath.length - 1);
        const filepath: string[] = jsonDB[id][ENTRY_PATH];
        if (!fs.existsSync(concatDirs(dbDir.concat(filepath)))) {
          logger.warn(
            "File not exists: " +
              concatDirs(dbDir.concat(filepath)) +
              " id: " +
              id
          );
          validDB = false;
        }

        const forbidden_chars = [
          "\\",
          "/",
          ":",
          "*",
          "?",
          '"',
          "<",
          ">",
          "|",
          "\n",
        ];
        for (const fc of forbidden_chars) {
          for (const d of filepath) {
            if (d.indexOf(fc) > -1) {
              logger.warn(
                "filepath: " +
                  filepath +
                  " including forbidden char: '" +
                  fc +
                  "'. jendeley bans usage of these characters because of cross platform compatibility."
              );
              validDB = false;
            }
            if (d == "") {
              logger.warn("filepath: " + filepath + " includes empty string.");
              validDB = false;
            }
          }
        }
      } else {
        logger.debug("dbPath is undefined. Skip file existence check.");
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

    // Check jendeley got valid data from API.
    const entry = jsonDB[id];
    if (entry.idType == ID_TYPE_DOI) {
      if (entry.dataFromCrossref["indexed"] == undefined) {
        validDB = false;
        logger.warn(
          "Entry of id = " +
            id +
            " path = " +
            entry.path +
            " looks failed to get data from crossref. Please consider change filename to we can find manually written DocID."
        );
      }
    } else if (entry.idType == ID_TYPE_ARXIV) {
      if (entry.dataFromArxiv["id"] == undefined) {
        validDB = false;
        logger.warn(
          "Entry of id = " +
            id +
            " path = " +
            entry.path +
            " looks failed to get data from arxiv. Please consider change filename to we can find manually written DocID."
        );
      }
    } else if (entry.idType == ID_TYPE_BOOK || entry.idType == ID_TYPE_ISBN) {
      if (entry.dataFromNodeIsbn["title"] == undefined) {
        validDB = false;
        logger.warn(
          "Entry of id = " +
            id +
            " path = " +
            entry.path +
            " looks failed to get data from isbn. Please consider change filename to we can find manually written DocID."
        );
      }
    }
  }
  return validDB;
}

function validateDB(dbPath: string) {
  logger.info("validateDB start");

  dbPath = path.resolve(dbPath);
  const jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());

  if (!fs.existsSync(dbPath)) {
    logger.warn(dbPath + "does not exists.");
    return false;
  }

  const r = validateJsonDB(jsonDB, dbPath.split(path.sep));
  if (!r) {
    logger.warn(dbPath + " is not valid.");
    process.exit(1);
  } else {
    logger.info(dbPath + " is valid.");
  }
}

export { validateJsonDB, validateDB };
