import type { ProjectTreeNode } from "./types";

export const demoProjectTree: ProjectTreeNode[] = [
    {
        id: "graph_builder.py",
        label: "graph_builder.py",
        kind: "file",
        status: "modified",
        path: "src/parser/graph_builder.py",
        children: [
            {
                id: "graph_builder.class",
                label: "class GraphBuilder",
                kind: "symbol",
                status: "modified",
                children: [
                    {
                        id: "graph_builder.build",
                        label: "build()",
                        kind: "symbol",
                        status: "modified",
                    },
                    {
                        id: "graph_builder.optimize",
                        label: "optimize()",
                        kind: "symbol",
                        status: "modified",
                    },
                ],
            },
        ],
    },
    {
        id: "legacy.py",
        label: "legacy.py",
        kind: "file",
        status: "removed",
        path: "src/parser/legacy.py",
        children: [
            {
                id: "legacy.class",
                label: "class Legacy",
                kind: "symbol",
                status: "removed",
            },
        ],
    },
    {
        id: "new_feature.py",
        label: "new_feature.py",
        kind: "file",
        status: "added",
        path: "src/parser/new_feature.py",
        children: [
            {
                id: "new_feature.activate",
                label: "activate()",
                kind: "symbol",
                status: "added",
            },
        ],
    },
];


