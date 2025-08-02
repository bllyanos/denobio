import { parse } from "@std/yaml";
import * as path from "@std/path";

export interface Content {
  title: string;
  slug: string;
  short: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

let contents: Map<string, Content> = new Map();

export function getContents() {
  return contents;
}

async function loadContents() {
  const dir = path.dirname(path.fromFileUrl(import.meta.url));
  const contentsDir = path.join(dir, "../contents");
  const contentsIter = Deno.readDir(contentsDir);

  const rawContents: string[] = [];
  for await (const entry of contentsIter) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      const entryContent = await Deno.readTextFile(
        path.join(contentsDir, entry.name)
      );
      rawContents.push(entryContent);
    }
  }

  let parsedContents: Content[] = [];
  for (const rawContent of rawContents) {
    parsedContents.push(parseContent(rawContent));
  }

  parsedContents = parsedContents.sort((a, b) => {
    const aDate = new Date(a.createdAt);
    const bDate = new Date(b.createdAt);
    return aDate.getTime() - bDate.getTime();
  });

  const contentMap = new Map<string, Content>();
  for (const content of parsedContents) {
    contentMap.set(content.slug, content);
    console.log("[Content Loader] found", content.slug);
  }

  contents = contentMap;
}

const DELIMITER = "%%split%%";

function parseContent(content: string) {
  const [meta, body] = content.split(DELIMITER).map((s) => s.trim());

  // deno-lint-ignore no-explicit-any
  const parsedMeta: any = parse(processMeta(meta));
  return {
    ...parsedMeta,
    content: body,
  };
}

function processMeta(rawMeta: string): string {
  const lines = rawMeta.split("\n");
  return lines.slice(1, lines.length - 1).join("\n");
}

await loadContents();
