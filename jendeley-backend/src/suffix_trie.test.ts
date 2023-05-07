// ./node_modules/jest-cli/bin/jest.js src/suffix_trie.test.ts

import { Edge, Node, ukkonenAlgorithm, showGraph } from "./suffix_trie";

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

test("Construct suffix trie of abcabxabcd", () => {
  const suffixTrie = ukkonenAlgorithm("abcabxabcd");
  const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [""])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  console.log(suffixes_trie);
  console.log(suffixes_naive);
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});

test("Construct suffix trie of ezezeq", () => {
  const shakespear = "ezezeq";
  const suffixTrie = ukkonenAlgorithm(shakespear);
  const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  console.log(suffixes_trie);
  console.log(suffixes_naive);
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});
