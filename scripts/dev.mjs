// Starts the Vite dev server with the working directory's Windows drive letter
// normalised to uppercase. `npm run dev` runs this instead of `vite dev`.
//
// Why: VS Code's integrated terminal opens at `c:\...` (lowercase drive).
// Vite takes its root from that, but TanStack Start resolves the app's own
// files to `C:/...`. Vite compares the two as plain strings, decides the
// route files live outside the project, and serves them under `/@fs/C:/...`
// while `@/` alias imports of the same files are served under `/src/...`.
// The browser then loads modules like src/lib/oink-store.tsx TWICE, so a
// context provided by one copy is invisible to hooks from the other
// ("useOink must be used within OinkProvider" on /dashboard).
//
// Fixing the case before Vite starts makes both sides agree. On macOS/Linux
// (and Vercel builds) there's no drive letter, so this is a no-op.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const cwd = process.cwd();
const normalised = cwd.replace(/^[a-z]:/, (drive) => drive.toUpperCase());
if (normalised !== cwd) process.chdir(normalised);

// Resolve Vite from the NORMALISED directory, not from import.meta.url: this
// script's own URL still carries the original lowercase drive, and Vite would
// then locate its internals under `c:/...` while the cwd says `C:/...`.
const require = createRequire(pathToFileURL(join(normalised, "package.json")));
const vitePkgPath = require.resolve("vite/package.json");
const viteBin = join(dirname(vitePkgPath), require(vitePkgPath).bin.vite);

// Hand over to Vite's own CLI in this process, as `vite dev <args>`.
process.argv = [process.argv[0], viteBin, "dev", ...process.argv.slice(2)];
await import(pathToFileURL(viteBin).href);
