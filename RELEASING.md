# Releasing PS Loader 2.0

How to cut a release, plus the environment gotchas we hit getting publish to work
(especially on locked-down corporate machines). Read the **Release checklist**
first; the **Troubleshooting** section explains the *why* behind each workaround.

## How shipping works

- The app is **Electron Forge** + **Squirrel.Windows** (`@electron-forge/maker-squirrel`
  → `electron-winstaller`), published to **GitHub Releases** via
  `@electron-forge/publisher-github` (see `forge.config.ts`).
- Installed clients auto-update with **`update-electron-app`** (`src/main.ts`), which
  reads artifacts from `update.electronjs.org` → our GitHub Releases.
- The publisher is configured with **`draft: true`**, so `npm run publish` creates a
  **draft** release. Clients do **not** get the update until you open the draft on
  GitHub and click **Publish release**.
- Build is **x64 only** — now by *choice*, not by constraint. This used to be forced
  by libSQL, which only shipped an x64 Windows binary; since the move to
  `better-sqlite3-multiple-ciphers` (which publishes `win32-x64`, `win32-arm64` and
  `win32-ia32` prebuilds) other Windows arches are buildable if we ever want them.
  A missing `x32` folder under `out/make/...` is still expected, not a bug.

## Release checklist

1. Make sure the app isn't running (it locks files under `out\`).
2. Commit your code changes first (`npm version` requires a clean working tree).
3. Bump the version — this also commits and tags:
   ```powershell
   npm version patch          # 1.0.130 -> 1.0.131 (commit + tag v1.0.131)
   ```
   If the tag already exists (a burned version number), bump to the next free one:
   ```powershell
   git tag -l "v1.0.13*"      # find next free
   npm version 1.0.131        # use an explicit free version
   ```
4. Clean previous build output:
   ```powershell
   Remove-Item -Recurse -Force .\out
   ```
