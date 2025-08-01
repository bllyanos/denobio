import { FC } from "hono/jsx";
import { html } from "hono/html";

export const RootLayout: FC = (props) => {
  return html`
    <!DOCTYPE html>
    <html lang="en" data-theme="black">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>billy's directory</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body class="font-mono px-2 md:px-0">
        ${props.children}
      </body>
    </html>
  `;
};
