import processPolyfill from "process";

// stream-browserify's readable-stream dependency (and possibly others in
// the Circle SDK's CJS dependency chain) reference the ambient Node global
// `process` (process.version, process.nextTick) without ever require()-ing
// it — Node provides it as a global automatically, but browsers don't.
//
// This is deliberately an exported FUNCTION that the caller invokes, not a
// side-effect-only module body. This package.json declares
// `"sideEffects": false`, which applies to this project's own src/** files
// too, so Rolldown is entitled to drop any module of ours whose exports go
// unused — body and all. That is exactly what happened to the previous
// side-effect-only version of this file: the production client build still
// emitted a `process-shim-*.js` chunk (so the import looked like it had
// worked), but that chunk contained ONLY the `process` package's CJS
// factory — the `globalThis.process = ...` assignment had been eliminated,
// verified by grepping the built chunk for `globalThis` and finding zero
// matches. The Circle SDK chunk then evaluated with no global `process` and
// threw "ReferenceError: process is not defined" before W3SSdk could be
// constructed. Dev never showed it because Vite's dev server does not
// tree-shake. Compare src/lib/error-capture.ts, whose identical top-level
// side effect DOES survive — only because something imports and calls its
// `consumeLastCapturedError` export, keeping the module alive.
//
// A call to an imported function cannot be proven pure by the bundler, so
// this form is immune to that elimination regardless of the sideEffects
// declaration.
let installed = false;

export function installProcessShim(): void {
  // Real Node already has a real `process`; never touch it server-side.
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Force-assigned, not `??=`: Vite's dev client already provides its own
  // minimal `window.process = { env: {} }` stub (confirmed by inspecting it
  // at runtime — no `.version`, no `.browser`), so a nullish-coalescing
  // assign would see that as already-defined and skip. Safe to fully
  // overwrite — the real `process` package also sets `.env = {}`, and any
  // process.env.NODE_ENV reads that matter are text-replaced by Vite's
  // `define` at build time regardless of the runtime object's content.
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
