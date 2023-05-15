// ./node_modules/jest-cli/bin/jest.js src/suffix_trie.test.ts

import {
  Node,
  ukkonenAlgorithm,
  fuzzySearchSuffixPatriciaTree,
  showGraph,
} from "./suffix_patricia_tree";
import { filterOutOverlaps } from "./score";

function listUpAllSuffixesFromSuffixTrie(
  node: Node,
  str: string,
  prefix: string[]
): string[] {
  let result: string[] = [];
  for (const key in node.edges) {
    const edge = node.edges[key];
    if (edge.end == "#") {
      for (let i = edge.start; i < str.length; i++) {
        result.push(str.substring(i));
      }
      for (const p of prefix) {
        result.push(p + str.substring(edge.start));
      }
    } else {
      let next_prefix: string[] = [];
      for (let i = edge.start; i < edge.end; i++) {
        next_prefix.push(str.substring(i, edge.end));
      }
      for (const p of prefix) {
        next_prefix.push(p + str.substring(edge.start, edge.end));
      }
      result = result.concat(
        listUpAllSuffixesFromSuffixTrie(edge.to, str, next_prefix)
      );
    }
  }
  return result;
}

function listUpAllSuffixes(str: string): string[] {
  let result: string[] = [];
  for (let i = 0; i < str.length; i++) {
    result.push(str.substring(i));
  }
  return result.sort();
}

test("Suffixes of abcabxabcd", () => {
  const suffixTrie = ukkonenAlgorithm("abcabxabcd");
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [""])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});

test("suffix of ezezeq", () => {
  const str = "ezezeq";
  const suffixTrie = ukkonenAlgorithm(str);
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});

test("Suffixes of Hamlet", () => {
  const str = `To be, or not to be, that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take Arms against a Sea of troubles,
And by opposing end them: to die, to sleep
No more; and by a sleep, to say we end
The heart-ache, and the thousand natural shocks
That Flesh is heir to? 'Tis a consummation
Devoutly to be wished. To die, to sleep,
To sleep, perchance to Dream; aye, there's the rub,
For in that sleep of death, what dreams may come,
When we have shuffled off this mortal coil,
Must give us pause.`;
  const suffixTrie = ukkonenAlgorithm(str);
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});

test("Suffixes of ぼっちゃん", () => {
  const str = `親譲りの無鉄砲で小供の時から損ばかりしている。小学校に居る時分学校の二階から飛び降りて一週間ほど腰を抜かした事がある。なぜそんな無闇をしたと聞く人があるかも知れぬ。別段深い理由でもない。新築の二階から首を出していたら、同級生の一人が冗談に、いくら威張っても、そこから飛び降りる事は出来まい。弱虫やーい。と囃したからである。小使に負ぶさって帰って来た時、おやじが大きな眼をして二階ぐらいから飛び降りて腰を抜かす奴があるかと云ったから、この次は抜かさずに飛んで見せますと答えた。親類のものから西洋製のナイフを貰って奇麗な刃を日に翳して、友達に見せていたら、一人が光る事は光るが切れそうもないと云った。切れぬ事があるか、何でも切ってみせると受け合った。そんなら君の指を切ってみろと注文したから、何だ指ぐらいこの通りだと右の手の親指の甲をはすに切り込んだ。幸ナイフが小さいのと、親指の骨が堅かったので、今だに親指は手に付いている。しかし創痕は死ぬまで消えぬ。`;
  const suffixTrie = ukkonenAlgorithm(str);
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});

test("Search abcabxabcd", () => {
  const str = "abcabxabcd";
  const suffixTrie = ukkonenAlgorithm(str);
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);

  const pattern = "abc";

  const matches_0 = fuzzySearchSuffixPatriciaTree(pattern, 0, suffixTrie);
  for (const match of matches_0) {
    expect(str.substring(match.start, match.end)).toBe(pattern);
  }

  const matches_1 = fuzzySearchSuffixPatriciaTree(pattern, 6, suffixTrie);
  let machtedStrs_1: string[] = [];
  for (const match of matches_1) {
    machtedStrs_1.push(str.substring(match.start, match.end));
  }
  expect(machtedStrs_1).toStrictEqual([
    "xabc",
    "bxabc",
    "abc",
    "abc",
    "cabxabc",
    "bcabxabc",
    "abxabc",
    "abcabxabc",
  ]);
});

test("Filter same start of abcabxabcd", () => {
  const str = "abcabxabcd";
  const suffixTrie = ukkonenAlgorithm(str);
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);

  const pattern = "abc";

  const matches_0 = filterOutOverlaps(
    fuzzySearchSuffixPatriciaTree(pattern, 6, suffixTrie)
  );

  let starts: Set<number> = new Set();
  for (const match of matches_0) {
    expect(starts.has(match.start)).toBe(false);
    starts.add(match.start);
  }
});
