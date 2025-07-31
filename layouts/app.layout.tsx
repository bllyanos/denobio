import { FC } from "hono/jsx";
import { RootLayout } from "./root.layout.tsx";

export const AppLayout: FC = (props) => {
  return (
    <RootLayout>
      <div>Navbar</div>
      <div class="content">{props.children}</div>
    </RootLayout>
  );
};
