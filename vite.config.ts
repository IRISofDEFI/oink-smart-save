// NOTE: @lovable.dev/vite-tanstack-config is a build-tool dependency (not UI branding).
// It bundles TanStack Start, Vite React, Tailwind CSS, tsconfig-paths, and Nitro SSR.
// Do NOT add those plugins manually — they're already included and duplicating them breaks the build.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // The Circle browser SDK's JWT decode path (jws -> jwa) reaches for
  // buffer/util/crypto via plain require('buffer')/require('crypto') calls
  // (not the bare global `Buffer` identifier) — polyfill just those for the
  // browser bundle so sdk.verifyOtp() doesn't throw on crypto.createHmac.
  //
  // Two things had to be scoped down from the plugin's defaults, both
  // discovered by hitting Cloudflare/Nitro build failures:
  //  1. applyToEnvironment restricts these plugins to the "client"
  //     environment. Without it, node:buffer also gets rewritten for the
  //     server/nitro bundle, where real Node deps (crossws, srvx, unstorage)
  //     import it for exports the browser shim doesn't provide.
  //  2. globals.Buffer is off. The plugin's automatic global-`Buffer`
  //     injection (its "inject" transform hook) still leaked a node:buffer
  //     alias into the Nitro build even with applyToEnvironment set — Nitro
  //     v3 is still pre-RC (see the file-header comment) and its own build
  //     pass doesn't fully respect per-environment plugin filtering yet.
  //     We don't need it anyway: jws/jwa use explicit require() calls, not
  //     the ambient global, so module-level aliasing via `include` covers it.
  plugins: [
    ...nodePolyfills({
      include: ["buffer", "stream", "util", "crypto"],
      globals: { Buffer: false },
    }).map((plugin) => ({
      ...plugin,
      applyToEnvironment: (environment: { name: string }) => environment.name === "client",
    })),
  ],
});
