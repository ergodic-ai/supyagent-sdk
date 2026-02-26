#!/usr/bin/env bash
set -euo pipefail

# publish.sh — Bump version and publish @supyagent/sdk + create-supyagent-app
#
# Usage:
#   ./scripts/publish.sh          # bump patch (0.1.38 → 0.1.39)
#   ./scripts/publish.sh minor    # bump minor (0.1.38 → 0.2.0)
#   ./scripts/publish.sh major    # bump major (0.1.38 → 1.0.0)
#   ./scripts/publish.sh 0.2.0    # set explicit version

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SDK_PKG="$ROOT_DIR/packages/sdk/package.json"
APP_PKG="$ROOT_DIR/packages/create-app/package.json"

# ── Read current version ──────────────────────────────────────────────
current=$(node -p "require('$SDK_PKG').version")
echo "Current version: $current"

# ── Compute next version ──────────────────────────────────────────────
bump="${1:-patch}"

if [[ "$bump" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  next="$bump"
elif [[ "$bump" == "patch" || "$bump" == "minor" || "$bump" == "major" ]]; then
  IFS='.' read -r major minor patch <<< "$current"
  case "$bump" in
    patch) next="$major.$minor.$((patch + 1))" ;;
    minor) next="$major.$((minor + 1)).0" ;;
    major) next="$((major + 1)).0.0" ;;
  esac
else
  echo "Error: invalid bump type '$bump'. Use patch, minor, major, or an explicit version." >&2
  exit 1
fi

echo "Bumping to:      $next"
echo ""

# ── Update package.json versions ──────────────────────────────────────
for pkg in "$SDK_PKG" "$APP_PKG"; do
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$pkg', 'utf8'));
    pkg.version = '$next';
    fs.writeFileSync('$pkg', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo "Updated $(basename "$(dirname "$pkg")")/package.json → $next"
done

# ── Build ─────────────────────────────────────────────────────────────
echo ""
echo "Building..."
cd "$ROOT_DIR"
pnpm build

# ── Publish ───────────────────────────────────────────────────────────
echo ""
echo "Publishing @supyagent/sdk@$next..."
cd "$ROOT_DIR/packages/sdk"
npm publish --access public

echo ""
echo "Publishing create-supyagent-app@$next..."
cd "$ROOT_DIR/packages/create-app"
npm publish --access public

# ── Git tag ───────────────────────────────────────────────────────────
echo ""
cd "$ROOT_DIR"
if git rev-parse HEAD &>/dev/null; then
  git add packages/sdk/package.json packages/create-app/package.json
  git commit -m "Bump to v$next"
  git tag "v$next"
  echo "Committed and tagged v$next"
  echo "Run 'git push && git push --tags' to push."
else
  echo "Not a git repo — skipping commit and tag."
fi

echo ""
echo "Done! Published @supyagent/sdk@$next and create-supyagent-app@$next"
