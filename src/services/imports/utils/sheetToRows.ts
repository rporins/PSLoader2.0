/**
 * Worksheet -> array-of-arrays reader (exceljs)
 * =============================================
 *
 * Single place where spreadsheet *reading* happens. Replaces the SheetJS
 * (`xlsx`) `read` + `utils.sheet_to_json` pair that used to live inline in
 * fileParser.ts and bstImport/ownerBudgetUpload.ts.
 *
 * Why the swap: `xlsx@0.18.5` is the abandoned npm-registry build of SheetJS
 * and carries two unfixable high-severity advisories (GHSA-4r6h-8v6p-xvw6
 * prototype pollution, GHSA-5pgg-2g8v-p4x9 ReDoS). SheetJS left npm, so there
 * is no patched version to move to. exceljs was already a dependency doing all
 * of our *writing*, so consolidating on it removes a package rather than
 * adding one.
 *
 * What we give up: exceljs cannot read the legacy binary formats — .xls (BIFF)
 * and .xlsb. Only the OOXML family (.xlsx / .xlsm) is supported now. Callers
 * are expected to reject the legacy extensions up front with a useful message
 * rather than letting the load fail obscurely; see `isReadableWorkbookFile`.
 *
 * The output shape deliberately mirrors what SheetJS produced for
 * `sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })`:
 *   - one array per row, padded to a uniform column count,
 *   - empty cells as `''` (never `null`/`undefined`),
 *   - fully-blank rows dropped,
 *   - formulas as their cached result, dates as `Date`.
 * Keeping that contract is what lets the two call sites migrate without
 * touching their downstream parsing.
 */

import ExcelJS from 'exceljs';

/** Extensions we can actually parse. exceljs is OOXML-only. */
export const READABLE_WORKBOOK_EXTENSIONS = ['xlsx', 'xlsm'] as const;

/** Legacy binary formats we used to accept via SheetJS and no longer can. */
export const LEGACY_WORKBOOK_EXTENSIONS = ['xls', 'xlsb'] as const;

export interface SheetRowsResult {
  /** The worksheet actually read (the resolved name, not the requested one). */
  sheetName: string;
  /** Every worksheet in the workbook, in book order — useful for error text. */
  sheetNames: string[];
  /** Row-major cell values, padded to a uniform width. */
  rows: unknown[][];
}

export interface ReadSheetRowsOptions {
  /**
   * Worksheet to read. Matched case- and whitespace-insensitively, because
   * the BST extract's "GL" tab has been seen as `GL `, `gl`, and `GL`.
   * Defaults to the first worksheet.
   */
  sheetName?: string;
}

/**
 * True when `fileName`'s extension is one exceljs can parse. Use this to fail
 * fast with a human-readable message instead of surfacing a zip-parse error.
 */
export function isReadableWorkbookFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (READABLE_WORKBOOK_EXTENSIONS as readonly string[]).includes(ext);
}

/** True for the pre-2007 binary formats we dropped along with SheetJS. */
export function isLegacyWorkbookFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (LEGACY_WORKBOOK_EXTENSIONS as readonly string[]).includes(ext);
}

/** The message shown when someone picks a .xls/.xlsb file. */
export function legacyWorkbookMessage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (
    `".${ext}" files are no longer supported. Open the file in Excel and use ` +
    `File > Save As to save it as .xlsx, then try again.`
  );
}

/**
 * Flatten one exceljs cell value to the primitive SheetJS would have produced.
 *
 * exceljs preserves more structure than SheetJS did: formulas arrive as
 * `{ formula, result }`, styled text as `{ richText: [...] }`, links as
 * `{ text, hyperlink }`, and errors as `{ error: '#N/A' }`. Downstream parsing
 * expects plain scalars, so unwrap to the value a user sees in the cell.
 */
function normalizeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;

  const obj = value as Record<string, unknown>;

  // Formula (and shared-formula) cells: take the cached result. A formula that
  // has never been calculated has no `result`, which reads as an empty cell.
  if ('formula' in obj || 'sharedFormula' in obj) {
    return 'result' in obj ? normalizeCellValue(obj.result) : '';
  }

  // Error cells ({ error: '#DIV/0!' }) read as empty, matching SheetJS — an
  // error string leaking into the data would be parsed as a value downstream.
  if ('error' in obj) return '';

  // Hyperlinks: the display text, not the target. `text` can itself be rich.
  if ('hyperlink' in obj) {
    return 'text' in obj ? normalizeCellValue(obj.text) : '';
  }

  // Rich text: concatenate the runs, discarding per-run formatting.
  if ('richText' in obj && Array.isArray(obj.richText)) {
    return (obj.richText as Array<{ text?: unknown }>)
      .map((run) => (run?.text == null ? '' : String(run.text)))
      .join('');
  }

  return value;
}

/**
 * Read one worksheet into a padded array-of-arrays.
 *
 * `source` is the raw workbook bytes — a Buffer in the main process, or an
 * ArrayBuffer forwarded from the renderer over IPC.
 */
export async function readSheetRows(
  source: Buffer | ArrayBuffer | Uint8Array,
  options: ReadSheetRowsOptions = {}
): Promise<SheetRowsResult> {
  const workbook = new ExcelJS.Workbook();

  // exceljs wants a Buffer/ArrayBuffer; normalize Uint8Array views so we do
  // not accidentally hand it the whole backing buffer of a subarray.
  const bytes =
    source instanceof Uint8Array
      ? source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
      : source;
  await workbook.xlsx.load(bytes as ArrayBuffer);

  const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
  if (sheetNames.length === 0) {
    throw new Error('The file contains no worksheets.');
  }

  const requested = options.sheetName;
  const worksheet = requested
    ? workbook.worksheets.find(
        (sheet) => sheet.name.trim().toLowerCase() === requested.trim().toLowerCase()
      )
    : workbook.worksheets[0];

  if (!worksheet) {
    throw new Error(
      `Sheet '${requested}' not found. Available sheets: ${sheetNames.join(', ')}`
    );
  }

  // `columnCount` spans the sheet's used range, which is the closest analogue
  // to the `!ref` range SheetJS padded rows out to.
  const width = worksheet.columnCount;
  const rows: unknown[][] = [];

  // includeEmpty so that `hasValues` gets a chance to classify every row in
  // the range rather than exceljs silently skipping the empty ones.
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    // `blankrows: false`, matching SheetJS exactly: drop rows that have no
    // cells at all, but KEEP a row whose cells are present-but-empty. The
    // distinction matters because dropping a row shifts every row number
    // after it, and validation errors are reported to users as "Row N: ...".
    if (!row.hasValues) return;

    const cells: unknown[] = new Array(width);
    for (let column = 1; column <= width; column++) {
      cells[column - 1] = normalizeCellValue(row.getCell(column).value);
    }
    rows.push(cells);
  });

  return { sheetName: worksheet.name, sheetNames, rows };
}
