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
});
