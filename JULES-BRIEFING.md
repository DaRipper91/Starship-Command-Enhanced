# Jules Briefing — Repo-Map & Auto-Changelog System

**GitHub Profile:** DaRipper91  
**Central Repo:** github.com/DaRipper91/repo-map  
**Date:** 2026-02-23

---

## What You Are Being Asked to Do

You are being given a fully designed system to implement across the DaRipper91 GitHub profile. Your job is to:

1. Create the `repo-map` repository if it doesn't exist and populate it with the sync infrastructure
2. Add the auto-changelog system to every applicable repository in the profile
3. Wire the changelog mirroring into the repo-map sync
4. Verify everything is connected and working

Read this entire file before starting. All code, file contents, decisions, and placement instructions are included below.

---

## System Overview

### Part 1 — Repo-Map

A repository called `repo-map` acts as a text-only mirror of the entire DaRipper91 GitHub profile. It runs every 2 hours via GitHub Actions cron and generates structured Markdown file maps for every repo. It contains no code — only `.md` files describing what exists in each repo.

### Part 2 — Auto-Changelog

Every repo in the profile gets a GitHub Actions workflow that fires on every push to `main` or `master`. It reads the git log and diff, calls Gemini AI, and writes a structured `CHANGELOG.md` entry covering: what commits were made, what files changed (grouped by type), a plain-English summary of what changed, what was fixed, and suggested next steps.

### Part 3 — Changelog Mirroring

The repo-map sync (every 2 hours) also fetches each repo's `CHANGELOG.md` and mirrors it into `repo-map/repos/<name>/CHANGELOG.md`, and builds a cross-profile index at `repo-map/_meta/changelog-index.md`.

---

## Decisions Made (Do Not Change These)

| Decision                        | Answer                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| Where does CHANGELOG.md live?   | Both — in each repo AND mirrored in repo-map                        |
| How is content generated?       | Mix — commit messages for facts, Gemini AI for summary + next steps |
| What triggers changelog update? | Pushes to main/master only + the every-2-hour repo-map sync         |
| Sync frequency                  | Every 2 hours (`0 */2 * * *`)                                       |
| AI model                        | Gemini 1.5 Flash (free tier)                                        |
| Max changelog entries kept      | 50 per repo (auto-trimmed)                                          |
| File format                     | Markdown only — no binaries, no code in repo-map                    |
| Cron schedule                   | `0 */2 * * *` — fires at midnight, 2am, 4am... 10pm UTC             |

---

## Repository Structure — repo-map

After full setup, repo-map should look exactly like this:

```
repo-map/
├── README.md                        ← auto-generated each sync (sync stats, change log)
├── sync_repo_map.py                 ← main sync script
├── sync_changelogs.py               ← changelog mirror module
├── .github/
│   └── workflows/
│       └── sync.yml                 ← GitHub Actions cron (every 2 hours)
├── _meta/
│   ├── sync-log.md                  ← timestamped history of every sync run
│   ├── change-report.md             ← what changed in the latest sync
│   └── changelog-index.md          ← cross-profile changelog index table
└── repos/
    ├── <repo-name>/
    │   ├── README.md                ← repo overview (branch, last push, file count)
    │   ├── CHANGELOG.md             ← mirrored from the actual repo
    │   ├── map.md                   ← root-level file map
    │   └── <subdir>/
    │       └── map.md               ← per-directory file map
    └── ...
```

---

## Repository Structure — Each Repo With Changelog

Every repo that gets the auto-changelog system needs these files added:

```
your-repo/
├── CHANGELOG.md                     ← auto-created on first push (don't create manually)
└── .github/
    ├── workflows/
    │   └── changelog-workflow.yml   ← triggers on push to main/master
    └── scripts/
        └── update_changelog.py      ← called by the workflow, builds the entry
```

---

## Secrets Required

### In repo-map:

| Secret Name | Value                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| `GH_TOKEN`  | GitHub Personal Access Token with `repo`, `workflow`, `read:org` scopes |

### In every repo with changelog:

| Secret Name       | Value                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| `GEMINI_API_KEY`  | Gemini API key from aistudio.google.com/app/apikey                     |
| `CHANGELOG_TOKEN` | Optional — same PAT as GH_TOKEN. Falls back to GITHUB_TOKEN if not set |

---

## File 1 — sync.yml

**Location in repo-map:** `.github/workflows/sync.yml`

