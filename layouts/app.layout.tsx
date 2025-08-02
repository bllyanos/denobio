import { FC, PropsWithChildren } from "hono/jsx";
import { RootLayout } from "./root.layout.tsx";

export const AppLayout: FC<
  PropsWithChildren<{ description?: string; additionalTitle?: string }>
> = (props) => {
  // const title = `~/bllyanos${props.additionalTitle ?? ""}`;
  const title = `~/bllyanos`;
  return (
    <RootLayout description={props.description}>
      <div class="bg-base text-base-content">
        <div class="navbar mt-4 px-2 py-4 container max-w-screen-md mx-auto">
          <div class="flex-1 flex flex-col">
            <a href="/" class="text-xl font-bold">
              {title}
            </a>
            <small>billy's directory</small>
          </div>

          <div class="flex-none flex flex-row gap-2">
            <a href="/">index</a>
            <a target="_blank" href="https://github.com/bllyanos">
              github
            </a>
            <a target="_blank" href="https://threads.com/bllyanos">
              threads
            </a>
          </div>
        </div>
      </div>

      <div class="divider my-0"></div>

      <div class="content p-2 container max-w-screen-md mx-auto">
        {props.children}
      </div>

      <div class="divider mt-6 md:mt-20"></div>

      <footer>
        <div class="py-8 px-2 container max-w-screen-md mx-auto">
          <div class="flex flex-row gap-4 items-center">
            <small class="text-base-content/70">&copy; 2025 bllyanos</small>
          </div>
        </div>
      </footer>
    </RootLayout>
  );
};
