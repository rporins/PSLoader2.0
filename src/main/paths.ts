/**
 * On-disk locations — single source of truth.
 * -----------------------------------------------------------
 * `psloader.db` is not a document. It holds machine-bound secret material:
 * the permanent device salt and the refresh token, both DPAPI-wrapped via
 * Electron `safeStorage` (see the salt handling in `local_db.ts` and
 * `main/auth/secureStore.ts`). DPAPI ciphertext is bound to this user on this
 * machine, so the file must live somewhere that never syncs to another machine.
 *
 * That rules out both of the obvious candidates:
 *   - `Documents` (where it used to live) is routinely redirected into OneDrive
 *     by Known Folder Move on a domain-joined box.
 *   - `app.getPath("userData")` on Windows is `%APPDATA%` — Roaming — which
 *     syncs under roaming profiles / Enterprise State Roaming.
 *
 * Restoring the DB on a second machine yields blobs that cannot be decrypted,
 * and the orphan guard in `getPermanentSalt()` then (correctly) refuses to mint
 * a replacement rather than silently changing `device_secret` and orphaning an
 * already-registered device. Sync also means a second writer against a live
 * SQLite file, which is how `-wal`/`-shm` damage actually happens.
 *
 * So: `%LOCALAPPDATA%\PS Loader 2.0` on Windows, `userData` elsewhere (macOS and
 * Linux have no roaming split). Everything under the user profile, so no
 * elevation is required.
 *
 * Invariants:
 *   - Resolution happens HERE, not via `app.setPath()`. `local_db.ts` opens its
 *     connection at import time, so a `setPath` call would have to run before
 *     that import — an import-order landmine. A function called on the line
 *     above `createClient` is order-safe no matter who imports what.
 *   - `getDataDir()` is safe to call before `app.on("ready")`: `getPath("home")`
 *     and `getPath("documents")` both resolve pre-ready, and nothing here
 *     touches `safeStorage`.
 *   - The legacy migration MOVES the database. It never recreates one — a fresh
 *     empty DB at the new path while the old one still holds the salt would
 *     orphan the device.
 */

import { app } from "electron";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3-multiple-ciphers";

/** The database filename, unchanged by the move. */
export const DB_FILENAME = "psloader.db";

/** SQLite's sidecars. Present only while a connection is open or after a crash. */
const DB_SIDECARS = ["-wal", "-shm"];

/** Where the database lived before this migration: `Documents\PSLoader`. */
export const LEGACY_DATA_DIR = path.join(app.getPath("documents"), "PSLoader");

/** Resolved once per process — the migration must not run twice in one launch. */
let cachedDataDir: string | null = null;

/**
 * The directory holding `psloader.db` and any future local state.
 *
 * Creates it, migrates a legacy `Documents\PSLoader` install on first run, and
 * memoises the result. Never throws: on any migration failure it falls back to
 * the legacy directory, which keeps a live user working against their real data
 * instead of starting empty.
 */
export function getDataDir(): string {
  if (cachedDataDir) return cachedDataDir;

  const target = resolveDataDir();
  fs.mkdirSync(target, { recursive: true });

  cachedDataDir = migrateLegacyDataDir(target);
  return cachedDataDir;
}

/** The intended location, before any migration is considered. */
function resolveDataDir(): string {
  if (process.platform !== "win32") {
    // macOS: ~/Library/Application Support/<app>. Linux: ~/.config/<app>.
    // Neither has a roaming/local split, so the default is already correct.
    return app.getPath("userData");
  }

  // %LOCALAPPDATA% is set on every supported Windows install; the fallback is
  // for a stripped service/environment where it has been unset.
  const localAppData =
    process.env.LOCALAPPDATA ||
    path.join(app.getPath("home"), "AppData", "Local");

  return path.join(localAppData, "PS Loader 2.0");
}

/**
 * Relocate a `Documents\PSLoader` install into `target`, once.
 *
 * Returns the directory the caller should actually use — `target` on success or
 * when there was nothing to do, `LEGACY_DATA_DIR` if the move failed and the old
 * data is still the good copy.
 *
 * Ordered so that every interruption point leaves a recoverable state, and so
 * that re-running it against an already-migrated install is a no-op. Two
 * processes cannot race here: `main.ts` takes the single-instance lock and the
 * second instance quits.
 */
