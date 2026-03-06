import Quill from "quill";
import "quill/dist/quill.core.css";
import "../quill.css";
import { useEffect, useRef } from "react";

const FORMATS = [
  "bold",
  "italic",
  "strike",
  "code",
  "link",
  "list",
  "indent",
  "blockquote",
  "code-block",
];

interface QuillPaneProps {
  deltaJson: string | null;
  scrollRef?: React.MutableRefObject<HTMLElement | null>;
}

export function QuillPane({ deltaJson, scrollRef }: QuillPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editorDiv = document.createElement("div");
    container.appendChild(editorDiv);

    const quill = new Quill(editorDiv, {
      theme: "snow",
      modules: { toolbar: false },
      formats: FORMATS,
      readOnly: true,
    });

    quillRef.current = quill;

    if (scrollRef) {
      scrollRef.current = quill.root;
    }

    return () => {
      quillRef.current = null;
      if (scrollRef) scrollRef.current = null;
      container.innerHTML = "";
    };
  }, [scrollRef]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || !deltaJson) {
      if (quill) quill.setContents([]);
      return;
    }

    const delta = JSON.parse(deltaJson);
    quill.setContents(delta, "silent");
  }, [deltaJson]);

  return <div ref={containerRef} className="flex-1 min-h-0 flex flex-col" />;
}
