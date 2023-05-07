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
  // const graphStr = showGraph(suffixTrie.root, 0, "", suffixTrie.str);
  // console.log(graphStr);
  const suffixes_trie = new Set(
    listUpAllSuffixesFromSuffixTrie(suffixTrie.root, suffixTrie.str, [""])
  );
  const suffixes_naive = new Set(listUpAllSuffixes(suffixTrie.str));
  expect(suffixes_trie).toStrictEqual(suffixes_naive);
});

test("Construct suffix trie of ezezeq", () => {
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

test("Construct suffix trie of Hamlet", () => {
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
