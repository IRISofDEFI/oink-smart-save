import processPolyfill from "process";

// stream-browserify's readable-stream dependency (and possibly others in
// the Circle SDK's CJS dependency chain) reference the ambient Node global
// `process` (process.version, process.nextTick) without ever require()-ing
// it — Node provides it as a global automatically, but browsers don't.
// Side-effect-only module, imported for its evaluation order: ES modules
// require all imports to precede other statements, so this can't be
// inlined next to the SDK import it needs to run before — it has to be a
// separate import that completes first. Client-only; real Node already has
// a real `process`.
//
// Force-assigned, not `??=`: Vite's dev client already provides its own
// minimal `window.process = { env: {} }` stub (confirmed by inspecting it
// at runtime — no `.version`, no `.browser`), so a nullish-coalescing
// assign would see that as already-defined and skip. Safe to fully
// overwrite — the real `process` package also sets `.env = {}`, and any
// process.env.NODE_ENV reads that matter are text-replaced by Vite's
// `define` at build time regardless of the runtime object's content.
if (typeof window !== "undefined") {
  (globalThis as unknown as { process: unknown }).process = processPolyfill;

  // TanStack Start's server-function client (createClientRpc.js) builds the
  // fetch URL from `process.env.TSS_SERVER_FN_BASE`, expecting it to be
  // build-time-replaced by the framework's own Vite plugin `define`
  // (see node_modules/@tanstack/start-plugin-core/dist/esm/vite/planning.js,
  // createViteDefineConfig → defineReplaceEnv). That substitution only
  // reaches files Vite's dev server fully transforms — and
  // @tanstack/react-start (which re-exports createClientRpc) is in
  // optimizeDeps.exclude, so it's served as raw, untransformed ESM in dev.
  // Confirmed by diffing what the dev server actually serves for that file:
  // `process.env.TSS_SERVER_FN_BASE` stayed a literal property access, not
  // a substituted string. Left unfixed, every server function call's URL
  // silently became `"undefined" + <base64 id>` — hitting the HTML route
  // handler instead of the server-fn endpoint, with no thrown error.
  // import.meta.env carries the same TSS_* values and *is* reliably
  // populated by Vite in dev (a different, always-on injection mechanism,
  // not the AST substitution process.env depends on) — copy them across so
  // process.env.TSS_SERVER_FN_BASE resolves to a real value either way.
  Object.assign(processPolyfill.env, import.meta.env);
}
