import { useCallback, useState } from "react";
import { copyFromEditor } from "../utils/clipboard";

export function useClipboard(deltaJson: string | null) {
  const [flash, setFlash] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!deltaJson) return;
    try {
      await copyFromEditor(deltaJson);
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
    } catch {
      // Clipboard write failed silently — no flash shown
    }
  }, [deltaJson]);

  return { flash, handleCopy };
}
