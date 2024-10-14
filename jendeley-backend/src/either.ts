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

function isLeft<L, R>(e: Either<L, R>) {
  return e._tag === "left";
}

function getLeft<L, R>(e: Either<L, R>) {
  if (e._tag === "left") {
    return e.left;
  } else {
    throw new Error(e + " is not a left");
  }
}

function getRight<L, R>(e: Either<L, R>) {
  if (e._tag === "right") {
    return e.right;
  } else {
    throw new Error(e + " is not a right");
  }
}

export type { Either };
export { genRight, genLeft, isRight, isLeft, getLeft, getRight };
