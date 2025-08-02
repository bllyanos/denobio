import { FC } from "hono/jsx";
import { Content } from "../repositories/content.repo.ts";
import { AppLayout } from "../layouts/app.layout.tsx";

export const ReadPage: FC<{ content: Content; sanitizedContent: string }> = ({
  content,
  sanitizedContent,
}) => {
  return (
    <AppLayout additionalTitle="/read">
      <div class="py-4 flex flex-row gap-2">
        {content.tags.map((h) => <small key={h}>#{h}</small>)}
      </div>
      <div class="py-4 bg-base text-base-content flex flex-col">
        <article
          class="prose prose-sm w-full max-w-none"
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
        />
      </div>
    </AppLayout>
  );
};
