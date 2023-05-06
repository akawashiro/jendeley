import { ApiEntry, RequestGetDB } from "./api_schema";
import { logger } from "./logger";

type Match = { start: number; end: number; score: number };

const MAX_MATCHES = 5;
const MARGINE_AROUND_HIGHLIGHT = 30;

function compareChar(a: string, b: string) {
  if (a.toLowerCase() === b.toLowerCase()) {
    return true;
  } else {
    return false;
  }
}

// https://en-jp.wantedly.com/companies/wantedly/post_articles/306103
function fuzzySearch(text: string, query: string) {
  // Corresponds to H in the article
  let dp_table: Array<Array<number>> = new Array(query.length);
  let matched_index: Array<Array<number>> = new Array(query.length);
  for (let i: number = 0; i < query.length; i++) {
    dp_table[i] = new Array(text.length);
    matched_index[i] = new Array(text.length);
    for (let j: number = 0; j < text.length; j++) {
      dp_table[i][j] = Number.NEGATIVE_INFINITY;
      matched_index[i][j] = -1;
    }
  }

  const Score = 8;
  const Gap = -3;

  for (let i: number = 0; i < query.length; i++) {
    for (let j: number = 0; j < text.length; j++) {
      if (compareChar(query[i], text[j])) {
        dp_table[i][j] = Score;
        if (0 < i && 0 < j) {
          dp_table[i][j] += dp_table[i - 1][j - 1];
          matched_index[i][j] = j;
        }
      } else {
        if (0 < j) {
          dp_table[i][j] = dp_table[i][j - 1] + Gap;
        }
      }
    }
  }

  let ends: Array<[number, number]> = [];
  for (let i = 0; i < text.length; i++) {
    if (
      dp_table[query.length - 1][i] > 0 &&
      (i === 0 ||
        dp_table[query.length - 1][i - 1] < dp_table[query.length - 1][i])
    ) {
      ends.push([dp_table[query.length - 1][i], i]);
    }
  }

  const matches: Array<Match> = [];
  ends = ends
    .sort(function (a, b) {
      return a[0] - b[0];
    })
    .reverse()
    .slice(0, MAX_MATCHES);

  for (let mi = 0; mi < ends.length; mi++) {
    let ti = ends[mi][1];
    let qi = query.length - 1;
    let failed_to_reconstruct = false;
    while (true) {
      if (compareChar(text[ti], query[qi])) {
        ti--;
        qi--;
      } else {
        ti--;
      }
      if (qi === -1) {
        break;
      }
      if (ti === -1) {
        logger.warn(
          "Skip an article because failed to reconstruct matched string. ti == -1 qi = " +
            qi +
            " query = " +
            query
        );
        failed_to_reconstruct = true;
        break;
      }
    }

    if (!failed_to_reconstruct) {
      matches.push({ start: ti + 1, end: ends[mi][1], score: ends[mi][0] });
    }
  }

  return matches;
}

// https://en-jp.wantedly.com/companies/wantedly/post_articles/306103
function fuzzySearchFast(text: string, query: string) {
  // Corresponds to H in the article
  let dp_table: Array<Array<number>> = new Array(query.length);
  let matched_index: Array<Array<number>> = new Array(query.length);
  for (let i: number = 0; i < query.length; i++) {
    dp_table[i] = new Array(text.length);
    matched_index[i] = new Array(text.length);
  }

  for (let i: number = 0; i < query.length; i++) {
    dp_table[i].fill(Number.NEGATIVE_INFINITY);
    matched_index[i].fill(-1);
  }

  const start = process.hrtime.bigint();

  const Score = 8;
  const Gap = -3;

  for (let i: number = 0; i < query.length; i++) {
    for (let j: number = 0; j < text.length; j++) {
      if (compareChar(query[i], text[j])) {
        dp_table[i][j] = Score;
        if (0 < i && 0 < j) {
          dp_table[i][j] += dp_table[i - 1][j - 1];
          matched_index[i][j] = j;
        }
      } else {
        if (0 < j) {
          dp_table[i][j] = dp_table[i][j - 1] + Gap;
        }
      }
    }
  }

  let ends: Array<[number, number]> = [];
  for (let i = 0; i < text.length; i++) {
    if (
      dp_table[query.length - 1][i] > 0 &&
      (i === 0 ||
        dp_table[query.length - 1][i - 1] < dp_table[query.length - 1][i])
    ) {
      ends.push([dp_table[query.length - 1][i], i]);
    }
  }

  const matches: Array<Match> = [];
  ends = ends
    .sort(function (a, b) {
      return a[0] - b[0];
    })
    .reverse()
    .slice(0, MAX_MATCHES);

  for (let mi = 0; mi < ends.length; mi++) {
    let ti = ends[mi][1];
    let qi = query.length - 1;
    let failed_to_reconstruct = false;
    while (true) {
      if (compareChar(text[ti], query[qi])) {
        ti--;
        qi--;
      } else {
        ti--;
      }
      if (qi === -1) {
        break;
      }
      if (ti === -1) {
        logger.warn(
          "Skip an article because failed to reconstruct matched string. ti == -1 qi = " +
            qi +
            " query = " +
            query
        );
        failed_to_reconstruct = true;
        break;
      }
    }

    if (!failed_to_reconstruct) {
      matches.push({ start: ti + 1, end: ends[mi][1], score: ends[mi][0] });
    }
  }

  const end = process.hrtime.bigint();

  const qt = BigInt(Math.max(1, query.length * text.length));
  logger.info(
    "fuzzySearchFast takes " +
      (end - start) / BigInt(1000 * 1000) +
      " ms" +
      " query.length * text.length = " +
      qt +
      " (end - start) / qt = " +
      (end - start) / qt
  );

  return matches;
}

function highlightedText(text: string, matches: Array<Match>) {
  const match_strs = matches.map((m) => {
    const s = Math.max(0, m.start - MARGINE_AROUND_HIGHLIGHT);
    const begin = text.slice(s, m.start);
    const body = text.slice(m.start, m.end + 1);
    const e = Math.min(text.length, m.end + MARGINE_AROUND_HIGHLIGHT);
    const end = text.slice(m.end + 1, e);
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

function getScoreAndText(
  text: string,
  query: string | undefined
): [number, string] {
  if (query == undefined) {
    return [Number.NEGATIVE_INFINITY, text.slice(0, 140) + "..."];
  } else {
    const matches = fuzzySearchFast(text, query);
    if (matches.length == 0) {
      return [Number.NEGATIVE_INFINITY, text.slice(0, 140) + "..."];
    } else {
      return [matches[0].score, highlightedText(text, matches)];
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

export { getScoreAndEntry, Scores, compareScore };
