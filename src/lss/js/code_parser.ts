import { parse } from "@babel/parser"
import traverse from "@babel/traverse"
// parse_code.ts

interface NodeMeta {
    type: "function" | "class"
    source: string
    start_line: number
    end_line: number
    start_column: number
    end_column: number
}

export function parseCode(code: string): Record<string, NodeMeta> {
    const structure: Record<string, NodeMeta> = {}

    if (!code.trim()) return structure

    const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
    })

    const parents: string[] = []

    traverse(ast, {
        enter(path) {
            if (
                path.isFunctionDeclaration() ||
                path.isClassDeclaration() ||
                path.isFunctionExpression() ||
                path.isArrowFunctionExpression()
            ) {
                const node: any = path.node
                const isClass = path.isClassDeclaration()

                const name =
                    node.id?.name ??
                    (isClass ? "(anonymous class)" : "(anonymous function)")

                const qualname = [...parents, name].join(".")
                const { start, end, loc } = node

                const srcSegment = code.slice(start ?? 0, end ?? 0)

                structure[qualname] = {
                    type: isClass ? "class" : "function",
                    source: srcSegment,
                    start_line: loc?.start.line ?? 0,
                    end_line: loc?.end.line ?? 0,
                    start_column: loc?.start.column ?? 0,
                    end_column: loc?.end.column ?? 0,
                }
            }
        },

        // Maintain class and function nesting hierarchy
        FunctionDeclaration: {
            enter(path) {
                if (path.node.id) parents.push(path.node.id.name)
            },
            exit(path) {
                if (path.node.id) parents.pop()
            },
        },
        ClassDeclaration: {
            enter(path) {
                if (path.node.id) parents.push(path.node.id.name)
            },
            exit(path) {
                if (path.node.id) parents.pop()
            },
        },
    })

    return structure
}
