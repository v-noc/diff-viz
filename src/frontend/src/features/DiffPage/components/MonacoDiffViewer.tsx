import type { FC } from "react";
import { useEffect, useRef } from "react";
import * as Monaco from "monaco-editor";

interface MonacoDiffViewerProps {
  diffContent: string;
  fileName?: string;
  isLoading?: boolean;
  leftContent?: string;
  rightContent?: string;
  isConflict?: boolean;
}

const MonacoDiffViewer: FC<MonacoDiffViewerProps> = ({
  diffContent,
  isLoading = false,
  leftContent,
  rightContent,
  isConflict = false,
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    Monaco.editor.IStandaloneDiffEditor | Monaco.editor.IStandaloneCodeEditor | null
  >(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    if (isConflict && leftContent !== undefined && rightContent !== undefined) {
      // Create diff editor for conflict resolution
      const diffEditor = Monaco.editor.createDiffEditor(
        editorContainerRef.current,
        {
          theme: "vs-dark",
          readOnly: false,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          fontSize: 12,
          lineNumbers: "on",
          fontFamily: "'Fira Code', 'Courier New', monospace",
        }
      );

      // Detect language from file extension or default to javascript
      let language = "javascript";
      if (
        diffContent.includes("def ") ||
        diffContent.includes("class ") ||
        diffContent.includes("import ")
      ) {
        language = "python";
      } else if (
        diffContent.includes("function") ||
        diffContent.includes("const ") ||
        diffContent.includes("import")
      ) {
        language = "typescript";
      }

      const originalModel = Monaco.editor.createModel(
        leftContent,
        language
      );
      const modifiedModel = Monaco.editor.createModel(
        rightContent,
        language
      );

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });

      editorRef.current = diffEditor;

      const handleResize = () => {
        diffEditor.layout();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        diffEditor.dispose();
        originalModel.dispose();
        modifiedModel.dispose();
      };
    } else {
      // Create regular diff view
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

      const handleResize = () => {
        editor.layout();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        editor.dispose();
      };
    }
  }, [isConflict, leftContent, rightContent, diffContent]);

  // Update editor content when diffContent changes (for non-conflict view)
  useEffect(() => {
    if (
      !isConflict &&
      editorRef.current &&
      diffContent &&
      "setValue" in editorRef.current
    ) {
      editorRef.current.setValue(diffContent);
    }
  }, [diffContent, isConflict]);

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