```yaml
name: Sync Repo Map

on:
  schedule:
    - cron: '0 */2 * * *' # Every 2 hours: midnight, 2am, 4am... 10pm UTC
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'sync_repo_map.py'
      - 'sync_changelogs.py'
      - '.github/workflows/sync.yml'

permissions:
  contents: write

concurrency:
  group: repo-map-sync
  cancel-in-progress: false

jobs:
  sync:
    name: Sync GitHub Profile → Repo Map
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repo-map
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GH_TOKEN }}
          fetch-depth: 0

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Authenticate gh CLI
        run: |
          echo "${{ secrets.GH_TOKEN }}" | gh auth login --with-token
          gh auth status

      - name: Run sync script
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: |
          python sync_repo_map.py --verbose

      - name: Commit and push changes
        run: |
          git config user.name  "repo-map-bot"
          git config user.email "bot@users.noreply.github.com"
          git add -A
          if git diff --cached --quiet; then
            echo "No changes to commit."
          else
            CHANGES=$(git diff --cached --name-only | wc -l | tr -d ' ')
            TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M UTC')
            git commit -m "🔄 sync: ${TIMESTAMP} — ${CHANGES} files updated"
            git push
          fi

      - name: Print sync summary
        if: always()
        run: |
          if [ -f "_meta/change-report.md" ]; then
            cat _meta/change-report.md
          fi
```

---

## File 2 — sync_repo_map.py

**Location in repo-map:** `sync_repo_map.py` (root)

