import type { ProjectTreeNode } from "./ProjectTree/types";

/**
 * Demo unified-diff content keyed by file path.
 * Replace this with real diff payloads from the backend later.
 */
export const demoDiffByPath: Record<string, string> = {
    "src/parser/graph_builder.py": `
diff --git a/src/parser/graph_builder.py b/src/parser/graph_builder.py
--- a/src/parser/graph_builder.py
+++ b/src/parser/graph_builder.py
@@ -1,6 +1,17 @@
 class GraphBuilder:
-    def build(self):
-        # old implementation
-        return True
+    def __init__(self, optimize: bool = False) -> None:
+        self.optimize = optimize
+
+    def build(self) -> bool:
+        # new optimized build flow
+        if self.optimize:
+            self._run_optimizer()
+        return True
+
+    def _run_optimizer(self) -> None:
+        # added optimization
+        pass
`.trim(),
    "src/parser/legacy.py": `
diff --git a/src/parser/legacy.py b/src/parser/legacy.py
deleted file mode 100644
index 0000001..0000000
--- a/src/parser/legacy.py
+++ /dev/null
@@ -1,5 +0,0 @@
-class Legacy:
-    def build(self):
-        # legacy implementation
-        return False
`.trim(),
    "src/parser/new_feature.py": `
diff --git a/src/parser/new_feature.py b/src/parser/new_feature.py
new file mode 100644
index 0000000..0000003
--- /dev/null
+++ b/src/parser/new_feature.py
@@ -0,0 +1,8 @@
+class NewFeature:
+    def activate(self) -> None:
+        # new feature entrypoint
+        print("Activating new feature...")
`.trim(),
};

export const resolveDemoPath = (node: ProjectTreeNode | null | undefined) =>
    node?.path && demoDiffByPath[node.path] ? node.path : "src/parser/graph_builder.py";


