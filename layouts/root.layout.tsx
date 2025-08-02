import { FC } from "hono/jsx";
import { html } from "hono/html";

export const RootLayout: FC = (props) => {
  const description = props.description ?? "billy's directory";
  return html`
    <!DOCTYPE html>
    <html lang="en" data-theme="black">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="${description}" />
        <title>billy's directory</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="stylesheet" href="/style.css" />
        <!-- For Android Chrome -->
        <meta name="theme-color" content="#000" />

        <!-- For iOS Safari -->
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body class="font-mono px-2 md:px-0">
        ${props.children}
      </body>
    </html>
  `;
};
