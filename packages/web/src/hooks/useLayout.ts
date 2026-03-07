import { useCallback, useState } from "react";

type Layout = "md-large" | "equal" | "preview-large";

const layoutOrder: Layout[] = ["equal", "md-large", "preview-large"];

const layoutClasses: Record<Layout, [string, string]> = {
  "md-large": ["flex-[2] md:flex-none md:w-2/3", "flex-1 md:flex-none md:w-1/3"],
  equal: ["flex-1 md:flex-none md:w-1/2", "flex-1 md:flex-none md:w-1/2"],
  "preview-large": ["flex-1 md:flex-none md:w-1/3", "flex-[2] md:flex-none md:w-2/3"],
};

export function useLayout() {
  const [layout, setLayout] = useState<Layout>("equal");

  const cycleLayout = useCallback(() => {
    setLayout((prev) => {
      const idx = layoutOrder.indexOf(prev);
      return layoutOrder[(idx + 1) % layoutOrder.length];
    });
  }, []);

  const [mdClasses, previewClasses] = layoutClasses[layout];

  return { layout, cycleLayout, mdClasses, previewClasses };
}
