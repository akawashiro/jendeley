import { JsonDB } from "./db_schema";
import { loadDB } from "./load_db";
import { SuffixPatriciaTree, ukkonenAlgorithm } from "./suffix_patricia_tree";

type Context =
  | {
      jsonDB: JsonDB;
      valid: true;
      dbPath: string[];
      suffixPatriciaTree: {
        [key: string]: SuffixPatriciaTree;
      };
    }
  | { valid: false; dbPath: string[] };

function getContext(dbPath: string[]): Context {
  const jsonDB: JsonDB = loadDB(dbPath, false);
  let suffixPatriciaTree: { [key: string]: SuffixPatriciaTree } = {};
  for (const key in jsonDB) {
    const entry = jsonDB[key];
    if (entry.idType == "meta") continue;
    suffixPatriciaTree[key] = ukkonenAlgorithm(entry.text);
  }

  return {
    jsonDB: jsonDB,
    valid: true,
    dbPath: dbPath,
    suffixPatriciaTree: suffixPatriciaTree,
  };
}

export { Context, getContext };
