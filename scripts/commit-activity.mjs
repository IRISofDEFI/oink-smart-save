// Generates src/components/landing/commit-activity.json for the landing
// page's GitHub card: commits per day from this repo's own history, laid out
// as a GitHub-style grid (columns = weeks Sun–Sat, most recent on the right).
//
// Run from the repo root whenever you want to refresh it:
//   node scripts/commit-activity.mjs
//
// The page reads the JSON; it never calls git or the GitHub API at runtime.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const WEEKS = 15;
const OUT = "src/components/landing/commit-activity.json";

const dates = execFileSync("git", ["log", "HEAD", "--format=%ad", "--date=short"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const perDay = new Map();
for (const d of dates) perDay.set(d, (perDay.get(d) ?? 0) + 1);

// Grid ends on the week of the latest commit (deterministic, not "today").
const latest = dates.reduce((a, b) => (a > b ? a : b));
const end = new Date(`${latest}T00:00:00Z`);
const start = new Date(end);
start.setUTCDate(end.getUTCDate() - end.getUTCDay() - (WEEKS - 1) * 7); // Sunday, WEEKS-1 weeks back

const iso = (d) => d.toISOString().slice(0, 10);
const weeks = [];
for (let w = 0; w < WEEKS; w++) {
  const days = [];
  for (let dow = 0; dow < 7; dow++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + w * 7 + dow);
    // Days after the latest commit are outside the grid (null), like GitHub's future days.
    days.push(d > end ? null : (perDay.get(iso(d)) ?? 0));
  }
  weeks.push(days);
}

const inRange = weeks.flat().filter((n) => n !== null);
const data = {
  source: "git log HEAD (author dates)",
  from: iso(start),
  to: latest,
  totalCommits: inRange.reduce((a, b) => a + b, 0),
  activeDays: inRange.filter((n) => n > 0).length,
  weeks,
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
console.log(`${OUT}: ${data.from} → ${data.to}, ${data.totalCommits} commits on ${data.activeDays} days`);