function migrateLegacyDataDir(target: string): string {
  const targetDb = path.join(target, DB_FILENAME);
  const legacyDb = path.join(LEGACY_DATA_DIR, DB_FILENAME);

  // 1) Already migrated. The steady-state path on every launch after the first,
  //    and the reason a re-run can never clobber live data.
  if (fs.existsSync(targetDb)) return target;

  // 2) Fresh install — nothing to move. `local_db.ts` creates the schema.
  if (!fs.existsSync(legacyDb)) return target;

  console.log(`[paths] Migrating local database: ${LEGACY_DATA_DIR} -> ${target}`);

  try {
    // 3) Fold the WAL into the main file so step 4 moves one self-contained
    //    file. Nothing has ever closed this database cleanly, so the WAL can
    //    hold committed data the `.db` does not — copying without checkpointing
    //    would lose it. A clean close also unlinks the sidecars.
    const checkpointed = checkpointLegacyWal(legacyDb);

    // 4) Move. Sidecars only if the checkpoint failed and they still exist.
    const files = checkpointed ? [DB_FILENAME] : [DB_FILENAME, ...DB_SIDECARS.map((s) => DB_FILENAME + s)];
    for (const name of files) {
      moveFile(path.join(LEGACY_DATA_DIR, name), path.join(target, name));
    }

    // 5) Drop the legacy folder. Non-recursive on purpose: it succeeds when the
    //    folder held only the database we just moved, and fails harmlessly if
    //    the user parked their own files in there. Never recursively delete
    //    anything inside Documents.
    try {
      fs.rmdirSync(LEGACY_DATA_DIR);
    } catch {
      console.log("[paths] Legacy folder not empty — left in place.");
    }

    console.log("[paths] Local database migrated successfully.");
    return target;
  } catch (error) {
    // 6) Keep running against the intact legacy copy. Proceeding to the empty
    //    new directory would mint a fresh database — and a fresh salt — which
    //    orphans an already-registered device. Retried on the next launch.
    console.error(
      "[paths] Database migration failed — continuing from the legacy location:",
      error
    );
    return LEGACY_DATA_DIR;
  }
}

/**
 * `PRAGMA wal_checkpoint(TRUNCATE)` + clean close on the legacy file. Returns
 * whether the sidecars are gone afterwards; a `false` return is not fatal, it
 * just means the caller has to move them alongside the database.
 */
function checkpointLegacyWal(legacyDb: string): boolean {
  try {
    // The same driver `src/db/client.ts` uses, opened directly rather than
    // through `createClient` — this connection wants a checkpoint and a close,
    // not the WAL/foreign-key/statement-cache setup that shim applies.
    const db = new Database(legacyDb);
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
    } finally {
      db.close();
    }
    return DB_SIDECARS.every((s) => !fs.existsSync(legacyDb + s));
  } catch (error) {
    console.warn(
      "[paths] Could not checkpoint the legacy WAL — moving the sidecars instead:",
      error
    );
    return false;
  }
}

/**
 * Move one file, tolerating a missing source (the sidecars usually are).
 *
 * `rename` first — atomic, no window in which the data exists nowhere. It can
 * fail across volumes (`EXDEV`) or when Documents is a OneDrive reparse point
 * (`EPERM`/`EBUSY`), so the fallback copies, verifies the size, and only then
 * unlinks the source. A crash mid-fallback leaves both copies, and the next
 * launch takes the already-migrated branch.
 */
function moveFile(from: string, to: string): void {
  if (!fs.existsSync(from)) return;

  try {
    fs.renameSync(from, to);
    return;
  } catch (error) {
    console.warn(`[paths] rename failed for ${path.basename(from)}, copying instead:`, error);
  }

  fs.copyFileSync(from, to);
  const source = fs.statSync(from).size;
  const copied = fs.statSync(to).size;
  if (source !== copied) {
    // Short copy: bin it and leave the source untouched, so the caller's catch
    // falls back to a legacy directory that is still whole.
    fs.unlinkSync(to);
    throw new Error(
      `Copy of ${path.basename(from)} is ${copied} bytes, expected ${source}`
    );
  }

  try {
    fs.unlinkSync(from);
  } catch (error) {
    // The copy is complete and size-verified, so the migration has succeeded —
    // an undeletable source (another handle still open on it) is a cleanup
    // nuisance, not a reason to fall back and keep using the old location.
    console.warn(`[paths] Could not remove ${from} after copying:`, error);
  }
}
