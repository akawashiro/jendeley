// ./node_modules/jest-cli/bin/jest.js src/suffix_trie.test.ts

import { Edge, Node, ukkonenAlgorithm, showGraph } from "./suffix_trie";

function listUpAllSuffixesFromSuffixTrie(node: Node, str: string): string[] {
  let result: string[] = [];
  for (const key in node.edges) {
    const edge = node.edges[key];
    if (edge.end == "#") {
      result.push(str.substring(edge.start));
    } else {
      const edgeStr = str.substring(edge.start, edge.end);
      const suffixes = listUpAllSuffixesFromSuffixTrie(edge.to, str);
      for (const suffix of suffixes) {
        result.push(edgeStr + suffix);
      }
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

test("Show edge", () => {
  const edge: Edge = {
    id: 1,
    start: 0,
    end: 1,
    to: {
      id: 2,
      edges: {},
      suffixLink: undefined,
    },
  };
  console.log(edge);
});

test("Construct suffix trie of abcabx", () => {
  const suffixTrie = ukkonenAlgorithm("abcabxabcd");
  // const suffixTrie = ukkonenAlgorithm("abcabx");
  const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  console.log(graphStr);
  const suffixes_trie = listUpAllSuffixesFromSuffixTrie(
    suffixTrie.root,
    suffixTrie.str
  );
  const suffixes_naive = listUpAllSuffixes(suffixTrie.str);
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});
