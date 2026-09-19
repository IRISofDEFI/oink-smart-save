// NOTE: @lovable.dev/vite-tanstack-config is a build-tool dependency (not UI branding).
// It bundles TanStack Start, Vite React, Tailwind CSS, tsconfig-paths, and Nitro SSR.
// Do NOT add those plugins manually — they're already included and duplicating them breaks the build.
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Circle browser SDK's JWT decode path (jws -> jwa -> jsonwebtoken, plus
// jwa's safe-buffer dependency) does plain require('buffer')/
// require('crypto')/require('stream')/require('util') calls (confirmed by
// reading their source — no other node builtins, no bare global `Buffer`
// usage) — polyfill just those bare specifiers for the browser bundle so
// sdk.verifyOtp() doesn't throw on crypto.createHmac.
//
// buffer and util are aliased to their ABSOLUTE file path, not the bare
// package name: a self-referential alias ({find: "buffer", replacement:
// "buffer"}) is silently a no-op — confirmed by finding, in the actual
// built output, that safe-buffer's own `require('buffer')` still fell
// through to Vite's default browser-external empty-stub
// (__vite-browser-external-*.js, `Buffer.from` on it throws "Cannot read
// properties of undefined") despite this exact alias entry existing. crypto
// and stream, whose replacement string genuinely differs from `find`,
// resolved correctly the entire time. Rolldown's alias matcher (or
// Vite's alias plugin) appears to treat find === replacement as "no alias
// needed" — plausibly a guard against self-referential infinite loops.
// An absolute path can't collide with the bare specifier being matched, so
// it's unambiguous either way.
const nodeShimAliases = [
  { find: "buffer", replacement: path.resolve(process.cwd(), "node_modules/buffer/index.js") },
  { find: "crypto", replacement: "crypto-browserify" },
  { find: "stream", replacement: "stream-browserify" },
  { find: "util", replacement: path.resolve(process.cwd(), "node_modules/util/util.js") },
];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: { alias: nodeShimAliases },
    // buffer/crypto-browserify's own internal deps (e.g. randombytes'
    // browser-detection fallback) assume the Node global `global` object
    // exists — replace it with `globalThis`.
    //
    // Top-level, not environments.client.define: the TanStack Start Vite
    // plugin's own config() hook also returns a top-level `define`
    // (TSS_SERVER_FN_BASE, TSS_ROUTER_BASEPATH, etc. — see
    // node_modules/@tanstack/start-plugin-core/dist/esm/vite/planning.js,
    // createViteDefineConfig). Putting ours under environments.client.define
    // instead of merging into the shared/top-level define silently dropped
    // that plugin's substitutions for the client environment specifically:
    // process.env.TSS_SERVER_FN_BASE stayed as a literal, unreplaced
    // property-access expression in the browser bundle, which evaluated at
    // runtime to `undefined` (Vite's own minimal `window.process = {env:{}}`
    // stub has no such key) — every server function's URL silently became
    // `"undefined" + base64Id`, hitting the HTML route handler instead of
    // the server-fn endpoint. Confirmed by diffing what the dev server
    // actually serves for
    // node_modules/@tanstack/start-client-core/dist/esm/client-rpc/createClientRpc.js:
    // `process.env.TSS_SERVER_FN_BASE` was untouched, not the substituted
    // string. `global` is safe to replace build-wide (Node has `globalThis`
    // too), so moving it to shared `define` fixes this without needing
    // per-environment scoping at all.
    define: { global: "globalThis" },
  },
});
