import { FC } from "hono/jsx";
import { RootLayout } from "./root.layout.tsx";

export const AppLayout: FC = (props) => {
  return (
    <RootLayout>
      <div class="bg-primary text-primary-content">
        <div class="navbar px-2 container mx-auto shadow-sm">
          <a class="text-xl font-bold">bllyanos</a>
        </div>
      </div>
      <div class="content py-4 px-2 container mx-auto">{props.children}</div>
    </RootLayout>
  );
};
