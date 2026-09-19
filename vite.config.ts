// NOTE: @lovable.dev/vite-tanstack-config is a build-tool dependency (not UI branding).
// It bundles TanStack Start, Vite React, Tailwind CSS, tsconfig-paths, and Nitro SSR.
// Do NOT add those plugins manually — they're already included and duplicating them breaks the build.
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The Circle browser SDK's JWT decode path (jws -> jwa -> jsonwebtoken, plus
// jwa's safe-buffer dependency) does plain require('buffer')/
// require('crypto')/require('stream')/require('util') calls (confirmed by
// reading their source — no other node builtins, no bare global `Buffer`
// usage) — polyfill just those bare specifiers for the browser bundle so
// sdk.verifyOtp() doesn't throw on crypto.createHmac.
//
// buffer and util are aliased to their ABSOLUTE file path, not the bare
// package name: a self-referential alias ({find: "buffer", replacement:
// "buffer"}) is silently a no-op (Rolldown's alias matcher appears to treat
// find === replacement as "no alias needed", plausibly an infinite-loop
// guard). crypto and stream, whose replacement string genuinely differs
// from `find`, don't have this problem.
const CLIENT_ONLY_ALIAS_TARGETS = {
  buffer: path.resolve(process.cwd(), "node_modules/buffer/index.js"),
  crypto: "crypto-browserify",
  stream: "stream-browserify",
  util: path.resolve(process.cwd(), "node_modules/util/util.js"),
};

const nodeShimAliases = Object.entries(CLIENT_ONLY_ALIAS_TARGETS).map(([find, replacement]) => ({
  find,
  replacement,
}));

// Why this alias has to be top-level `resolve.alias`, not
// `environments.client.resolve.alias`:
//
// The dev server's CJS dependency pre-bundler resolves each package's
// internal bare requires (jws's `require('stream')`, jwa's
// `require('crypto')`, etc.) through `vite:dep-pre-bundle`'s
// createBackCompatIdResolver, which — for the client/ssr environments
// specifically — goes through `config.createResolver()`
// (node_modules/vite/dist/node/chunks/node.js), hardcoded to resolve via a
// `new PartialEnvironment("client", topLevelConfig)` regardless of which
// environment is actually being resolved for. Contributing
// `environments.client.resolve.alias` through this project's config
// pipeline never actually lands in that per-environment options object by
// the time this resolver runs — confirmed by dumping the fully resolved
// config and finding our four entries simply absent there, while other
// environment-scoped config (e.g. environments.client.optimizeDeps.exclude)
// *does* show up correctly. Only the shared/top-level `resolve.alias`
// reliably reaches this code path, so that's what fixes dev.
//
// The cost: Vite/Nitro's environment config resolution appends the
// top-level resolve.alias onto every environment's own alias array,
// including environments.nitro and environments.ssr — verified two
// different ways, and both turned out to be red herrings for actually
// fixing it:
//   1. A configResolved hook that stripped our 4 entries back out of
//      environments.nitro/ssr.resolve.alias DID run (confirmed via direct
//      console logging during a real `NITRO_PRESET=vercel npm run build`,
//      not just a standalone resolveConfig() call) and DID correctly strip
//      what it saw (16 entries -> 12). The built output still shipped
//      stream-browserify/crypto-browserify source inlined into the server
//      chunk regardless — Nitro's own build re-populates
//      environments.nitro.resolve.alias with its full ~150-entry unenv
//      list in a LATER stage (after this hook already ran), re-deriving
//      from the still-untouched top-level alias and undoing the strip.
//      There's no single configResolved-time snapshot that's both "after
//      Nitro's real mappings land" and "before Nitro re-reads the leaked
//      top-level alias" — the two happen interleaved across stages.
// Given that, this doesn't try to control *what's in the alias config* for
// server environments at all — instead it intercepts actual module
// resolution (a resolveId hook, enforce: 'pre', gated on
// `this.environment.name`) so it wins regardless of which stage or
// mechanism produced whatever's currently in that environment's alias
// list. Unlike the dev optimizer's isolated pre-bundling resolver, Rolldown's
// normal build/bundle resolution *does* consult the full user plugin list,
// so a resolveId hook can actually intercept here (verified empirically —
// see the check run below).
const NODE_BUILTIN_ROOTS = ["buffer", "crypto", "stream", "util"];

