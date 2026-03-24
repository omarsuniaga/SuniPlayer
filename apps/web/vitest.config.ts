import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// react-dom@18.3.1 in the root node_modules ships its own copy of react@18.3.1 to avoid
// a version mismatch with the hoisted root react@19.2.0 (brought in by expo/native).
// We alias the test-side "react" imports to that same copy so both sides share one instance.
const reactDomReact = path.resolve(
    __dirname,
    "../../node_modules/react-dom/node_modules/react"
);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: [
            { find: /^react$/, replacement: path.join(reactDomReact, "index.js") },
            { find: /^react\/jsx-runtime$/, replacement: path.join(reactDomReact, "jsx-runtime.js") },
            { find: /^react\/jsx-dev-runtime$/, replacement: path.join(reactDomReact, "jsx-dev-runtime.js") },
        ],
        dedupe: ["react", "react-dom"],
    },
    test: {
        environment: "jsdom",
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"],
        testTimeout: 10000,
        setupFiles: ["./src/test-setup.ts"],
    },
});
