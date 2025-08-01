import { FC } from "hono/jsx";
import { RootLayout } from "./root.layout.tsx";

export const AppLayout: FC = (props) => {
  return (
    <RootLayout>
      <div class="bg-base text-base-content">
        <div class="navbar mt-4 px-2 py-4 container max-w-screen-md mx-auto">
          <div class="flex-1 flex flex-col">
            <a class="text-xl font-bold">~/bllyanos</a>
            <small>billy's directory</small>
          </div>

          <div class="flex-none flex flex-row gap-4">
            <a href="/">index</a>
            <a href="/about">about</a>
            <a href="/about">contact</a>
          </div>
        </div>
      </div>

      <div class="divider my-0"></div>

      <div class="content p-2 container max-w-screen-md mx-auto">
        {props.children}
      </div>

      <div class="divider mt-6 md:mt-20"></div>

      <footer>
        <div class="py-8 container max-w-screen-md mx-auto">
          <div class="flex flex-row gap-4 items-center">
            <small class="text-base-content/70">&copy; 2025 bllyanos</small>
          </div>
        </div>
      </footer>
    </RootLayout>
  );
};
