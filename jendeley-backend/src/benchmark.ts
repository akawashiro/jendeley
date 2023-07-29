import { concatDirs } from "./path_util";
import fs from "fs";
import { loadDB } from "./load_db";
import { ApiEntry, RequestGetDB } from "./api_schema";
import { DB_META_KEY } from "./constants";
import { abbribatePublisherInEntry, getEntry, getScoreAndEntry } from "./api";
import { compareScore, Scores } from "./score";
import { logger } from "./logger";

function benchmarkFuzzySearch(dbPath: string[]) {
  if (!fs.existsSync(concatDirs(dbPath))) {
    process.exit(1);
  }

  const jsonDB = loadDB(dbPath, false);
  const requestGetDB: RequestGetDB = {
    text: "large",
    // text: "l",
    publisher: undefined,
    year: undefined,
    title: undefined,
    authors: undefined,
    tags: undefined,
    comments: undefined,
  };

  const start = process.hrtime.bigint();

  for (let i = 0; i < 100; i++) {
    let scoreAndEntry: [Scores, ApiEntry][] = [];
    for (const id of Object.keys(jsonDB)) {
      if (jsonDB[id] == undefined) continue;
      if (id == DB_META_KEY) continue;
      const e_raw = getEntry(id, jsonDB);
      const e = abbribatePublisherInEntry(e_raw);
      const sande = getScoreAndEntry(e, requestGetDB);
      scoreAndEntry.push(sande);
    }

    // Sort by score in descending order
    scoreAndEntry.sort((a: [Scores, ApiEntry], b: [Scores, ApiEntry]) => {
      return compareScore(a[0], b[0]);
    });

    const end = process.hrtime.bigint();
    logger.info(
      "benchmarkFuzzySearch takes " +
        (end - start) / BigInt(1000 * 1000) +
        " ms",
    );
  }
}

export { benchmarkFuzzySearch };
