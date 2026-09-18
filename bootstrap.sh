#!/usr/bin/env bash
set -euo pipefail
cat bootstrap/part-*.txt > /tmp/project.b64
base64 -d /tmp/project.b64 > /tmp/project.tar.gz
tar -xzf /tmp/project.tar.gz -C .
rm -rf bootstrap
rm -f bootstrap.sh
rm -f .github/workflows/bootstrap.yml
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit"
  exit 0
fi
git commit -m "feat: implement Pedro & Larissa gift registry"
git push origin HEAD:main
