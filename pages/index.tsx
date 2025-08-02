import { FC } from "hono/jsx";
import { AppLayout } from "../layouts/app.layout.tsx";
import { Content, getContents } from "../repositories/content.repo.ts";

const contentsMap: Map<string, Content> = getContents();

export const IndexPage: FC = (_props) => {
  const description =
    "hi, and welcome to billy's directory. this is where i share all my articles on engineering tips, my experiments, and even some random thoughts. i hope you find something you like. ッ";
  const contents = Array.from(contentsMap.values()).reverse();
  return (
    <AppLayout description={description}>
      <p class="py-8 bg-base text-base-content">{description}</p>

      {contents.map((content: Content, index: number, arr: Content[]) => {
        return (
          <>
            <div class="py-4 bg-base text-base-content" key={content.title}>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 items-center">
                <small class="text-base-content/60">
                  {Intl.DateTimeFormat(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  }).format(new Date(content.createdAt))}
                </small>
                <small class="text-base-content/90 text-left sm:text-right">
                  {content.tags.map((h) => `#${h}`).join(" ")}
                </small>
              </div>

              <h1 class="flex-1 font-bold text-2xl my-4 md:my-2 hover:text-base-content/90">
                <a href={`/read/${content.slug}`}>{content.title}</a>
              </h1>

              <div class="line-clamp-5 md:line-clamp-3 text-base-content/90">
                {content.short}
              </div>

              <div class="px-4 py-2">
                <small>
                  <a href={`/read/${content.slug}`}>read more →</a>
                </small>
              </div>
            </div>
            {index < arr.length - 1 && <div class="divider my-0"></div>}
          </>
        );
      })}
    </AppLayout>
  );
};
