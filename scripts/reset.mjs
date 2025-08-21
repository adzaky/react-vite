#!/usr/bin/env node
import { execSync, spawnSync } from "node:child_process";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";

// ---------- CLI ARGS ----------
const args = new Set(process.argv.slice(2));
const getArgVal = (flag, def) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

const TEMPLATE_REPO = getArgVal("--template-repo", "https://github.com/adzaky/react-vite.git");
const TEMPLATE_BRANCH = getArgVal("--branch", "main");
const REPLACE_GIT = args.has("--replace-git");
const YES = args.has("--yes");
const NO_INSTALL = args.has("--no-install");

// ---------- UTILS ----------
const here = process.cwd();
const thisScript = path.resolve(process.argv[1]);
const isWindows = process.platform === "win32";

function hasCmd(cmd) {
  try {
    execSync(isWindows ? `where ${cmd}` : `command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function promptConfirm() {
  if (YES) return true;
  return await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      `⚠️  This will OVERWRITE your working directory with ${TEMPLATE_REPO}@${TEMPLATE_BRANCH}.
    .git will be ${REPLACE_GIT ? "REPLACED" : "kept"}.
Type 'RESET' to continue: `,
      (ans) => {
        rl.close();
        resolve(ans.trim() === "RESET");
      }
    );
  });
}

async function rimraf(target) {
  await fsp.rm(target, { recursive: true, force: true });
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyDir(src, dest, { exclude = new Set() } = {}) {
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const rel = ent.name;
    if (exclude.has(rel)) continue;
    const s = path.join(src, rel);
    const d = path.join(dest, rel);
    if (ent.isDirectory()) {
      await copyDir(s, d, { exclude: new Set() });
    } else if (ent.isSymbolicLink()) {
      // Resolve and copy as file/dir
      const real = await fsp.realpath(s);
      const stat = await fsp.stat(real);
      if (stat.isDirectory()) await copyDir(real, d, { exclude: new Set() });
      else await fsp.copyFile(real, d);
    } else {
      await ensureDir(path.dirname(d));
      await fsp.copyFile(s, d);
    }
  }
}

async function listTopLevel(dir) {
  return await fsp.readdir(dir);
}

function run(cmd, argsArr, opts = {}) {
  const res = spawnSync(cmd, argsArr, { stdio: "inherit", shell: false, ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${argsArr.join(" ")}`);
  }
}

// ---------- CHECK TOOLS ----------
if (!hasCmd("git")) {
  console.error("❌ git not found. Please install Git.");
  process.exit(1);
}
if (!NO_INSTALL && !hasCmd("pnpm")) {
  console.error("❌ pnpm not found. Please install pnpm.");
  process.exit(1);
}

// ---------- CONFIRM ----------
const ok = await promptConfirm();
if (!ok) {
  console.log("Aborted.");
  process.exit(0);
}

// ---------- TEMP CLONE ----------
const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "template-"));
try {
  console.log("🐙 Cloning template (shallow)...");
  run("git", ["clone", "--branch", TEMPLATE_BRANCH, TEMPLATE_REPO, tmp]);

  // ---------- OPTIONAL: replace .git ----------
  if (REPLACE_GIT) {
    console.log("🧹 Replacing .git with template's history...");
    await rimraf(path.join(here, ".git"));
    await ensureDir(path.join(here, ".git"));
    await copyDir(path.join(tmp, ".git"), path.join(here, ".git"));
  }

  // ---------- MIRROR FILES ----------
  console.log("📥 Syncing files from template...");

  // 1) Delete everything in CWD except exclusions
  const exclusions = new Set([
    ".git", // unless REPLACE_GIT (already handled)
    "node_modules",
    path.basename(thisScript),
  ]);

  const top = await listTopLevel(here);
  for (const name of top) {
    if (exclusions.has(name)) continue;
    const full = path.join(here, name);
    if (full === path.dirname(thisScript)) continue;
    await rimraf(full);
  }

  // 2) Copy all from template except .git & node_modules
  await copyDir(tmp, here, { exclude: new Set([".git", "node_modules"]) });

  // ---------- INSTALL ----------
  if (!NO_INSTALL) {
    console.log("📦 Running pnpm install...");
    run("pnpm", ["install"]);
  } else {
    console.log("⏭️  Skipping install (--no-install).");
  }

  console.log("✅ Done.");
  console.log(`   Template: ${TEMPLATE_REPO}@${TEMPLATE_BRANCH}`);
  console.log(`   Git history: ${REPLACE_GIT ? "replaced" : "preserved"}`);
} finally {
  await rimraf(tmp);
}
