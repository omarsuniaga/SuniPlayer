// React 18 test environment setup
import React from "react";
import ReactDOM from "react-dom";
import ReactDOMClient from "react-dom/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

const _origCreateRoot = ReactDOMClient.createRoot.bind(ReactDOMClient);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flushSync = (ReactDOM as any).flushSync as (fn: () => void) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ReactDOMClient as any).createRoot = function patchedCreateRoot(container: Element, options?: unknown) {
    const root = _origCreateRoot(container, options as Parameters<typeof _origCreateRoot>[1]);
    const _origRender = root.render.bind(root);
    root.render = function syncRender(element: React.ReactNode) {
        flushSync(() => {
            _origRender(element);
        });
    };
    return root;
};
