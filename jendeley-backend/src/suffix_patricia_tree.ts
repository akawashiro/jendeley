type Edge = {
  id: number;
  start: number;
  end: number | "#";
  to: Node;
};

type Node = {
  id: number;
  edges: { [key: string]: Edge };
  suffixLink: Node | undefined;
};

type SuffixPatriciaTree = {
  str: string;
  root: Node;
};

let currentID = 0;

function getID(): number {
  const r = currentID;
  currentID++;
  return r;
}

function showGraph(
  node: Node,
  depth: number,
  buffer: string,
  str: string
): string {
  const indent = "    ".repeat(depth);
  buffer += `${indent}Node ${node.id} suffixLink:`;
  if (node.suffixLink !== undefined) {
    buffer += `${node.suffixLink.id},`;
  } else {
    buffer += "undefined,";
  }
  buffer += "\n";
  for (const key in node.edges) {
    const edge = node.edges[key];
    const edgeStr =
      edge.end == "#"
        ? str.substring(edge.start)
        : str.substring(edge.start, edge.end);
    buffer += `${indent}  Edge id:${edge.id} start:${edge.start} end:${edge.end} edgeStr:${edgeStr} to.id:${edge.to.id}\n`;
    buffer += showGraph(edge.to, depth + 1, "", str);
  }
  return buffer;
}

function ukkonenAlgorithm(str: string): SuffixPatriciaTree {
  const ROOT_NODE_ID = getID();
  let suffixTrie: SuffixPatriciaTree = {
    str: str,
    root: {
      id: ROOT_NODE_ID,
      edges: {},
      suffixLink: undefined,
    },
  };

  let remainder = 0;

  let activeNode = suffixTrie.root;
  let activeEdge = "";
  let activeLength = 0;

  for (let currentIndex = 0; currentIndex < str.length; currentIndex++) {
    remainder++;
    let lastNewNode: Node | undefined = undefined;
    while (remainder > 0) {
      // console.log(
      //   "activeNode.id:",
      //   activeNode.id,
      //   "activeEdge:",
      //   activeEdge,
      //   "activeLength:",
      //   activeLength,
      //   "remainder:",
      //   remainder,
      //   "currentIndex:",
      //   currentIndex,
      //   "remainder:",
      //   str.substring(currentIndex - remainder + 1, currentIndex + 1),
      //   "lastNewNode:",
      //   lastNewNode
      // );

      if (activeLength == 0) {
        activeEdge = str[currentIndex];
      }
      if (activeNode.edges[activeEdge] === undefined) {
        activeNode.edges[activeEdge] = {
          id: getID(),
          start: currentIndex,
          end: "#",
          to: {
            id: getID(),
            edges: {},
            suffixLink: undefined,
          },
        };
      } else {
        const activeEdgeStart = activeNode.edges[activeEdge].start;
        const activeEdgeEnd = activeNode.edges[activeEdge].end;
        const activeEdgeStr =
          activeEdgeEnd == "#"
            ? str.substring(
                activeNode.edges[activeEdge].start,
                currentIndex + 1
              )
            : str.substring(activeNode.edges[activeEdge].start, activeEdgeEnd);

        // Proceed activeNode.
        if (activeLength >= activeEdgeStr.length) {
          activeNode = activeNode.edges[activeEdge].to;
          activeLength -= activeEdgeStr.length;
          activeEdge = str[activeEdgeStart + activeEdgeStr.length];
          continue;
        }

        // Current character is already in the tree.
        // console.log(
        //   "activeEdgeStr[activeLength] = " +
        //     activeEdgeStr[activeLength] +
        //     " str[currentIndex] = " +
        //     str[currentIndex]
        // );
        if (activeEdgeStr[activeLength] == str[currentIndex]) {
          activeLength++;
          break;
        }

        // Split edge
        // console.log(
        //   "Split edge at activeLength:",
        //   activeLength,
        //   " activeEdgeStr:",
        //   activeEdgeStr,
        //   " activeNode.edges[activeEdge].to.edges:",
        //   activeNode.edges[activeEdge].to.edges
        // );
        const originalEdges = {};
        for (const k of Object.keys(activeNode.edges[activeEdge].to.edges)) {
          originalEdges[k] = activeNode.edges[activeEdge].to.edges[k];
        }

        activeNode.edges[activeEdge].to.edges = {};
        activeNode.edges[activeEdge].end = activeEdgeStart + activeLength;
        activeNode.edges[activeEdge].to.edges[activeEdgeStr[activeLength]] = {
          id: getID(),
          start: activeEdgeStart + activeLength,
          end: activeEdgeEnd,
          to: {
            id: getID(),
            edges: originalEdges,
            suffixLink: undefined,
          },
        };
        activeNode.edges[activeEdge].to.edges[str[currentIndex]] = {
          id: getID(),
          start: currentIndex,
          end: "#",
          to: {
            id: getID(),
            edges: {},
            suffixLink: undefined,
          },
        };
        if (lastNewNode !== undefined) {
          lastNewNode.suffixLink = activeNode.edges[activeEdge].to;
        }
        lastNewNode = activeNode.edges[activeEdge].to;
      }

      remainder--;
      if (activeNode.id == ROOT_NODE_ID && activeLength > 0) {
        activeLength--;
        activeEdge = str[currentIndex - remainder + 1];
      } else if (activeNode.id != ROOT_NODE_ID) {
        if (activeNode.suffixLink != undefined) {
          activeNode = activeNode.suffixLink;
        } else {
          activeNode = suffixTrie.root;
        }
      }
    }
  }

  return suffixTrie;
}

