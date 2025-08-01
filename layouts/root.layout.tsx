import { FC } from "hono/jsx";
import { html } from "hono/html";

export const RootLayout: FC = (props) => {
  return html`
    <!DOCTYPE html>
    <html lang="en" data-theme="black">
      <head>
        <title>Bllyanos</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body class="font-mono">
        ${props.children}
      </body>
    </html>
  `;
};