```python
#!/usr/bin/env python3
"""
sync_repo_map.py — Repo-Map Sync Script
GitHub Profile Mirror for DaRipper91

Runs every 2 hours via GitHub Actions.
Mirrors all repos as structured Markdown file maps.
At the end, calls sync_changelogs to mirror all CHANGELOG.md files.

Usage:
    python sync_repo_map.py
    python sync_repo_map.py --verbose
    python sync_repo_map.py --repo my-specific-repo
"""

import subprocess
import json
import os
import sys
import datetime
import hashlib
import argparse
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────────
USERNAME    = "DaRipper91"
OUTPUT_DIR  = Path("repos")
META_DIR    = Path("_meta")
REVIEWS_DIR = META_DIR / "reviews"
PREV_HASH   = META_DIR / ".last_hashes.json"
LOG_FILE    = META_DIR / "sync-log.md"
CHANGE_FILE = META_DIR / "change-report.md"

# ── Argument Parsing ───────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Sync GitHub profile to repo-map")
parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
parser.add_argument("--repo", type=str, help="Only sync a single repo by name")
parser.add_argument("--dry-run", action="store_true", help="Don't write any files")
args = parser.parse_args()

def log(msg):
    if args.verbose:
        print(f"  {msg}")

def run(cmd, silent=False):
    try:
        result = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.PIPE)
        return result.strip()
    except subprocess.CalledProcessError as e:
        if not silent:
            print(f"  ⚠️  Command failed: {cmd}\n     {e.stderr.strip()}", file=sys.stderr)
        return None

# ── Setup ──────────────────────────────────────────────────────────────────────
for d in [OUTPUT_DIR, META_DIR, REVIEWS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

def load_hashes():
    if PREV_HASH.exists():
        try:
            return json.loads(PREV_HASH.read_text())
        except json.JSONDecodeError:
            return {}
    return {}

def save_hashes(h):
    if not args.dry_run:
        PREV_HASH.write_text(json.dumps(h, indent=2))

prev_hashes = load_hashes()
curr_hashes = {}
LOG         = []
CHANGES     = []
total_files = 0
start       = datetime.datetime.utcnow()
now         = start
now_str     = now.strftime("%Y-%m-%d %H:%M UTC")

print(f"🔄 Repo-Map Sync starting: {now_str}")
print(f"   Profile: {USERNAME}")

# ── Fetch repo list ────────────────────────────────────────────────────────────
if args.repo:
    repo_data = run(
        f"gh api repos/{USERNAME}/{args.repo}"
        + " | jq '[{name: .name, defaultBranchRef: {name: .default_branch},"
        + " pushedAt: .pushed_at, description: .description}]'"
    )
    if not repo_data:
        print(f"❌ Could not fetch repo: {args.repo}")
        sys.exit(1)
    repos = json.loads(repo_data)
else:
    repo_json = run(
        f'gh repo list {USERNAME} --limit 200 '
        f'--json name,defaultBranchRef,pushedAt,description'
    )
    if not repo_json:
        print("❌ Failed to fetch repo list. Is gh authenticated?")
        sys.exit(1)
    repos = json.loads(repo_json)

print(f"   Repos found: {len(repos)}")

repo_summary = []

for repo in repos:
    name   = repo.get("name", "")
    branch = (repo.get("defaultBranchRef") or {}).get("name", "main")
    desc   = (repo.get("description") or "No description provided.").strip()
    pushed = (repo.get("pushedAt") or "unknown")[:10]

    log(f"Processing: {name} [{branch}]")

    tree_raw = run(
        f"gh api 'repos/{USERNAME}/{name}/git/trees/{branch}?recursive=1'",
        silent=True
    )
    if not tree_raw:
        msg = f"⚠️ Skipped {name} — could not fetch tree"
        print(f"   {msg}")
        LOG.append(msg)
        continue

    try:
        tree_data = json.loads(tree_raw)
    except json.JSONDecodeError:
        LOG.append(f"⚠️ Skipped {name} — malformed tree response")
        continue

    if tree_data.get("truncated"):
        LOG.append(f"⚠️ {name} — tree truncated. Only partial map available.")

    files = [f for f in tree_data.get("tree", []) if f.get("type") == "blob"]
    total_files += len(files)

    dir_map = {}
    for f in files:
        parent = str(Path(f["path"]).parent)
        dir_map.setdefault(parent, []).append(f["path"])

    repo_out = OUTPUT_DIR / name
    repo_out.mkdir(parents=True, exist_ok=True)

    for dir_path, file_list in dir_map.items():
        out_path = repo_out / dir_path / "map.md"
        out_path.parent.mkdir(parents=True, exist_ok=True)

        lines = [
            f"# File Map: `{dir_path}`\n\n",
            f"**Repo:** [{name}](https://github.com/{USERNAME}/{name})  \n",
            f"**Branch:** `{branch}`  \n",
            f"**Directory:** `{dir_path}`  \n",
            f"**File Count:** {len(file_list)}  \n\n",
            "---\n\n",
        ]

        for fp in sorted(file_list):
            fname = Path(fp).name
            ext   = Path(fp).suffix.lower()
            lines.append(f"## {fname}\n\n")
            lines.append(f"- **Repo:** `{name}`\n")
            lines.append(f"- **Branch:** `{branch}`\n")
            lines.append(f"- **Path:** `{fp}`\n")
            lines.append(f"- **Type:** `{ext or 'no extension'}`\n")
            lines.append(f"- **Description:** *(pending AI description pass)*\n\n")

        content = "".join(lines)
        h = hashlib.md5(content.encode()).hexdigest()
        key = f"{name}/{dir_path}"

        if key in prev_hashes:
            if prev_hashes[key] != h:
                CHANGES.append(f"🔄 Modified: `{name}/{dir_path}` ({len(file_list)} files)")
        else:
            CHANGES.append(f"✅ New: `{name}/{dir_path}` ({len(file_list)} files)")

        curr_hashes[key] = h
        if not args.dry_run:
            out_path.write_text(content, encoding="utf-8")

    dir_links = "\n".join(
        [f"- [{d}/](./{d}/map.md) — {len(dir_map[d])} files" for d in sorted(dir_map.keys())]
    )
    readme_content = (
        f"# {name}\n\n"
        f"**Profile:** [{USERNAME}](https://github.com/{USERNAME})  \n"
        f"**Branch:** `{branch}`  \n"
        f"**Last Push:** {pushed}  \n"
        f"**Files Indexed:** {len(files)}  \n"
        f"**Directories:** {len(dir_map)}  \n\n"
        f"**Description:** {desc}\n\n"
        f"---\n\n"
        f"## 📁 Directories\n\n"
        f"{dir_links}\n\n"
        f"---\n\n"
        f"*Generated by repo-map sync. Last updated: {now_str}*\n"
    )
    if not args.dry_run:
        (repo_out / "README.md").write_text(readme_content, encoding="utf-8")

    repo_summary.append(
        f"| [{name}](./repos/{name}/README.md) | `{branch}` | {len(files)} | {pushed} |"
    )
    LOG.append(f"✅ {name}: {len(files)} files, {len(dir_map)} dirs")
    print(f"   ✅ {name}: {len(files)} files")

for old_key in prev_hashes:
    if old_key not in curr_hashes:
        CHANGES.append(f"🗑️ Removed: `{old_key}`")

save_hashes(curr_hashes)
duration = int((datetime.datetime.utcnow() - start).total_seconds())

change_block = "\n".join(CHANGES) if CHANGES else "_No changes detected._"

readme_lines = [
    "# 🗂️ DaRipper91 — Repo Map\n\n",
    f"> Auto-synced text-only mirror of all GitHub repositories for [{USERNAME}](https://github.com/{USERNAME}).\n\n",
    "---\n\n",
    f"**Last Sync:** {now_str}  \n",
    f"**Repos Mapped:** {len(repos)}  \n",
    f"**Total Files Indexed:** {total_files:,}  \n",
    f"**Sync Duration:** {duration}s  \n\n",
    "## 📊 Changes This Run\n\n",
    change_block + "\n\n",
    "## 📁 Repositories\n\n",
    "| Repo | Branch | Files | Last Push |\n",
    "|------|--------|-------|-----------|\n",
    "\n".join(repo_summary) + "\n\n",
    "## 🔗 Meta\n\n",
    "- [Sync Log](./_meta/sync-log.md)\n",
    "- [Change Report](./_meta/change-report.md)\n",
    "- [Changelog Index](./_meta/changelog-index.md)\n\n",
    "---\n\n",
    "*Synced automatically every 2 hours via GitHub Actions.*\n",
]
if not args.dry_run:
    Path("README.md").write_text("".join(readme_lines), encoding="utf-8")

log_entry = f"### Sync: {now_str}\n\n"
log_entry += f"- **Repos:** {len(repos)}\n"
log_entry += f"- **Files:** {total_files:,}\n"
log_entry += f"- **Changes:** {len(CHANGES)}\n"
log_entry += f"- **Duration:** {duration}s\n\n"
log_entry += "\n".join([f"  - {l}" for l in LOG]) + "\n\n---\n\n"

if not args.dry_run:
    existing_log = LOG_FILE.read_text(encoding="utf-8") if LOG_FILE.exists() else "# Sync Log\n\n"
    header = "# Sync Log\n\n"
    updated_log = header + log_entry + existing_log.replace(header, "", 1)
    LOG_FILE.write_text(updated_log, encoding="utf-8")

change_report = (
    f"# Change Report\n\n"
    f"**Run:** {now_str}  \n"
    f"**Repos Scanned:** {len(repos)}  \n"
    f"**Changes Found:** {len(CHANGES)}  \n\n"
    "---\n\n"
    + (("\n".join(CHANGES)) if CHANGES else "_No changes detected this run._")
    + "\n"
)
if not args.dry_run:
    CHANGE_FILE.write_text(change_report, encoding="utf-8")

print(f"\n✅ Sync complete. Repos: {len(repos)}, Files: {total_files:,}, Changes: {len(CHANGES)}, Duration: {duration}s")

# ── Changelog mirror ───────────────────────────────────────────────────────────
print('\n📋 Syncing changelogs...')
import sync_changelogs
sync_changelogs.run_sync(repos, USERNAME)
```

