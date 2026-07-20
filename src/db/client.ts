/**
 * SQLite driver shim — better-sqlite3 behind the libsql client surface.
 * --------------------------------------------------------------------
 * `local_db.ts` was written against `@libsql/client` and has ~190 call sites
 * using `client.execute()` / `client.batch()`. libSQL is feature-frozen upstream
 * and ~20x slower than better-sqlite3 on local-file reads, but none of its
 * reasons for existing (Turso remote, embedded replicas, http/ws URLs) were ever
 * used here — the client was always `file:` only.
 *
 * Rather than rewrite 7,700 lines, this module reproduces the exact slice of the
 * libsql API that `local_db.ts` consumes, backed by better-sqlite3. The call
 * sites, the `await`s and every exported signature in `local_db.ts` stay as they
 * were.
 *
 * Invariants:
 *   - The methods stay `async` even though the driver is synchronous. Callers
 *     (all of `src/ipc/handlers/*`, `src/services/imports/*`, `src/main/auth/*`)
 *     await them; awaiting an already-resolved value costs one microtask.
 *   - `batch()` is transactional, because libsql's is. Callers rely on it.
 *   - The database file is stock SQLite in both drivers — switching does not
 *     touch, convert or migrate psloader.db.
 */

import Database from "better-sqlite3-multiple-ciphers";

/** A value SQLite can bind directly. Everything else is coerced by `normalize`. */
type BoundValue = string | number | bigint | Buffer | null;

/** The subset of libsql's ResultSet that `local_db.ts` actually reads. */
export interface ResultSet {
  rows: any[];
  rowsAffected: number;
  lastInsertRowid: number | undefined;
  columns: string[];
}

/** A query in either of the two forms libsql accepts. */
export type Query = string | { sql: string; args?: any[] };

export interface Client {
  execute(query: Query): Promise<ResultSet>;
  batch(queries: Query[]): Promise<ResultSet[]>;
  close(): void;
}

export interface ClientConfig {
  /** `file:<path>` or a bare path. `:memory:` is supported for tests. */
  url: string;
  /** Enables SQLCipher-style encryption. Left unset — see the plan notes. */
  encryptionKey?: string;
}

const EMPTY: ResultSet = { rows: [], rowsAffected: 0, lastInsertRowid: undefined, columns: [] };

/** `PSLOADER_DB_TRACE=<ms>` logs any query slower than that. 0 / unset = off. */
const TRACE_SLOW_MS = Number(process.env.PSLOADER_DB_TRACE) || 0;

/**
 * better-sqlite3 binds only numbers, strings, bigints, buffers and null; it
 * throws on booleans and Dates, which libsql accepted. This function reproduces
 * libsql's coercions *exactly* — verified against it query-by-query — so the
 * driver swap cannot change what lands in a column.
 *
 * That means deliberately keeping two behaviours that look wrong in isolation:
 *   - `Date` binds as epoch milliseconds, not ISO. libsql did that, so any row
 *     already written that way must keep round-tripping the same. (No current
 *     call site passes a raw Date — they all call `.toISOString()` first — so
 *     this is belt-and-braces.)
 *   - `undefined` throws rather than binding NULL. Being more permissive would
 *     silently turn a latent bug into a wrong `WHERE` match instead of a loud
 *     failure. Changing either is a product decision, not a driver-swap detail.
 */
function normalize(args: any[] | undefined): BoundValue[] {
  if (!args || args.length === 0) return [];
  return args.map((arg, i) => {
    if (arg === undefined) {
      throw new TypeError(
        `undefined cannot be passed as argument to the database (argument ${i})`
      );
    }
    if (arg === null) return null;
    switch (typeof arg) {
      case "boolean":
        return arg ? 1 : 0;
      case "string":
      case "number":
      case "bigint":
        return arg;
      case "object":
        if (arg instanceof Date) return arg.getTime();
        if (Buffer.isBuffer(arg)) return arg;
        if (arg instanceof Uint8Array) return Buffer.from(arg);
        // Objects/arrays were never bindable in either driver; JSON matches how
        // the callers that pass them already store them.
        return JSON.stringify(arg);
      default:
        return String(arg);
    }
  });
}

/** libsql accepts `file:C:\path`, `file://…` or a bare path. Reduce to a path. */
function toFilePath(url: string): string {
  if (url === ":memory:") return url;
  let out = url.startsWith("file:") ? url.slice(5) : url;
  if (out.startsWith("//")) out = out.slice(2);
  return out;
}

