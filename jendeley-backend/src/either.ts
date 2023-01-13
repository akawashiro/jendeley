type Either<L, R> = { _tag: "left"; left: L } | { _tag: "right"; right: R };

function genRight<R>(r: R): { _tag: "right"; right: R } {
  return { _tag: "right", right: r };
}

function genLeft<L>(l: L): { _tag: "left"; left: L } {
  return { _tag: "left", left: l };
}

function isRight<L, R>(e: Either<L, R>) {
  return e._tag === "right";
}

export type { Either };
export { genRight, genLeft, isRight };
