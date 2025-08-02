import { Context, Hono } from "hono";
import { IndexPage } from "./pages/index.tsx";
import { serveStatic } from "hono/deno";
import { getContents } from "./repositories/content.repo.ts";
import { ReadPage } from "./pages/read.tsx";
import DP from "dompurify";
import { marked } from "marked";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DP(window);

const app = new Hono();

app.get("/", (c: Context) => {
  return c.html(<IndexPage />);
});

app.get("/read/:slug", (c: Context) => {
  const contents = getContents();
  const slug = c.req.param("slug");
  if (!contents.has(slug)) {
    return c.notFound();
  }

  const sanitizedContent = purify.sanitize(
    marked.parse(contents.get(slug)!.content),
  );
  return c.html(
    <ReadPage
      content={contents.get(slug)!}
      sanitizedContent={sanitizedContent}
    />,
  );
});

app.use("/*", serveStatic({ root: "./public" }));

Deno.serve(app.fetch);
