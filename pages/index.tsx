import { FC } from "hono/jsx";
import { AppLayout } from "../layouts/app.layout.tsx";

interface Content {
  title: string;
  content: string;
  createdAt: string;
  hastags: string[];
}

const contents: Content[] = [
  {
    title: "Simple Caching Strategies",
    content:
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    createdAt: new Date().toISOString(),
    hastags: ["test", "test2"],
  },
  {
    title: "Simple Caching Strategies",
    content:
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    createdAt: new Date().toISOString(),
    hastags: ["test", "test2"],
  },
  {
    title: "Simple Caching Strategies",
    content:
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    createdAt: new Date().toISOString(),
    hastags: ["test", "test2"],
  },
  {
    title: "Simple Caching Strategies",
    content:
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua" +
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    createdAt: new Date().toISOString(),
    hastags: ["test", "test2"],
  },
];

export const IndexPage: FC = (_props) => {
  return (
    <AppLayout>
      <p class="py-8 bg-base text-base-content text-justify">
        lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua lorem ipsum dolor sit
        amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua lorem ipsum dolor sit amet consectetur
        adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua
      </p>

      {contents.map((content: Content, index: number, arr: Content[]) => {
        return (
          <>
            <div class="py-4 bg-base text-base-content" key={content.title}>
              <div class="flex flex-row gap-4 justify-start items-center">
                <small class="text-base-content/70">
                  {Intl.DateTimeFormat(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  }).format(new Date(content.createdAt))}
                </small>
                <small class="text-base-content/70">
                  {content.hastags.map((h) => `#${h}`).join(" ")}
                </small>
              </div>

              <h1 class="flex-1 font-bold text-2xl my-2 hover:text-base-content/90">
                <a href="/">{content.title}</a>
              </h1>

              <div class="line-clamp-3 text-justify text-base-content/90">
                {content.content}
              </div>

              <div class="px-4 py-2">
                <small>
                  <a href="/">read more →</a>
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
