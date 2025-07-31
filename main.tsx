import { Context, Hono } from "hono";
import { IndexPage } from "./pages/index.tsx";
import { serveStatic } from "hono/deno";

const app = new Hono();

app.get("/", (c: Context) => {
  return c.html(<IndexPage />);
});

app.use("/*", serveStatic({ root: "./public" }));

Deno.serve(app.fetch);