---

## File 3 — sync_changelogs.py

**Location in repo-map:** `sync_changelogs.py` (root)

```python
#!/usr/bin/env python3
"""
sync_changelogs.py
Mirrors CHANGELOG.md from every repo into repo-map and builds a cross-profile index.
Called automatically at the end of sync_repo_map.py.
"""

import subprocess
import json
import base64
import datetime
import re
from pathlib import Path

USERNAME    = "DaRipper91"
OUTPUT_DIR  = Path("repos")
META_DIR    = Path("_meta")
INDEX_FILE  = META_DIR / "changelog-index.md"


def run(cmd, silent=True):
    try:
        return subprocess.check_output(cmd, shell=True, text=True,
                                       stderr=subprocess.DEVNULL).strip()
    except subprocess.CalledProcessError:
        return None


def fetch_changelog(username, repo_name, branch="main"):
    """Fetch CHANGELOG.md content via GitHub API. Returns text or None."""
    raw = run(
        f"gh api repos/{username}/{repo_name}/contents/CHANGELOG.md 2>/dev/null"
    )
    if raw:
        try:
            data = json.loads(raw)
            content = data.get("content", "")
            return base64.b64decode(content.replace("\n", "")).decode("utf-8", errors="ignore")
        except Exception:
            pass
    return None


def extract_latest_entry(changelog_text):
    """Pull date and summary from the most recent ## [date] entry."""
    if not changelog_text:
        return None, None
    matches = list(re.finditer(r'^## \[(\d{4}-\d{2}-\d{2})\]', changelog_text, re.MULTILINE))
    if not matches:
        return None, None
    first = matches[0]
    date_label = first.group(1)
    entry_block = changelog_text[first.start():matches[1].start()] if len(matches) > 1 else changelog_text[first.start():]
    summary_match = re.search(r'###\s+💡\s+What Changed\s*\n(.*?)(?=###|\Z)', entry_block, re.DOTALL)
    summary = ""
    if summary_match:
        bullets = [l.strip() for l in summary_match.group(1).strip().splitlines() if l.strip().startswith("-")][:2]
        summary = " ".join(b.lstrip("- ") for b in bullets)[:200]
    return date_label, summary


def run_sync(repos, username=None):
    """Mirror changelogs and build index. Called from sync_repo_map.py."""
    if username:
        global USERNAME
        USERNAME = username

    META_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    index_rows = []
    synced = 0
    missing = 0

    for repo in repos:
        name   = repo.get("name", "")
        branch = (repo.get("defaultBranchRef") or {}).get("name", "main")
        content = fetch_changelog(USERNAME, name, branch)
        dest    = OUTPUT_DIR / name / "CHANGELOG.md"

        if content:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(content, encoding="utf-8")
            date_label, summary = extract_latest_entry(content)
            index_rows.append({
                "repo": name, "date": date_label or "unknown",
                "summary": summary or "_No summary extracted._", "has_change": True,
            })
            synced += 1
            print(f"   ✅ {name}: changelog mirrored")
        else:
            if dest.exists():
                dest.unlink()
            index_rows.append({
                "repo": name, "date": "—",
                "summary": "_No CHANGELOG.md in this repo._", "has_change": False,
            })
            missing += 1

    index_rows.sort(key=lambda r: r["date"], reverse=True)

    lines = [
        "# Changelog Index\n\n",
        f"> Mirrored from all repos in [{USERNAME}](https://github.com/{USERNAME}).  \n",
        f"> Last updated: {now_str}  \n",
        f"> Repos with changelog: {synced} / {synced + missing}\n\n",
        "---\n\n",
        "| Repo | Latest Entry | Summary |\n",
        "|------|-------------|--------|\n",
    ]
    for row in index_rows:
        link = f"[{row['repo']}](../{row['repo']}/CHANGELOG.md)" if row["has_change"] else row["repo"]
        lines.append(f"| {link} | {row['date']} | {row['summary']} |\n")

    lines += ["\n---\n\n", "## Repos Without a Changelog\n\n",
              "_These repos have no CHANGELOG.md. Add `changelog-workflow.yml` to enable._\n\n"]
    for row in index_rows:
        if not row["has_change"]:
            lines.append(f"- `{row['repo']}`\n")

    INDEX_FILE.write_text("".join(lines), encoding="utf-8")
    print(f"   📄 Changelog index: {synced} mirrored, {missing} without changelog")
    return synced, missing
```

