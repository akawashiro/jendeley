import { JsonDB } from "./db_schema";
import fs from "fs";
import { validateJsonDB } from "./validate_db";
import { logger } from "./logger";
import path from "path";
import { JENDELEY_DIR } from "./constants";

// saveDB and loadDB exit when fails because writing wrong data to
// DB is worse than continuing to work.
function saveDB(jsonDB: JsonDB, dbPath: string) {
  logger.info("saveDB dbPath = " + dbPath);

  const jendeley_hidden_dir = path.join(path.dirname(dbPath), JENDELEY_DIR);
  if (!fs.existsSync(jendeley_hidden_dir)) {
    fs.mkdirSync(jendeley_hidden_dir, { recursive: true });
  }
  if (!fs.statSync(jendeley_hidden_dir).isDirectory()) {
    logger.fatal(jendeley_hidden_dir + " is not directory.");
    process.exit(1);
  }

  const backup = path.join(
    jendeley_hidden_dir,
    "backup_" + String(Date.now()) + "_" + path.basename(dbPath)
  );
  if (fs.existsSync(dbPath)) {
    fs.cpSync(dbPath, backup);
  }

  if (!validateJsonDB(jsonDB, dbPath)) {
    logger.fatal("validateJsonDB failed!");
    process.exit(1);
  }
  fs.writeFileSync(dbPath, JSON.stringify(jsonDB, null, 2));
}

function loadDB(dbPath: string): JsonDB {
  const jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());

  if (!validateJsonDB(jsonDB, dbPath)) {
    logger.fatal("validateJsonDB failed!");
    process.exit(1);
  }
  return jsonDB;
}

export { saveDB, loadDB };
