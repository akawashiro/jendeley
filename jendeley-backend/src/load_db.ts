import { FulltextDB, JsonDB } from "./db_schema";
import fs from "fs";
import { validateJsonDB } from "./validate_db";
import { logger } from "./logger";
import path from "path";
import { JENDELEY_DIR } from "./constants";
import { concatDirs } from "./path_util";

// TODO: Naive cache. Check cache consistency.
let loadedDB: { jsonDB: JsonDB; dbPath: string[] } | undefined = undefined;

// saveDB and loadDB exit when fails because writing wrong data to
// DB is worse than continuing to work.
function saveDB(jsonDB: JsonDB, dbPath: string[]) {
  loadedDB = undefined;

  logger.info("saveDB dbPath = " + dbPath);

  const jendeley_hidden_dir = path.join(
    path.dirname(concatDirs(dbPath)),
    JENDELEY_DIR
  );
  if (!fs.existsSync(jendeley_hidden_dir)) {
    fs.mkdirSync(jendeley_hidden_dir, { recursive: true });
  }
  if (!fs.statSync(jendeley_hidden_dir).isDirectory()) {
    logger.fatal(jendeley_hidden_dir + " is not directory.");
    process.exit(1);
  }

  const backups = fs.readdirSync(jendeley_hidden_dir);
  const sorted = backups.sort((a, b) => {
    let aStat = fs.statSync(path.join(jendeley_hidden_dir, a));
    let bStat = fs.statSync(path.join(jendeley_hidden_dir, b));

    return (
      new Date(bStat.birthtime).getTime() - new Date(aStat.birthtime).getTime()
    );
  });

  // TODO: Make configurable
  const maxBackups = 10;
  let nBackups = 0;
  const backupPrefix = "backup_jendeley_";
  for (const b of sorted) {
    nBackups++;
    if (nBackups >= maxBackups) {
      logger.info("Delete old backup file: " + b);
      fs.rmSync(path.join(jendeley_hidden_dir, b));
    }
  }

  const backup = path.join(
    jendeley_hidden_dir,
    backupPrefix + String(Date.now()) + "_" + path.basename(concatDirs(dbPath))
  );
  if (fs.existsSync(concatDirs(dbPath))) {
    fs.cpSync(concatDirs(dbPath), backup);
  }

  if (!validateJsonDB(jsonDB, dbPath)) {
    logger.fatal("Failed to save jsonDB because validateJsonDB failed!");
    process.exit(1);
  }
  fs.writeFileSync(concatDirs(dbPath), JSON.stringify(jsonDB, null, 2));
}

function loadDB(dbPath: string[], ignoreErrors: boolean): JsonDB {
  if (loadedDB != undefined && loadedDB.dbPath == dbPath) {
    return loadedDB.jsonDB;
  } else {
    loadedDB = undefined;
  }

  const jsonDB = JSON.parse(fs.readFileSync(concatDirs(dbPath)).toString());

  if (!validateJsonDB(jsonDB, dbPath)) {
    if (ignoreErrors) {
      logger.warn(
        "validateJsonDB failed but ignore because ignoreErrors is true"
      );
    } else {
      logger.fatal("Failed to load DB. Check log.");
      process.exit(1);
    }
  }

  loadedDB = { jsonDB: jsonDB, dbPath: dbPath };
  return jsonDB;
}

function loadFulltextDB(fulltextDBPath: string[]): FulltextDB {
  const fulltextDB = JSON.parse(
    fs.readFileSync(concatDirs(fulltextDBPath)).toString()
  );
  return fulltextDB;
}

export { saveDB, loadDB, loadFulltextDB };