---

## File 4 — changelog-workflow.yml

**Location in each repo:** `.github/workflows/changelog-workflow.yml`

```yaml
name: Auto Changelog

on:
  push:
    branches:
      - main
      - master
    paths-ignore:
      - 'CHANGELOG.md'
      - '.github/**'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: changelog-${{ github.ref }}
  cancel-in-progress: false

jobs:
  update-changelog:
    name: Update CHANGELOG.md
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.CHANGELOG_TOKEN || secrets.GITHUB_TOKEN }}

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install google-generativeai --quiet

      - name: Generate changelog entry
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO_NAME: ${{ github.repository }}
          COMMIT_SHA: ${{ github.sha }}
          PUSHER: ${{ github.actor }}
          BRANCH: ${{ github.ref_name }}
        run: python .github/scripts/update_changelog.py

      - name: Commit changelog
        run: |
          git config user.name  "changelog-bot"
          git config user.email "bot@users.noreply.github.com"
          git add CHANGELOG.md
          if git diff --cached --quiet; then
            echo "No changelog changes to commit."
          else
            git commit -m "docs: update CHANGELOG.md [skip ci]"
            git push
          fi
```

---

## File 5 — update_changelog.py

**Location in each repo:** `.github/scripts/update_changelog.py`

```python
#!/usr/bin/env python3
"""
update_changelog.py
Generates a CHANGELOG.md entry on every push to main/master.
Place at: .github/scripts/update_changelog.py
"""

import subprocess
import os
import datetime
import re
import sys
from pathlib import Path

CHANGELOG_FILE  = Path("CHANGELOG.md")
MAX_DIFF_CHARS  = 12000
MAX_COMMITS     = 20
USE_AI          = bool(os.environ.get("GEMINI_API_KEY"))

REPO_NAME   = os.environ.get("REPO_NAME", "unknown/repo")
COMMIT_SHA  = os.environ.get("COMMIT_SHA", "")
PUSHER      = os.environ.get("PUSHER", "unknown")
BRANCH      = os.environ.get("BRANCH", "main")
SHORT_SHA   = COMMIT_SHA[:7] if COMMIT_SHA else "unknown"
NOW_UTC     = datetime.datetime.utcnow()
TIMESTAMP   = NOW_UTC.strftime("%Y-%m-%d %H:%M UTC")
DATE_LABEL  = NOW_UTC.strftime("%Y-%m-%d")


def run_git(args, fallback=""):
    try:
        return subprocess.check_output(["git"] + args, text=True, stderr=subprocess.DEVNULL).strip()
    except subprocess.CalledProcessError:
        return fallback


def get_previous_sha():
    return run_git(["rev-parse", "HEAD~1"], fallback="HEAD~1")


def get_commits_since(since_sha):
    fmt = "%H|||%an|||%s|||%ad"
    raw = run_git(["log", f"{since_sha}..HEAD", f"--format={fmt}", "--date=short", f"--max-count={MAX_COMMITS}"])
    commits = []
    for line in raw.splitlines():
        if "|||" in line:
            parts = line.split("|||", 3)
            if len(parts) == 4:
                sha, author, msg, date = parts
                commits.append({"sha": sha[:7], "author": author, "message": msg.strip(), "date": date})
    return commits


def get_changed_files(since_sha):
    raw = run_git(["diff", "--name-status", f"{since_sha}..HEAD"])
    files = []
    for line in raw.splitlines():
        parts = line.split("\t", 1)
        if len(parts) == 2:
            files.append({"status": parts[0][0], "path": parts[1].strip()})
    return files


def get_diff(since_sha):
    diff = run_git(["diff", f"{since_sha}..HEAD", "--unified=3", "--no-color", "--diff-filter=ACMR"])
    if len(diff) > MAX_DIFF_CHARS:
        diff = diff[:MAX_DIFF_CHARS] + "\n\n[... diff trimmed for length ...]"
    return diff


def get_repo_description():
    for fname in ["README.md", "readme.md"]:
        p = Path(fname)
        if p.exists():
            for line in p.read_text(errors="ignore").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and len(line) > 20:
                    return line[:200]
    return ""


STATUS_LABELS = {"A": "Added", "M": "Modified", "D": "Deleted", "R": "Renamed", "C": "Copied"}

EXT_GROUPS = {
    "Source Code": {".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".cs", ".rb", ".php", ".swift", ".kt"},
    "Styles":      {".css", ".scss", ".sass", ".less"},
    "Markup/Docs": {".md", ".mdx", ".html", ".htm", ".rst", ".txt"},
    "Config":      {".json", ".yaml", ".yml", ".toml", ".ini", ".env"},
    "Tests":       {".test.ts", ".test.js", ".spec.ts", ".spec.js", ".test.py"},
    "Assets":      {".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico"},
    "Build/Deploy":{".sh", "Dockerfile", "Makefile"},
}


def categorize_files(files):
    groups = {}
    for f in files:
        ext = Path(f["path"]).suffix.lower()
        cat = "Other"
        for group, exts in EXT_GROUPS.items():
            if ext in exts:
                cat = "Tests" if ("test" in f["path"].lower() or "spec" in f["path"].lower()) else group
                break
        groups.setdefault(cat, []).append(f)
    return groups


def generate_ai_section(commits, diff, repo_desc):
    if not USE_AI:
        return {
            "summary":    "_AI summary unavailable — set GEMINI_API_KEY secret to enable._",
            "fixed":      "_No AI analysis — commit messages above contain the details._",
            "next_steps": "_Add GEMINI_API_KEY to repository secrets for AI-powered suggestions._",
        }
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel("gemini-1.5-flash")
        commit_text = "\n".join(f"- [{c['sha']}] {c['message']} ({c['author']}, {c['date']})" for c in commits) or "No commits found."
        prompt = f"""You are a developer writing a changelog entry for a software project.

Repository: {REPO_NAME}
{f'Description: {repo_desc}' if repo_desc else ''}

Recent commits:
{commit_text}

Code diff (may be truncated):
```

