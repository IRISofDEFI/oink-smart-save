// Loaded by Hardhat/Mocha before any .cts test files.
// Registers ts-node as a CJS require hook, then copies the hook to the
// .cts extension (ts-node 10.x only patches .ts/.tsx by default).
// This file must be .cjs (plain JavaScript) so Node.js can load it
// without transpilation, even in a "type":"module" project.
require("ts-node/register");
const m = require("module");
m._extensions[".cts"] = m._extensions[".ts"];
