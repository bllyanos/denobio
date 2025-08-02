import { FC } from "hono/jsx";
import { html } from "hono/html";
import { asset } from "../utils/cache.ts";

export const RootLayout: FC = (props) => {
  const description = props.description ?? "billy's directory";

  const stylePath = asset("/style.css");
  const faviconPath = asset("/favicon.svg");

  return html`
    <!DOCTYPE html>
    <html lang="en" data-theme="black">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${description}" />

        <title>billy's directory</title>
        <link rel="icon" type="image/svg+xml" href="${faviconPath}" />

        <!-- assets -->
        <link rel="stylesheet" href="${stylePath}" />

        <!-- For Android Chrome -->
        <meta name="theme-color" content="#000" />

        <!-- For iOS Safari -->
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/styles/base16/bright.min.css"
        />
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/elixir.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/javascript.min.js"></script>

        <script>
          hljs.highlightAll();
        </script>
      </head>
      <body class="font-mono px-2 md:px-0">
        ${props.children}
      </body>
    </html>
  `;
};