{diff[:8000]}

```

Write exactly three sections. Be specific, technical, and concise.

Respond in this EXACT format with no other text:

SUMMARY:
- [what changed at a high level]
- [another key change if applicable]

FIXED:
- [specific bug or issue resolved — or "No fixes in this push." if none]

NEXT_STEPS:
- [logical next action based on what was changed]
- [another suggestion]
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        sections = {"summary": [], "fixed": [], "next_steps": []}
        current = None
        for line in text.splitlines():
            line = line.strip()
            if line.startswith("SUMMARY:"):      current = "summary"
            elif line.startswith("FIXED:"):      current = "fixed"
            elif line.startswith("NEXT_STEPS:"): current = "next_steps"
            elif line.startswith("- ") and current:
                sections[current].append(line)

        def fmt(bullets, fallback):
            return "\n".join(bullets) if bullets else fallback

        return {
            "summary":    fmt(sections["summary"],    "- Changes applied successfully."),
            "fixed":      fmt(sections["fixed"],      "- No specific fixes noted in this push."),
            "next_steps": fmt(sections["next_steps"], "- Review the changes and test in your environment."),
        }
    except Exception as e:
        print(f"  ⚠️  AI generation failed: {e}", file=sys.stderr)
        return {
            "summary":    "_AI generation failed — see commit messages above._",
            "fixed":      "_See commit messages._",
            "next_steps": "_Manual review recommended._",
        }


def build_entry(commits, files, ai, since_sha):
    repo_short = REPO_NAME.split("/")[-1] if "/" in REPO_NAME else REPO_NAME
    lines = [
        f"## [{DATE_LABEL}] — Push to `{BRANCH}` by @{PUSHER}\n",
        f"\n",
        f"> **Commit:** [`{SHORT_SHA}`](https://github.com/{REPO_NAME}/commit/{COMMIT_SHA})  \n",
        f"> **Time:** {TIMESTAMP}  \n",
        f"> **Comparing:** [`{since_sha[:7]}...{SHORT_SHA}`](https://github.com/{REPO_NAME}/compare/{since_sha[:7]}...{SHORT_SHA})\n",
        f"\n",
    ]

    lines += ["### 📋 Commits\n\n"]
    if commits:
        for c in commits:
            sha_link = f"[`{c['sha']}`](https://github.com/{REPO_NAME}/commit/{c['sha']})"
            lines.append(f"- {sha_link} — {c['message']} _{c['author']}_\n")
    else:
        lines.append("- _(No new commits detected)_\n")
    lines.append("\n")

    if files:
        groups = categorize_files(files)
        total = len(files)
        added = sum(1 for f in files if f["status"] == "A")
        mod   = sum(1 for f in files if f["status"] == "M")
        deld  = sum(1 for f in files if f["status"] == "D")
        lines += [f"### 📁 Files Changed  _{total} total ({added} added, {mod} modified, {deld} deleted)_\n\n"]
        for cat, cat_files in sorted(groups.items()):
            lines.append(f"**{cat}**\n")
            for f in cat_files:
                lines.append(f"- `{f['path']}` — {STATUS_LABELS.get(f['status'], f['status'])}\n")
            lines.append("\n")
    else:
        lines += ["### 📁 Files Changed\n\n- _(No file changes detected)_\n\n"]

    lines += [
        "### 💡 What Changed\n\n", ai["summary"] + "\n\n",
        "### 🔧 What Was Fixed\n\n", ai["fixed"] + "\n\n",
        "### 🚀 Suggested Next Steps\n\n", ai["next_steps"] + "\n\n",
        "---\n\n",
    ]
    return "".join(lines)


HEADER = """# Changelog

> Auto-generated on every push to `main`. Each entry includes commits,
> changed files grouped by type, an AI summary of what changed, what was
> fixed, and suggested next steps.
>
> **Format:** newest entries at the top.

---

"""


def load_existing():
    if not CHANGELOG_FILE.exists():
        return HEADER, ""
    content = CHANGELOG_FILE.read_text(encoding="utf-8")
    match = re.search(r'^## \[', content, re.MULTILINE)
    if match:
        return content[:match.start()], content[match.start():]
    return content, ""


def write_changelog(new_entry, existing_header, existing_entries):
    entry_blocks = re.split(r'(?=^## \[)', existing_entries, flags=re.MULTILINE)
    entry_blocks = [b for b in entry_blocks if b.strip()]
    kept = entry_blocks[:49]
    content = existing_header + new_entry + "\n".join(kept)
    CHANGELOG_FILE.write_text(content, encoding="utf-8")
    print(f"  ✅ Wrote CHANGELOG.md ({len(content):,} chars, {1 + len(kept)} entries)")


def main():
    print(f"📝 Changelog update: {REPO_NAME} @ {SHORT_SHA} [{BRANCH}]")
    print(f"   AI: {'enabled' if USE_AI else 'disabled — set GEMINI_API_KEY to enable'}")
    since_sha = get_previous_sha()
    commits   = get_commits_since(since_sha)
    files     = get_changed_files(since_sha)
    diff      = get_diff(since_sha)
    repo_desc = get_repo_description()
    print(f"   Commits: {len(commits)}, Files changed: {len(files)}")
    if not commits and not files:
        print("   Nothing to log. Exiting.")
        return
    ai      = generate_ai_section(commits, diff, repo_desc)
    entry   = build_entry(commits, files, ai, since_sha)
    header, existing = load_existing()
    write_changelog(entry, header, existing)
    print("✅ Done.")


if __name__ == "__main__":
    main()
```