5. Publish (see **Corporate network** below for the cert var):
   ```powershell
   $env:NODE_EXTRA_CA_CERTS = "$env:USERPROFILE\corp-roots.pem"
   npm run publish
   ```
   Success = `out\make\squirrel.windows\x64\` contains
   `ps_loader-<ver>-full.nupkg`, `RELEASES`, and `PS Loader 2.0 Setup.exe`.
6. Push the version commit + tag:
   ```powershell
   git push --follow-tags
   ```
7. On GitHub, open the **draft** release for the new version and click
   **Publish release**. Auto-update only serves published (non-draft) releases.

## Environment fixes (the stuff that bit us)

### 0. Native SQLite module is built per Electron ABI

The database driver (`better-sqlite3-multiple-ciphers`) is a **V8-ABI** native module,
so Electron Forge rebuilds it for the target Electron on every `start` / `package`.
Two consequences:

- **`node-abi` must know your Electron version.** It's pinned via `overrides` in
  `package.json` to `^3.94.0`. Without it the build dies at *"Preparing native
  dependencies"* with `Could not detect abi for version <x> and runtime electron`.
  **Do not bump it to 4.x** — v4 is ESM-only and cannot be `require()`d by
  `@electron/rebuild` or `prebuild-install`, which both consume it. If you upgrade
  Electron and hit that error again, raise the 3.x pin.
- **After any Forge command, `node_modules` holds an Electron-ABI binary.** Plain
  `node` can no longer load it — you'll get `NODE_MODULE_VERSION 140 ... requires 137`.
  That's expected, not corruption. To run a standalone Node script against the DB,
  install a throwaway copy of the driver in a scratch folder rather than rebuilding
  the repo's.

The predecessor (`@libsql/client`) was Node-API and needed no rebuild, so this whole
class of problem is new as of that switch. It buys ~10-24x on query throughput.

### 1. electron-winstaller 7z bug — FIXED automatically, do not remove

**Symptom:** `npm run publish` builds fine, then Squirrel's releasify dies with:
```
Utility: Failed to extract file ...\ps_loader-<ver>-full.nupkg to ...\SquirrelTemp\tempa
The system cannot find the file specified
... Win32Exception at Squirrel.Utility.CreateZipFromDirectory
```
Only the intermediate `ps_loader.<ver>.nupkg` is produced; no `Setup.exe`/`RELEASES`.

**Cause:** `electron-winstaller@5.4.0` ships only arch-suffixed 7-Zip binaries
(`vendor/7z-x64.exe`, `7z-x64.dll`) and relies on its own postinstall
(`node_modules/electron-winstaller/script/select-7z-arch.js`) to copy the host-arch
one to `vendor/7z.exe` / `vendor/7z.dll`. **That script is broken** — it uses
`os.arch` (the function) instead of `os.arch()`, so the copy never happens and the
plain `7z.exe`/`7z.dll` Squirrel needs to extract the nupkg are missing.

**Fix (in this repo):** `scripts/fix-winstaller-7z.js` creates the missing files
correctly. It runs automatically via the `postinstall` script in `package.json`, so a
fresh `npm install` self-heals on any machine. It's idempotent and never throws — a
no-op where the files already exist. If you ever need to run it manually:
```powershell
node ./scripts/fix-winstaller-7z.js
```

> Note: `node_modules` is per-machine and git-ignored, so this bug appears only on
> machines whose install didn't already have `7z.exe`. That's why it failed on the
> corporate machine but not a personal rig that had a working copy from an earlier
> install. The committed `postinstall` normalizes both.

### 2. Corporate network — self-signed certificate in certificate chain

**Symptom:** publish reaches the upload step then fails with
`RequestError: self-signed certificate in certificate chain`.

**Cause:** corporate TLS interception (proxy injects its own root CA). Forge's GitHub
publisher uses Node's HTTP client, and Node doesn't trust the corporate root CA.
(`git push` works because Git uses the Windows cert store; Node has its own.)

**Fix — preferred (keeps TLS verification on):** export the Windows root store to a
PEM and point Node at it:
```powershell
$pem = "$env:USERPROFILE\corp-roots.pem"
Get-ChildItem Cert:\LocalMachine\Root | ForEach-Object {
  "-----BEGIN CERTIFICATE-----"
  [Convert]::ToBase64String($_.RawData, 'InsertLineBreaks')
  "-----END CERTIFICATE-----"
} | Out-File -Encoding ascii $pem
$env:NODE_EXTRA_CA_CERTS = $pem
# optional, make permanent: setx NODE_EXTRA_CA_CERTS "$env:USERPROFILE\corp-roots.pem"
```
**Fix — quick/unsafe (one-off only):** disable TLS verification for the session:
```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```
Only affects the network/upload step. It does **not** help any local build failure.

### 3. Version tag collisions

**Symptom:** `npm version patch` bumps `package.json` and commits, then fails with
`fatal: tag 'v1.0.x' already exists`.

**Cause:** that version number was already tagged/released. `npm version` does
bump+commit before tagging, so you're left with a bump commit and no tag.

**Fix:** move to the next free version. Either re-point the bump commit
(`npm version <next> --no-git-tag-version` → `git commit -a --amend` →
`git tag v<next>`) or undo and redo (`git reset --hard HEAD~1` → `npm version <next>`,
safe because the bump commit is auto-generated).

## Things we investigated and RULED OUT (don't chase these)

- **Long paths (>260).** Max path under `out\...\node_modules` measured **214** — not
  the cause. No need for the long-paths registry flag or a `subst` drive.
- **Node version.** Node 24/26 is fine. The `DEP0174`/`DEP0187` deprecation warnings
  during the build are noise; the real failure was the missing `7z.exe` (item 1). No
  Node downgrade is needed.
- **Antivirus quarantine.** Plausible on a corporate box, but not what happened here —
  `SquirrelTemp` simply never received a `7z.exe` to begin with.

## Quick troubleshooting table

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Could not detect abi for version <x> and runtime electron` | `node-abi` predates your Electron | raise the `node-abi` pin in `overrides` (stay on 3.x) |
| `NODE_MODULE_VERSION 140 ... requires 137` running a plain Node script | driver is built for Electron, not Node | expected — use a scratch install, don't rebuild the repo's |
| `cannot find the file specified` in Squirrel releasify; only intermediate `.nupkg` produced | missing `vendor/7z.exe` (electron-winstaller bug) | `node ./scripts/fix-winstaller-7z.js` (auto via postinstall) |
| `self-signed certificate in certificate chain` at upload | corporate TLS interception | set `NODE_EXTRA_CA_CERTS` (or `NODE_TLS_REJECT_UNAUTHORIZED=0`) |
| `tag 'v1.0.x' already exists` | version already released | bump to next free version |
| no `x32` folder in `out/make` | x64-only build by design | not an error — ignore |
| clients not updating after publish | release left as draft | publish the draft release on GitHub |
