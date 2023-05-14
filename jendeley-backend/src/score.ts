import { ApiEntry, RequestGetDB } from "./api_schema";
import { logger } from "./logger";
import {
  fuzzySearchSuffixPatriciaTree,
  ukkonenAlgorithm,
  Match,
  SuffixPatriciaTree,
} from "./suffix_patricia_tree";
import { createHash } from "crypto";

const MARGINE_AROUND_HIGHLIGHT = 30;

function highlightedText(text: string, matches: Array<Match>) {
  const match_strs = matches.map((m) => {
    const s = Math.max(0, m.start - MARGINE_AROUND_HIGHLIGHT);
    const begin = text.slice(s, m.start);
    const body = text.slice(m.start, m.end);
    const e = Math.min(text.length, m.end + MARGINE_AROUND_HIGHLIGHT);
    const end = text.slice(m.end, e);
    return [begin, body, end];
  });

  let highlighted = "";

  for (let i = 0; i < match_strs.length; i++) {
    highlighted += "...";
    highlighted += match_strs[i][0];
    highlighted += "<strong>";
    highlighted += match_strs[i][1];
    highlighted += "</strong>";
    highlighted += match_strs[i][2];
    highlighted += "...";
  }
  return highlighted;
}

function filterOutSameStart(matches: Match[]): Match[] {
  let filtered: Match[] = [];
  let starts: Set<number> = new Set();
  for (let i = 0; i < matches.length; i++) {
    if (!starts.has(matches[i].start)) {
      filtered.push(matches[i]);
      starts.add(matches[i].start);
    }
  }
  return filtered;
}

let suffixPatriciaTreeCache: { [key: string]: SuffixPatriciaTree } = {};

function getScoreAndText(
  text: string,
  query: string | undefined
): [number, string] {
  if (query == undefined) {
    return [Number.NEGATIVE_INFINITY, text.slice(0, 140) + "..."];
  } else {
    const cache_key = createHash("md5").update(text).digest("hex");
    if (suffixPatriciaTreeCache[cache_key] == undefined) {
      suffixPatriciaTreeCache[cache_key] = ukkonenAlgorithm(text);
    }
    const suffixPatriciaTree = suffixPatriciaTreeCache[cache_key];

    const matches = fuzzySearchSuffixPatriciaTree(
      query,
      query.length,
      suffixPatriciaTree
    );
    const filtered = filterOutSameStart(matches);

    if (filtered.length == 0 && matches.length > 0) {
      logger.fatal("filtered.length == 0 && matches.length > 0");
    }

    if (filtered.length == 0) {
      return [Number.NEGATIVE_INFINITY, text.slice(0, 140) + "..."];
    } else {
      return [filtered[0].score, highlightedText(text, filtered)];
    }
  }
}

type Scores = {
  title: number;
  text: number;
  authors: number;
  tags: number;
  comments: number;
  year: number;
  publisher: number;
};

function getScoreAndEntry(
  entry: ApiEntry,
  requestGetDB: RequestGetDB
): [Scores, ApiEntry] {
  const start = process.hrtime.bigint();
  const [textScore, text] = getScoreAndText(
    entry.text == undefined ? "" : entry.text,
    requestGetDB.text
  );
  const end = process.hrtime.bigint();
  // logger.info(" in " + (end - start) / BigInt(1000 * 1000) + " ms");
  entry.text = text;

  const [titleScore, _] = getScoreAndText(entry.title, requestGetDB.title);

  let authorsScore = 0;
  if (requestGetDB.authors != undefined) {
    for (let i = 0; i < entry.authors.length; i++) {
      logger.info(
        "entry.authors[i] = " +
          entry.authors[i] +
          " requestGetDB.authors = " +
          requestGetDB.authors
      );
      if (entry.authors[i].includes(requestGetDB.authors)) {
        authorsScore = 1;
      }
    }
  }

  let tagsScore = 0;
  if (requestGetDB.tags != undefined) {
    for (let i = 0; i < entry.tags.length; i++) {
      if (entry.tags[i].includes(requestGetDB.tags)) {
        authorsScore = 1;
      }
    }
  }

  let commentsScore = 0;
  if (requestGetDB.comments != undefined) {
    commentsScore = entry.comments.includes(requestGetDB.comments) ? 1 : 0;
  }

  let publisherScore = 0;
  if (entry.publisher != undefined && requestGetDB.publisher != undefined) {
    commentsScore = entry.publisher.includes(requestGetDB.publisher) ? 1 : 0;
  }

  let yearScore = 0;
  if (requestGetDB.year != undefined && entry.year != undefined) {
    yearScore = entry.year.toString().includes(requestGetDB.year) ? 1 : 0;
  }

  const score: Scores = {
    title: titleScore,
    text: textScore,
    authors: authorsScore,
    tags: tagsScore,
    comments: commentsScore,
    year: yearScore,
    publisher: publisherScore,
  };

  return [score, entry];
}

function compareScore(a: Scores, b: Scores) {
  if (b.title != a.title) {
    return b.title > a.title ? 1 : -1;
  } else if (b.text != a.text) {
    return b.text > a.text ? 1 : -1;
  } else if (b.authors != a.authors) {
    return b.authors > a.authors ? 1 : -1;
  } else if (b.tags != a.tags) {
    return b.tags > a.tags ? 1 : -1;
  } else if (b.comments != a.comments) {
    return b.comments > a.comments ? 1 : -1;
  } else if (b.year != a.year) {
    return b.year > a.year ? 1 : -1;
  } else if (b.publisher != a.publisher) {
    return b.publisher > a.publisher ? 1 : -1;
  } else {
    return 1;
  }
}

export { getScoreAndEntry, Scores, compareScore, filterOutSameStart };
