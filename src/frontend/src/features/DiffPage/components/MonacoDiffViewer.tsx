import type { FC } from "react";
import { useEffect, useRef } from "react";
import * as Monaco from "monaco-editor";

interface MonacoDiffViewerProps {
  diffContent: string;
  fileName?: string;
  isLoading?: boolean;
}

const MonacoDiffViewer: FC<MonacoDiffViewerProps> = ({
  diffContent,
  isLoading = false,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Initialize editor
    const editor = Monaco.editor.create(editorContainerRef.current, {
      value: diffContent || "",
      language: "diff",
      theme: "vs-dark",
      readOnly: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      fontSize: 12,
      lineNumbers: "on",
      fontFamily: "'Fira Code', 'Courier New', monospace",
    });

    editorRef.current = editor;

    // Handle window resize
    const handleResize = () => {
      editor.layout();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      editor.dispose();
    };
  }, [diffContent]);

  // Update editor content when diffContent changes
  useEffect(() => {
    if (editorRef.current && diffContent) {
      editorRef.current.setValue(diffContent);
    }
  }, [diffContent]);

  return (
    <div
      className="flex h-full flex-col rounded-md border bg-background text-xs overflow-hidden"
      ref={editorContainerRef}
      style={{ height: "100%" }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <p className="text-sm text-muted-foreground">Loading diff…</p>
        </div>
      )}
    </div>
  );
};

export default MonacoDiffViewer;
