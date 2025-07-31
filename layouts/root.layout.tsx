import { FC } from "hono/jsx";
import { html } from "hono/html";

export const RootLayout: FC = (props) => {
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Bllyanos</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        ${props.children}
      </body>
    </html>
  `;
};
