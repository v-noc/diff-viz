import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

interface NodeMeta {
    type: "function" | "class";
    source: string;
    start_line: number;
    end_line: number;
    start_column: number;
    end_column: number;
}

/**
 * Gets the "name" of a function or class node, even if it's an anonymous
 * expression assigned to a variable or a class method.
 */
function getNodeName(path: NodePath): string {
    const { node, parent } = path;

    // Handles `function MyFunc() {}` and `class MyClass {}`
    if ("id" in node && node.id) {
        return node.id.name;
    }

    // Handles `const MyFunc = () => {}`
    if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
        return parent.id.name;
    }

    // Handles `class A { myMethod() {} }` and `const obj = { myMethod() {} }`
    if (t.isClassMethod(node) || t.isObjectMethod(node)) {
        if (t.isIdentifier(node.key)) {
            return node.key.name;
        }
    }

    return "(anonymous)";
}

/**
 * A direct TypeScript/Babel equivalent of the provided Python AST parser.
 */
export function parseCode(code: string): Record<string, NodeMeta> {
    const structure: Record<string, NodeMeta> = {};
    if (!code.trim()) return structure;

    const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
        errorRecovery: true,
    });

    /**
     * This is the equivalent of the Python `visit` function. It's a visitor
     * that will be applied recursively.
     */
    const visitor = {
        "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ClassDeclaration|ClassExpression|ClassMethod|ObjectMethod"(
            path: NodePath<any>
        ) {
            const name = getNodeName(path);
            const isClass = path.isClass() || path.isClassExpression();

            // Equivalent to `parents + [child.name]`
            const qualnameParts = [...(this.parents as string[]), name];
            const qualname = qualnameParts.join(".");

            const { node } = path;
            const { start, end, loc } = node;

            structure[qualname] = {
                type: isClass ? "class" : "function",
                source: code.slice(start ?? 0, end ?? 0),
                start_line: loc?.start.line ?? 0,
                end_line: loc?.end.line ?? 0,
                start_column: loc?.start.column ?? 0,
                end_column: loc?.end.column ?? 0,
            };

            // Recurse into children with the updated parent context.
            // This is the direct equivalent of `visit(child, qualname_parts)`.
            path.traverse(visitor, { parents: qualnameParts });

            // We handled the children manually, so skip Babel's default traversal.
            path.skip();
        },
    };

    // Start the traversal with an empty parent list.
    // This is the equivalent of the initial `visit(tree, [])` call.
    traverse(ast, visitor, undefined, { parents: [] });

    return structure;
}