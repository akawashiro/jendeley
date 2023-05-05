import { Box } from "@mui/material";
import { Typography } from "@mui/material";

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
  let dp_table: Array<Array<number>> = [];
  let matched_index: Array<Array<number>> = [];
  for (let i: number = 0; i < query.length; i++) {
    dp_table[i] = [];
    matched_index[i] = [];
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
        throw new Error("ti == -1");
      }
    }
    matches.push({ start: ti + 1, end: ends[mi][1], score: ends[mi][0] });
  }

  return matches;
}

function HighlightedText(text: string, query: string) {
  const matches = fuzzySearch(text, query);
  const match_strs = matches.map((m) => {
    const s = Math.max(0, m.start - MARGINE_AROUND_HIGHLIGHT);
    const begin = text.slice(s, m.start);
    const body = text.slice(m.start, m.end + 1);
    const e = Math.min(text.length, m.end + MARGINE_AROUND_HIGHLIGHT);
    const end = text.slice(m.end + 1, e);
    return [begin, body, end];
  });

  return (
    <div>
      {match_strs.map((t) => (
        <Box>
          ...{t[0]}
          <Typography display="inline" sx={{ fontWeight: "bold" }}>
            {t[1]}
          </Typography>
          {t[2]}...
        </Box>
      ))}
    </div>
  );
}

export { fuzzySearch, HighlightedText };