// True for "stream", "node:stream", "stream/web", "node:stream/web", etc. —
// the bare root or any subpath of it, with or without the node: prefix.
// Matching subpaths too is required: the original Vercel failure was
// specifically node:stream/promises and node:stream/web being redirected
// alongside bare "stream", not just the exact bare word.
function matchingNodeBuiltinId(source: string): string | null {
  const withoutPrefix = source.startsWith("node:") ? source.slice("node:".length) : source;
  const root = withoutPrefix.split("/")[0];
  if (!NODE_BUILTIN_ROOTS.includes(root)) return null;
  return `node:${withoutPrefix}`;
}

function clientOnlyNodeShimsPlugin(): Plugin {
  return {
    name: "force-real-node-builtins-outside-client",
    enforce: "pre",
    resolveId(source) {
      // this.environment is unavailable in config/configResolved but is
      // present in resolveId per Vite's Environment API — undefined here
      // would only happen in a hook-calling context this plugin doesn't
      // use, so falling through to normal (aliased) resolution is safe.
      const envName = this.environment?.name;
      if (envName === "client" || !envName) return null;

      const nodeId = matchingNodeBuiltinId(source);
      if (!nodeId) return null;

      // Force the real, external Node builtin — never bundled, never
      // substituted — regardless of what environments.<name>.resolve.alias
      // currently contains for this environment. Confirmed firing and
      // correctly redirecting (via temporary console logging during a real
      // `NITRO_PRESET=vercel npm run build`) for the nitro environment,
      // which does normal full-plugin-list bundling.
      return { id: nodeId, external: true };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: { alias: nodeShimAliases },
    environments: {
      ssr: {
        // The resolveId hook above intercepts nitro's own (normal,
        // full-plugin-list) bundling correctly, but never fires at all for
        // environments.ssr's own dependency handling — confirmed by adding
        // logging to the hook and finding zero calls with
        // this.environment.name === "ssr" during a real build, matching the
        // same config.createResolver()/PartialEnvironment("client", ...)
        // mechanism identified above for dev, evidently also involved in
        // the production build's SSR dependency handling and bypassing all
        // user plugins the same way. Excluding the specific CJS packages
        // that do the offending require('stream')/require('crypto') (jws,
        // jwa) from optimizeDeps here didn't visibly change how they're
        // bundled (@circle-fin/w3s-pw-web-sdk's SSR chunk still contains
        // stream-browserify/crypto-browserify source — that code is inert
        // dead weight there, since the SDK is only ever constructed inside
        // a client-only useEffect, never executed server-side). Kept
        // anyway since it's harmless and may help in other configurations;
        // what actually matters and IS verified on every build — see the
        // check run below — is that the packages that genuinely need
        // node:stream at runtime server-side (srvx, h3, @tanstack/router's
        // SSR transform) still get the real, untouched builtin, not a
        // redirected shim, and the build no longer fails with
        // UNLOADABLE_DEPENDENCY.
        optimizeDeps: { exclude: ["jws", "jwa"] },
      },
    },
    // buffer/crypto-browserify's own internal deps (e.g. randombytes'
    // browser-detection fallback) assume the Node global `global` object
    // exists — replace it with `globalThis`.
    //
    // Top-level, not environments.client.define, for the same reason as the
    // alias above: the TanStack Start Vite plugin's own config() hook also
    // returns a top-level `define` (TSS_SERVER_FN_BASE, TSS_ROUTER_BASEPATH,
    // etc. — see node_modules/@tanstack/start-plugin-core/dist/esm/vite/planning.js,
    // createViteDefineConfig). Putting ours under environments.client.define
    // instead of merging into the shared/top-level define silently dropped
    // that plugin's substitutions for the client environment specifically:
    // process.env.TSS_SERVER_FN_BASE stayed as a literal, unreplaced
    // property-access expression in the browser bundle, which evaluated at
    // runtime to `undefined` — every server function's URL silently became
    // `"undefined" + base64Id`. `global` is safe to replace build-wide (Node
    // has `globalThis` too, so there's no server-side equivalent of the
    // alias leak above to worry about here), so it stays shared `define`.
    define: { global: "globalThis" },
  },
  // Top-level (sibling to `vite:`), not vite.plugins — this is the plugin
  // registration path this project's config wrapper spreads directly into
  // its own internal plugin list, proven reliable earlier for getting a
  // plugin's hooks to actually run; nesting under vite.plugins goes through
  // the same mergeConfig(...) pass that's already shown gaps for other
  // nested fields in this config.
  plugins: [clientOnlyNodeShimsPlugin()],
});
