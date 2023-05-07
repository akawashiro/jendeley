// ./node_modules/jest-cli/bin/jest.js src/suffix_trie.test.ts

import { Edge, Node, ukkonenAlgorithm, showGraph } from "./suffix_trie";

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
  const suffixTrie = ukkonenAlgorithm("abcabx");
  const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  console.log(graphStr);
});
