# fix: update pnpm lockfile

This folder contains a patch and a helper script to update the `pnpm-lock.yaml` to match `package.json`, commit the changes and push them to the repository. Use when Vercel fails the build with `ERR_PNPM_OUTDATED_LOCKFILE`.

Files:

- `0001-fix-pnpm-lockfile-update.patch` — the patch that updates `package.json` (already applied locally by the script if possible).
- `apply-and-push.ps1` — PowerShell helper that will:
  1. apply the patch via `git apply` (tries with `--index` first),
  2. enable `corepack` and prepare `pnpm@10.27.0` (or install pnpm via `npm`),
  3. run `pnpm install` to regenerate `pnpm-lock.yaml`,
  4. commit `pnpm-lock.yaml` and `package.json`, and push to the current branch.

How to run (Windows PowerShell, from project root):

```powershell
# run with execution policy if needed
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\fix\apply-and-push.ps1
```

Notes & troubleshooting:

- The script expects `git`, `node` and `npm` (or `corepack`) to be available in PATH. If not present, install them first.
- If you prefer a safer manual flow: run `corepack enable; corepack prepare pnpm@10.27.0 --activate; pnpm install; git add pnpm-lock.yaml package.json; git commit -m "chore: update pnpm-lock.yaml"; git push`.
- If you cannot update the lockfile immediately, you can temporarily allow Vercel to run `pnpm install --no-frozen-lockfile` in the Project Settings > Build & Development Settings -> Install Command.
