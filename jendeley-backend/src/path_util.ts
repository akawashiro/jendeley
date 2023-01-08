import path from "path";
import os from "os";

function concatDirs(dirs: string[]): string {
  if (os.platform() === "win32") {
    return dirs.join(path.sep);
  } else {
    return path.sep + dirs.join(path.sep);
  }
}

function showDirs(dirs: string[]): string {
  let r = "[";
  for (const d of dirs) {
    r = r + '"' + d + '", ';
  }
  r = r + "]";
  return r;
}

function pathStrToDirs(pathStr: string): string[] {
  return pathStr.split(path.sep).filter((x) => x != "");
}

function isEqualDirs(d1: string[], d2: string[]) {
  if (d1.length != d2.length) {
    return false;
  }
  for (let i = 0; i < d1.length; i++) {
    if (d1[i] != d2[i]) {
      return false;
    }
  }
  return true;
}

function isChild(childDir: string[], parentDir: string[]) {
  if (childDir.length <= parentDir.length) {
    return false;
  }
  for (let i = 0; i < parentDir.length; i++) {
    if (parentDir[i] != childDir[i]) {
      return false;
    }
  }
  return true;
}

export { concatDirs, showDirs, pathStrToDirs, isEqualDirs, isChild };
