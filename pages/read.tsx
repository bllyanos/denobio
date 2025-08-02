import { FC } from "hono/jsx";
import { Content } from "../repositories/content.repo.ts";
import { AppLayout } from "../layouts/app.layout.tsx";

export const ReadPage: FC<{ content: Content; sanitizedContent: string }> = ({
  content,
  sanitizedContent,
}) => {
  return (
    <AppLayout additionalTitle="/read" description={content.short}>
      <div class="py-4 flex flex-row gap-2 flex-wrap">
        {content.tags.map((h) => (
          <small key={h}>#{h}</small>
        ))}
      </div>
      <div class="py-4 bg-base text-base-content flex flex-col">
        <article
          class="prose prose-sm md:prose-base w-full max-w-none prose-pre:p-0"
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
        />
      </div>
    </AppLayout>
  );
};
