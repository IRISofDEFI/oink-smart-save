// NOTE: @lovable.dev/vite-tanstack-config is a build-tool dependency (not UI branding).
// It bundles TanStack Start, Vite React, Tailwind CSS, tsconfig-paths, and Nitro SSR.
// Do NOT add those plugins manually — they're already included and duplicating them breaks the build.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // @circle-fin/w3s-pw-web-sdk pulls in jsonwebtoken -> jws, whose
    // SignStream/VerifyStream unconditionally `require('stream')` and
    // `util.inherits(..., Stream)` at module load. Vite externalizes the
    // `stream` Node builtin as an empty stub for the browser by default, so
    // `Object.setPrototypeOf(ctor.prototype, undefined)` was throwing during
    // pre-bundling ("Object prototype may only be an Object or null:
    // undefined"). Aliasing `stream` to the stream-browserify polyfill gives
    // it a real Stream/Readable implementation, which lets the SDK (and its
    // full dependency graph) pre-bundle normally — no optimizeDeps.exclude
    // needed, so named imports work as declared in sdk.ts.
    resolve: {
      alias: {
        stream: "stream-browserify",
      },
    },
  },
});
