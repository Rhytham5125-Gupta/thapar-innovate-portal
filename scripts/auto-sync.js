const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.vercel',
  'uploads',
  '.env',
  '.agents',
  'package-lock.json',
  '*.log'
];

let syncTimeout = null;
let isSyncing = false;

function shouldIgnore(filePath) {
  if (!filePath) return true;
  const normalized = filePath.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some((pattern) => {
    if (pattern.startsWith('*.')) {
      return normalized.endsWith(pattern.slice(1));
    }
    return normalized.includes(`/${pattern}/`) || normalized.startsWith(`${pattern}/`) || normalized === pattern;
  });
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim() || 'master';
  } catch (err) {
    return 'master';
  }
}

function runGitSync() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
    if (!status) {
      isSyncing = false;
      return;
    }

    const branch = getCurrentBranch();
    const now = new Date().toLocaleString();
    console.log(`\n[Auto-Sync] Detected changes:\n${status}`);
    console.log(`[Auto-Sync] Staging and committing changes...`);

    execSync('git add -A', { cwd: ROOT_DIR, stdio: 'inherit' });
    execSync(`git commit -m "auto: updates at ${now}"`, { cwd: ROOT_DIR, stdio: 'inherit' });

    console.log(`[Auto-Sync] Pushing to GitHub (branch: ${branch})...`);
    execSync(`git push origin ${branch}`, { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log(`[Auto-Sync] Successfully pushed changes to GitHub!\n`);
  } catch (error) {
    console.error(`[Auto-Sync Error] ${error.message}`);
  } finally {
    isSyncing = false;
  }
}

function triggerDebouncedSync(changedFile) {
  if (shouldIgnore(changedFile)) return;

  console.log(`[Watcher] File changed: ${changedFile}`);
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    runGitSync();
  }, 3000); // Wait 3 seconds after last file modification before syncing
}

console.log(`=======================================================`);
console.log(`   Thapar Innovate - Instant GitHub Auto-Sync Engine   `);
console.log(`=======================================================`);
console.log(`Watching for code changes in: ${ROOT_DIR}`);
console.log(`Ignored paths: ${IGNORE_PATTERNS.join(', ')}`);
console.log(`Auto-push will trigger ~3 seconds after you save any change.`);
console.log(`Press Ctrl+C to stop auto-sync.\n`);

try {
  fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
    if (filename) {
      triggerDebouncedSync(filename);
    }
  });
} catch (err) {
  console.error(`Failed to start file watcher:`, err);
}