---

## Jules Task Instructions

### Task 1 — Set up repo-map

1. Create the repository `DaRipper91/repo-map` if it doesn't exist (public, no template)
2. Create the following files in it using the exact content from this briefing:
   - `.github/workflows/sync.yml` ← File 1
   - `sync_repo_map.py` ← File 2
   - `sync_changelogs.py` ← File 3
3. Create these empty placeholder files so the directory structure exists:
   - `_meta/.gitkeep`
   - `repos/.gitkeep`
4. Create a root `README.md` with this content:

   ```markdown
   # 🗂️ DaRipper91 — Repo Map

   > Initial setup. First sync will populate this file automatically.
   ```

5. Commit everything with message: `🚀 initial setup: repo-map sync infrastructure`

### Task 2 — Add changelog system to each repo

For every repository in the DaRipper91 profile **except** `repo-map` itself:

1. Create `.github/workflows/changelog-workflow.yml` using File 4 above
2. Create `.github/scripts/update_changelog.py` using File 5 above
3. Commit with message: `ci: add auto-changelog workflow`

**Skip these if they exist (don't overwrite):**

- Any existing `CHANGELOG.md` (the script will append to it, not replace it)
- Any existing `.github/workflows/` files other than `changelog-workflow.yml`

### Task 3 — Verify secrets exist

Check whether the following secrets are set on each repo. If any are missing, leave a note in a file called `_meta/secrets-needed.md` in repo-map listing which repos need which secrets:

- `repo-map` needs: `GH_TOKEN`
- Every other repo needs: `GEMINI_API_KEY`

### Task 4 — Trigger first sync

After all files are in place:

1. Trigger the sync workflow manually: `gh workflow run sync.yml --repo DaRipper91/repo-map`
2. Wait for it to complete
3. Verify `repos/` directory is populated with at least one repo folder
4. Verify `_meta/changelog-index.md` was created

---

## Key Facts for Jules to Know

- **All times are UTC.** The cron `0 */2 * * *` means every 2 hours starting at midnight UTC.
- **The changelog does NOT need to exist before the first push.** `update_changelog.py` creates it.
- **The `[skip ci]` tag in the changelog commit message prevents workflow loops.**
- **`paths-ignore: ['CHANGELOG.md']` in the workflow also prevents loops** — it's a second layer of protection.
- **Gemini API key is optional.** Without it, the What Changed / Fixed / Next Steps sections show a placeholder message. The rest of the changelog still works perfectly.
- **repo-map only contains `.md` files.** Do not commit any code, binaries, or non-markdown files to it.
- **Max 50 changelog entries per repo** — older ones are automatically trimmed by `update_changelog.py`.
- **The sync reads file trees via GitHub API** — it does not clone any repos. This keeps it fast and within rate limits.
- **GitHub API rate limit:** 5,000 requests/hour. At every-2-hours with ~50 repos = ~400 calls per sync = well within limits.

---

## Sample CHANGELOG.md Entry (For Reference)

This is what a generated entry looks like after a push:

```markdown
## [2026-02-22] — Push to `main` by @DaRipper91

> **Commit:** [`a3f82c1`](https://github.com/DaRipper91/my-app/commit/a3f82c1)  
> **Time:** 2026-02-22 14:33 UTC  
> **Comparing:** [`9b2e441...a3f82c1`](https://github.com/DaRipper91/my-app/compare/9b2e441...a3f82c1)

### 📋 Commits

- [`a3f82c1`] feat: add user avatar upload to profile page _DaRipper91_
- [`7d14e90`] fix: resolve memory leak in image preview component _DaRipper91_

### 📁 Files Changed _6 total (2 added, 3 modified, 1 deleted)_

**Source Code**

- `src/components/Profile/AvatarUpload.tsx` — Added
- `src/components/Profile/ImagePreview.tsx` — Modified
- `src/hooks/useImageUpload.ts` — Added

**Config**

- `package.json` — Modified

### 💡 What Changed

- Added a complete avatar upload feature to the profile page with drag-and-drop support.
- Introduced a reusable useImageUpload hook handling file validation and preview generation.

### 🔧 What Was Fixed

- Resolved a memory leak in ImagePreview where object URLs were never revoked after use.

### 🚀 Suggested Next Steps

- Add server-side validation for avatar file size and accepted MIME types.
- Write integration tests for the upload flow including error states.

---
```