export function createClient(config: ClientConfig): Client {
  const db = new Database(toFilePath(config.url));

  if (config.encryptionKey) {
    // SQLite3MultipleCiphers: must be the first statement on the connection.
    db.pragma(`key = '${config.encryptionKey.replace(/'/g, "''")}'`);
  }

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");

  /**
   * Preparing a statement is the expensive part of a better-sqlite3 query; the
   * cache is where most of the speedup over libsql comes from. SQLite
   * re-prepares cached statements itself when the schema changes, so the
   * migration blocks in `local_db.ts` are safe.
   *
   * Bounded, because the key is the SQL text and a lot of that text is built at
   * runtime — `IN (${placeholders})` lists sized by the number of accounts,
   * departments or periods in play. An unbounded map would accumulate a new
   * entry per distinct shape for the life of the process, each pinning a
   * prepared statement. LRU: re-inserting on hit moves the key to the end of
   * Map iteration order, so the oldest key is always the first one out.
   */
  const MAX_CACHED_STATEMENTS = 200;
  const statements = new Map<string, Database.Statement>();

  function prepare(sql: string): Database.Statement {
    const cached = statements.get(sql);
    if (cached) {
      statements.delete(sql);
      statements.set(sql, cached);
      return cached;
    }

    const stmt = db.prepare(sql);
    statements.set(sql, stmt);
    if (statements.size > MAX_CACHED_STATEMENTS) {
      const oldest = statements.keys().next().value;
      if (oldest !== undefined) statements.delete(oldest);
    }
    return stmt;
  }

  function runOne(query: Query): ResultSet {
    const sql = typeof query === "string" ? query : query.sql;
    const args = typeof query === "string" ? [] : normalize(query.args);

    if (!TRACE_SLOW_MS) return runOneInner(sql, args);

    // Opt-in slow-query log. `set PSLOADER_DB_TRACE=25` logs every query over
    // 25ms; grouping that output by SQL shape is how the 232-query N+1 in
    // getRoomSegmentExportData was found. Off unless the variable is set.
    const t0 = process.hrtime.bigint();
    try {
      return runOneInner(sql, args);
    } finally {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      if (ms >= TRACE_SLOW_MS) {
        // Identify by the whole statement, not a prefix: sibling queries here
        // can share hundreds of leading characters and differ only in a WHERE
        // clause, which is enough to misattribute a hotspot to the wrong caller.
        const flat = sql.replace(/\s+/g, " ").trim();
        let hash = 0;
        for (let i = 0; i < flat.length; i++) hash = (Math.imul(hash, 31) + flat.charCodeAt(i)) | 0;
        const shape = (hash >>> 0).toString(36).padStart(7, "0");
        console.log(`[db-slow] ${ms.toFixed(0)}ms #${shape} :: ${flat.slice(0, 90)}`);
      }
    }
  }

  function runOneInner(sql: string, args: BoundValue[]): ResultSet {
    const stmt = prepare(sql);

    // `reader` is better-sqlite3's own answer to "does this return rows?" — more
    // reliable than sniffing the SQL text, which has to cope with WITH, PRAGMA,
    // EXPLAIN and RETURNING.
    if (stmt.reader) {
      const rows = stmt.all(...args) as any[];
      return {
        rows,
        rowsAffected: 0,
        lastInsertRowid: undefined,
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      };
    }

    const info = stmt.run(...args);
    return {
      rows: [],
      rowsAffected: info.changes,
      // Callers treat this as a number (`as number`, `Number(...)`); better-sqlite3
      // hands back a bigint only under safeIntegers, which we leave off.
      lastInsertRowid: Number(info.lastInsertRowid),
      columns: [],
    };
  }

  return {
    async execute(query: Query): Promise<ResultSet> {
      return runOne(query);
    },

    async batch(queries: Query[]): Promise<ResultSet[]> {
      if (!queries || queries.length === 0) return [];
      // libsql's batch is implicitly a transaction; matching that is what makes
      // the bulk import paths (insertBatchFinancialData & friends) both correct
      // and dramatically faster than the per-statement round trips they replace.
      const tx = db.transaction((qs: Query[]) => qs.map(runOne));
      return tx(queries);
    },

    close(): void {
      statements.clear();
      db.close();
    },
  };
}

export { EMPTY as EMPTY_RESULT_SET };
