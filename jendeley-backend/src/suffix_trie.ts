import assert from "assert";

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

type SuffixTrie = {
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

function ukkonenAlgorithm(str: string): SuffixTrie {
  const ROOT_NODE_ID = getID();
  let suffixTrie: SuffixTrie = {
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
      console.log(
        "activeNode.id:",
        activeNode.id,
        "activeEdge:",
        activeEdge,
        "activeLength:",
        activeLength,
        "remainder:",
        remainder,
        "currentIndex:",
        currentIndex,
        "remainder:",
        str.substring(currentIndex - remainder + 1, currentIndex + 1),
        "lastNewNode:",
        lastNewNode
      );
      console.log(
        showGraph(suffixTrie.root, 0, "", str.substring(0, currentIndex))
      );

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
        console.log(
          "activeEdgeStr[activeLength] = " +
            activeEdgeStr[activeLength] +
            " str[currentIndex] = " +
            str[currentIndex]
        );
        if (activeEdgeStr[activeLength] == str[currentIndex]) {
          activeLength++;
          break;
        }

        // Split edge
        console.log(
          "Split edge at activeLength:",
          activeLength,
          " activeEdgeStr:",
          activeEdgeStr
        );
        activeNode.edges[activeEdge].end = activeEdgeStart + activeLength;
        activeNode.edges[activeEdge].to.edges[activeEdgeStr[activeLength]] = {
          id: getID(),
          start: activeEdgeStart + activeLength,
          end: activeEdgeEnd,
          to: {
            id: getID(),
            edges: {},
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
        console.log(lastNewNode);
        if (lastNewNode !== undefined) {
          lastNewNode.suffixLink = activeNode.edges[activeEdge].to;
        }
        lastNewNode = activeNode.edges[activeEdge].to;
      }

      remainder--;
      if (activeNode.id == ROOT_NODE_ID && activeLength > 0) {
        activeLength--;
        activeEdge = str[currentIndex - remainder + 1];
      } else if (
        activeNode.id != ROOT_NODE_ID &&
        activeNode.suffixLink != undefined
      ) {
        activeNode = activeNode.suffixLink;
      }
    }
  }

  return suffixTrie;
}

export type { Edge, Node, SuffixTrie };
export { ukkonenAlgorithm, showGraph };
