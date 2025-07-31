import { FC } from "hono/jsx";
import { AppLayout } from "../layouts/app.layout.tsx";

export const IndexPage: FC = (_props) => {
  return (
    <AppLayout>
      <div>
        <h1>Index Page</h1>
      </div>
    </AppLayout>
  );
};
