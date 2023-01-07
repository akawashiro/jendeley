import path from "path";

function concatDirs(dirs: string[]): string {
  return path.sep + dirs.join(path.sep);
}

export { concatDirs };
