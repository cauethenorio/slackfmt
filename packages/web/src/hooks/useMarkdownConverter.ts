import { convert } from "@slackfmt/core";
import { useEffect, useState } from "react";

export function useMarkdownConverter(markdown: string) {
  const hasContent = markdown.trim().length > 0;
  const [deltaJson, setDeltaJson] = useState<string | null>(null);

  useEffect(() => {
    if (!hasContent) {
      setDeltaJson(null);
      return;
    }

    let cancelled = false;
    convert(markdown, { format: "markdown" })
      .then((result) => {
        if (!cancelled) setDeltaJson(result);
      })
      .catch(() => {
        if (!cancelled) setDeltaJson(null);
      });

    return () => {
      cancelled = true;
    };
  }, [markdown, hasContent]);

  return { deltaJson, hasContent };
}
