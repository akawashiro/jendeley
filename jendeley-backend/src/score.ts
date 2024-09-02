import { ApiEntry, RequestGetDB } from "./api_schema";
import { logger } from "./logger";
import {
  fuzzySearchSuffixPatriciaTree,
  ukkonenAlgorithm,
  Match,
  SuffixPatriciaTree,
} from "./suffix_patricia_tree";

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

// TODO: Regions in filtered may overlap.
function filterOutOverlaps(matches: Match[]): Match[] {
  let filtered: { start: number; end: number; best_match: Match }[] = [];
  for (let i = 0; i < matches.length; i++) {
    let overlap = false;
    for (let j = 0; j < filtered.length; j++) {
      if (
        !(
          matches[i].end < filtered[j].start ||
          filtered[j].end <= matches[i].start
        )
      ) {
        const s = Math.min(matches[i].start, filtered[j].start);
        const e = Math.max(matches[i].end, filtered[j].end);
        const m =
          matches[i].score > filtered[j].best_match.score
            ? matches[i]
            : filtered[j].best_match;
        filtered[j] = {
          start: s,
          end: e,
          best_match: m,
        };
        overlap = true;
        continue;
      }
    }
    if (!overlap) {
      filtered.push({
        start: matches[i].start,
        end: matches[i].end,
        best_match: matches[i],
      });
    }
  }

  let ret: Match[] = [];
  for (const f of filtered) {
    ret.push(f.best_match);
  }
  return ret;
}

// Naive cache. Check consistency.
let suffixPatriciaTreeCache: { [key: string]: SuffixPatriciaTree } = {};

// Take care of cache key (text_id)
// If you don't have any good key to use, use undefined.
function getScoreAndText(
  text: string,
  query: string | undefined,
  text_id: string | undefined,
): [number, string] {
  if (query == undefined) {
    return [0, text.slice(0, 140) + "..."];
  } else {
    let suffixPatriciaTree: SuffixPatriciaTree;
    if (text_id == undefined) {
      suffixPatriciaTree = ukkonenAlgorithm(text);
    } else {
      if (suffixPatriciaTreeCache[text_id] == undefined) {
        suffixPatriciaTreeCache[text_id] = ukkonenAlgorithm(text);
        suffixPatriciaTree = suffixPatriciaTreeCache[text_id];
      } else {
        suffixPatriciaTree = suffixPatriciaTreeCache[text_id];
      }
    }

    const matches = fuzzySearchSuffixPatriciaTree(
      query,
      query.length,
      suffixPatriciaTree,
    );
    const filtered = filterOutOverlaps(matches);

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
  requestGetDB: RequestGetDB,
): [Scores, ApiEntry] {
  const start = process.hrtime.bigint();
  const [textScore, text] = getScoreAndText(
    entry.text == undefined ? "" : entry.text,
    requestGetDB.text,
    entry.id,
  );
  const end = process.hrtime.bigint();
  logger.debug("Text search in " + (end - start) / BigInt(1000 * 1000) + " ms");
  entry.text = text;

  const [titleScore, _] = getScoreAndText(
    entry.title,
    requestGetDB.title,
    undefined,
  );

  let authorsScore = 0;
  if (requestGetDB.authors != undefined) {
    for (let i = 0; i < entry.authors.length; i++) {
      logger.info(
        "entry.authors[i] = " +
          entry.authors[i] +
          " requestGetDB.authors = " +
          requestGetDB.authors,
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

  logger.debug(
    "title: " +
      titleScore +
      " text: " +
      textScore +
      " authors: " +
      authorsScore +
      " tags: " +
      tagsScore +
      " comments: " +
      commentsScore +
      " year: " +
      yearScore +
      " publisher: " +
      publisherScore,
  );

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

export { getScoreAndEntry, Scores, compareScore, filterOutOverlaps };
