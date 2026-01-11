# Apply patch, ensure pnpm@10.x, regenerate pnpm-lock.yaml, commit and push
# Run this in PowerShell from the repository root: `.ix\apply-and-push.ps1`
set-StrictMode -Version Latest

function ExitOnError($msg){ Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Apply patch
$patch = Join-Path $PWD 'fix\0001-fix-pnpm-lockfile-update.patch'
if(-not (Test-Path $patch)){ ExitOnError "Patch not found: $patch" }
Write-Host "Applying patch: $patch"
try {
  git apply --index $patch
} catch {
  Write-Host "git apply failed, attempting fallback 'git apply' without --index" -ForegroundColor Yellow
  try { git apply $patch } catch { ExitOnError "Failed to apply patch. Ensure git is installed and you're in the repo root." }
}

# Ensure corepack / pnpm
Write-Host "Ensuring pnpm@10.x is available..."
$hasCorepack = (Get-Command corepack -ErrorAction SilentlyContinue) -ne $null
if($hasCorepack){
  Write-Host "Using corepack to enable pnpm@10.27.0"
  corepack enable
  corepack prepare pnpm@10.27.0 --activate
} else {
  Write-Host "corepack not found; trying to install pnpm globally via npm"
  $hasNpm = (Get-Command npm -ErrorAction SilentlyContinue) -ne $null
  if(-not $hasNpm){ ExitOnError "npm/corepack not found. Install Node.js (which includes npm) or ensure corepack is available." }
  npm i -g pnpm@10.27.0
}

# Run pnpm install to regenerate lockfile
Write-Host "Running pnpm install (this updates pnpm-lock.yaml)..."
$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
if(-not $pnpm){ ExitOnError "pnpm not found after installation steps" }
& $pnpm install
if($LASTEXITCODE -ne 0){ ExitOnError "pnpm install failed" }

# Stage lockfile and package.json and commit
Write-Host "Staging changes and committing..."
# Files to add
$filesToAdd = @('pnpm-lock.yaml','package.json')
$existing = $filesToAdd | Where-Object { Test-Path $_ }
if($existing.Count -eq 0){ Write-Host "No lockfile/package.json changes detected to commit." }
else {
  git add $existing
  git commit -m "chore: update pnpm-lock.yaml to match package.json (fix Vercel frozen-lockfile)" || Write-Host "No commit created (possibly no changes)."
}

# Push to current branch
$hasGit = (Get-Command git -ErrorAction SilentlyContinue) -ne $null
if(-not $hasGit){ ExitOnError "git not found. Install git and run this script again to push." }

# Determine current branch
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if(-not $branch){ $branch = 'main' }
Write-Host "Pushing commits to origin/$branch"
try {
  git push origin $branch
  Write-Host "Push complete." -ForegroundColor Green
} catch {
  Write-Host "Push failed. Please check remote configuration and credentials." -ForegroundColor Yellow
}

Write-Host "Done. If the deploy does not trigger on Vercel, open a PR or push to the default branch." -ForegroundColor Cyan
