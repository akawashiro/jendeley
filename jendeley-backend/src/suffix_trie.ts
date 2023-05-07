type Edge = {
  id: number;
  start: number;
  end: number | "#";
  to: Node;
};

type Node = {
  id: number;
  edges: { [key: string]: Edge };
  suffixLinks: Node[];
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
  buffer += `${indent}Node ${node.id} suffixLinks:[`;
  for (const suffixLink of node.suffixLinks) {
    buffer += `${suffixLink.id},`;
  }
  buffer += "]\n";
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
  let suffixTrie: SuffixTrie = {
    str: str,
    root: {
      id: getID(),
      edges: {},
      suffixLinks: [],
    },
  };

  let remainder = 0;

  let active_node = suffixTrie.root;
  let active_edge = "";
  let active_length = 0;

  for (let currentIndex = 0; currentIndex < str.length; currentIndex++) {
    remainder++;

    if (active_node.edges[str[currentIndex]] === undefined) {
      remainder--;
      active_node.edges[str[currentIndex]] = {
        id: getID(),
        start: currentIndex,
        end: "#",
        to: {
          id: getID(),
          edges: {},
          suffixLinks: [],
        },
      };
    } else {
    }
  }

  return suffixTrie;
}

export type { Edge, Node, SuffixTrie };
export { ukkonenAlgorithm, showGraph };
