// React 18 test environment setup
//
// React 18's concurrent scheduler is async by default. @testing-library/react
// v16 calls act() without await, which means createRoot().render() doesn't
// populate the DOM before assertions run.
//
// Solution: patch react-dom/client's createRoot so root.render() uses
// ReactDOM.flushSync to force synchronous rendering. This makes @testing-library
// render() calls populate the DOM immediately, without needing await.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

import ReactDOM from "react-dom";
import ReactDOMClient from "react-dom/client";

const _origCreateRoot = ReactDOMClient.createRoot.bind(ReactDOMClient);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const flushSync = (ReactDOM as any).flushSync as (fn: () => void) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ReactDOMClient as any).createRoot = function patchedCreateRoot(container: Element, options?: unknown) {
    const root = _origCreateRoot(container, options as Parameters<typeof _origCreateRoot>[1]);
    const _origRender = root.render.bind(root);
    root.render = function syncRender(element: unknown) {
        flushSync(() => {
            _origRender(element);
        });
    };
    return root;
};
