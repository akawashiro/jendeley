import { JsonDB } from "./db_schema";
import fs from "fs";
import { validateJsonDB } from "./validate_db";

function saveDB(jsonDB: JsonDB, dbPath: string) {
  if (!validateJsonDB(jsonDB, undefined)) {
    throw new Error("validateJsonDB failed!");
  }

  fs.writeFileSync(dbPath, JSON.stringify(jsonDB, null, 2));
}

function loadDB(dbPath: string): JsonDB {
  const jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());

  if (!validateJsonDB(jsonDB, undefined)) {
    throw new Error("validateJsonDB failed!");
  }
  return jsonDB;
}

export { saveDB, loadDB };
