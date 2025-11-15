// rpc-server.ts
import { Elysia } from "elysia";
import { parseCode } from "./code_parser";

const languageConfig = {
    typescript: {
        method: "parse_typescript_code",
        port: 5001,
        extensions: [".ts", ".tsx"],
    },
    javascript: {
        method: "parse_javascript_code",
        port: 5001,
        extensions: [".js", ".jsx"],
    },
} as const;

const rpcMethods = {
    getUser: ({ id }: { id: number }) => ({ id, name: "Alice" }),
    add: ({ a, b }: { a: number; b: number }) => a + b,
    [languageConfig.typescript.method]: ({ code }: { code: string }) =>
        parseCode(code),
    [languageConfig.javascript.method]: ({ code }: { code: string }) =>
        parseCode(code),
};

const app = new Elysia().post("/api/v1/jsonrpc", async ({ body }) => {
    try {
        const { id, method, params, jsonrpc } = body as { id: number; method: string; params: any; jsonrpc: string };

        if (jsonrpc !== "2.0" || !rpcMethods[method as keyof typeof rpcMethods]) {
            return {
                jsonrpc: "2.0",
                error: { code: -32601, message: "Method not found" },
                id,
            };
        }

        const result = await rpcMethods[method as keyof typeof rpcMethods](params);
        return { jsonrpc: "2.0", result, id };
    } catch (e: any) {
        return {
            jsonrpc: "2.0",
            error: { code: -32000, message: e?.message ?? "Internal Error" },
            id: null,
        };
    }
});

app.listen(languageConfig.typescript.port);
console.log(
    `🦊 JSON-RPC server on http://localhost:${languageConfig.typescript.port}/api/v1/jsonrpc`,
);