type Match = { start: number; end: number; score: number };

const MAX_MATCHES = 5;
const SCORE_REWARD_MATCHED = 8;
const SCORE_REWARD_UNMATCHED = -3;

function getEdgeLength(
  edge: Edge,
  suffixPatriciaTree: SuffixPatriciaTree
): number {
  if (edge.end == "#") {
    return suffixPatriciaTree.str.length - edge.start;
  } else {
    return edge.end - edge.start;
  }
}

function fuzzySearchDFS(
  pattern: string,
  patternIndex: number,
  suffixPatriciaTree: SuffixPatriciaTree,
  edge: Edge,
  edgeIndex: number,
  score: number,
  consumed: number,
  maxConsumed: number,
  matches: Set<string>
): Set<string> {
  const edgeStr =
    edge.end == "#"
      ? suffixPatriciaTree.str.substring(edge.start)
      : suffixPatriciaTree.str.substring(edge.start, edge.end);
  // console.log(
  //   "pattern:",
  //   pattern,
  //   "patternIndex:",
  //   patternIndex,
  //   "edgeStr:",
  //   edgeStr,
  //   "edgeIndex:",
  //   edgeIndex,
  //   "score:",
  //   score,
  //   "consumed:",
  //   consumed,
  //   "maxConsumed:",
  //   maxConsumed,
  //   "matches:",
  //   matches
  // );
  if (matches.size >= MAX_MATCHES) {
    return matches;
  } else if (getEdgeLength(edge, suffixPatriciaTree) === edgeIndex) {
    for (const [_, e] of Object.entries(edge.to.edges)) {
      const ms = fuzzySearchDFS(
        pattern,
        patternIndex,
        suffixPatriciaTree,
        e,
        0,
        score,
        consumed,
        maxConsumed,
        new Set<string>()
      );
      for (const m of ms) {
        matches.add(m);
      }
    }
    return matches;
  } else if (patternIndex === pattern.length) {
    const end = edge.start + edgeIndex;
    matches.add(
      JSON.stringify({
        start: end - consumed,
        end: end,
        score: score,
      })
    );
    return matches;
  } else if (consumed == maxConsumed) {
    return matches;
  } else if (
    pattern[patternIndex] === suffixPatriciaTree.str[edge.start + edgeIndex]
  ) {
    const ms1 = fuzzySearchDFS(
      pattern,
      patternIndex,
      suffixPatriciaTree,
      edge,
      edgeIndex + 1,
      score + SCORE_REWARD_UNMATCHED,
      consumed + 1,
      maxConsumed,
      new Set<string>()
    );
    for (const m of ms1) {
      matches.add(m);
    }
    const ms2 = fuzzySearchDFS(
      pattern,
      patternIndex + 1,
      suffixPatriciaTree,
      edge,
      edgeIndex + 1,
      score + SCORE_REWARD_MATCHED,
      consumed + 1,
      maxConsumed,
      new Set<string>()
    );
    for (const m of ms2) {
      matches.add(m);
    }
    return matches;
  } else {
    return fuzzySearchDFS(
      pattern,
      patternIndex,
      suffixPatriciaTree,
      edge,
      edgeIndex + 1,
      score + SCORE_REWARD_UNMATCHED,
      consumed + 1,
      maxConsumed,
      matches
    );
  }
}

function fuzzySearch(
  pattern: string,
  maxExtraChars: number,
  suffixPatriciaTree: SuffixPatriciaTree
): Set<Match> {
  if (suffixPatriciaTree.root.edges[pattern[0]] === undefined) {
    return new Set<Match>();
  } else {
    const ms = fuzzySearchDFS(
      pattern,
      1,
      suffixPatriciaTree,
      suffixPatriciaTree.root.edges[pattern[0]],
      1,
      SCORE_REWARD_MATCHED,
      1,
      pattern.length + maxExtraChars,
      new Set<string>()
    );
    let matches: Set<Match> = new Set<Match>();
    for (const m of ms) {
      matches.add(JSON.parse(m));
    }
    return matches;
  }
}

export type { Edge, Node, SuffixPatriciaTree };
export { ukkonenAlgorithm, showGraph, fuzzySearch };
