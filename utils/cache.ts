import * as path from "@std/path";
import * as fs from "@std/fs";

const metaPath = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "../meta",
);
const hashKeyPath = path.join(metaPath, "hashkey");

let hashKey: string | undefined;

export function asset(path: string): string {
  if (!hashKey) {
    return path;
  }

  const [ext, ...rest] = path.split(".").reverse();
  return [ext, hashKey, ...rest].reverse().join(".");
}

export function getHashKey() {
  return hashKey;
}

async function loadHashkey() {
  if (!(await fs.exists(hashKeyPath))) {
    return;
  }

  const hk = await Deno.readTextFile(hashKeyPath);
  hashKey = hk.trim();
}

await loadHashkey();
