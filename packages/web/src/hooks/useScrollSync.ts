import { useEffect, useRef } from "react";

export function useScrollSync(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  quillScrollRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const scrollingFrom = useRef<"textarea" | "quill" | null>(null);
  const attachedQuillEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const textarea = textareaRef.current;

    function syncScroll(source: "textarea" | "quill") {
      const quillEl = quillScrollRef.current;
      if (!textarea || !quillEl) return;
      if (scrollingFrom.current && scrollingFrom.current !== source) return;

      scrollingFrom.current = source;

      const from = source === "textarea" ? textarea : quillEl;
      const to = source === "textarea" ? quillEl : textarea;
      const maxFrom = from.scrollHeight - from.clientHeight;
      const maxTo = to.scrollHeight - to.clientHeight;
      if (maxFrom > 0 && maxTo > 0) {
        to.scrollTop = (from.scrollTop / maxFrom) * maxTo;
      }

      requestAnimationFrame(() => {
        scrollingFrom.current = null;
      });
    }

    const onTextareaScroll = () => syncScroll("textarea");
    const onQuillScroll = () => syncScroll("quill");

    textarea?.addEventListener("scroll", onTextareaScroll, { passive: true });

    // The Quill DOM element may be created/destroyed asynchronously
    // (e.g. by QuillPane's useEffect), so we poll for changes to the ref
    // and re-attach the listener when the element changes.
    function attachQuillListener() {
      const quillEl = quillScrollRef.current;
      if (quillEl === attachedQuillEl.current) return;

      if (attachedQuillEl.current) {
        attachedQuillEl.current.removeEventListener("scroll", onQuillScroll);
      }

      attachedQuillEl.current = quillEl;
      if (quillEl) {
        quillEl.addEventListener("scroll", onQuillScroll, { passive: true });
      }
    }

    attachQuillListener();
    const intervalId = setInterval(attachQuillListener, 100);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      textarea?.removeEventListener("scroll", onTextareaScroll);
      if (attachedQuillEl.current) {
        attachedQuillEl.current.removeEventListener("scroll", onQuillScroll);
        attachedQuillEl.current = null;
      }
    };
  }, [enabled, textareaRef, quillScrollRef]);
}
