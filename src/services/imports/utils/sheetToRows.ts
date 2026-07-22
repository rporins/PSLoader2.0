/**
 * Worksheet -> array-of-arrays reader (exceljs + SheetJS)
 * =======================================================
 *
 * Single place where spreadsheet *reading* happens, for both the filePath
 * callers in fileParser.ts and the renderer-buffer path in
 * bstImport/ownerBudgetUpload.ts.
 *
 * Two readers, picked by content — never by extension, because the files that
 * break us lie about their extension:
 *
 *   - exceljs for genuine OOXML (.xlsx / .xlsm). It is our *writing* library
 *     already, so real workbooks stay on the fast, well-exercised path.
 *   - SheetJS (`xlsx`) for everything exceljs can't read: legacy BIFF .xls
 *     (OLE2 binary), .xlsb (OOXML *binary* — a zip, but with binary parts),
 *     and the HTML / XML-SpreadsheetML files that reporting systems (e.g. the
 *     BST extract) routinely emit under an .xls or .xlsx name. Excel opens all
 *     of these; exceljs opens none of them.
 *
 * Routing (see `readSheetRows`): a file starting with the `PK` zip signature is
 * tried on exceljs first and only falls through to SheetJS if that throws —
 * which is exactly what .xlsb does. Anything that isn't a zip goes straight to
 * SheetJS. So a BST file saved as .xlsm but actually BIFF binary imports with
 * no user action and no rename.
 *
 * On SheetJS security: the abandoned npm build (`xlsx@0.18.5`) carries two
 * high-severity advisories — GHSA-4r6h-8v6p-xvw6 (prototype pollution, fixed in
 * 0.19.3) and GHSA-5pgg-2g8v-p4x9 (ReDoS, fixed in 0.20.2). SheetJS publishes
 * fixes only from its own CDN, not npm, so we pin the patched tarball
 * (`https://cdn.sheetjs.com/xlsx-0.20.3/...`) in package.json rather than an
 * npm semver range. Bump that URL by hand to upgrade.
 *
 * The output shape mirrors what SheetJS produced for
 * `sheet_to_json(sheet, { header: 1, defval: '', blankrows: false })`:
 *   - one array per row, padded to a uniform column count,
 *   - empty cells as `''` (never `null`/`undefined`),
 *   - fully-blank rows dropped,
 *   - formulas as their cached result, dates as `Date`.
 * Both readers converge on this contract so downstream parsing never has to
 * know which one produced the rows.
 */

import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';

/**
 * Extensions we advertise as importable. All four are readable now — the OOXML
 * pair via exceljs, the legacy/binary pair via SheetJS — so this is just the
 * set we surface in file dialogs and support checks.
 */
export const READABLE_WORKBOOK_EXTENSIONS = ['xlsx', 'xlsm', 'xls', 'xlsb'] as const;

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
 * True when `fileName`'s extension is one we can import. Used to populate file
 * dialogs and support checks — not for routing, which is content-based.
 */
export function isReadableWorkbookFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return (READABLE_WORKBOOK_EXTENSIONS as readonly string[]).includes(ext);
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
 * Coerce whatever the caller has into a single Node Buffer, so both readers and
 * the signature sniff below see the same thing. A Uint8Array view is copied at
 * its own offset/length rather than exposing the whole backing buffer.
 */
function toNodeBuffer(source: Buffer | ArrayBuffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(source)) return source;
  if (source instanceof Uint8Array) {
    return Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  }
  return Buffer.from(new Uint8Array(source));
}

/** True when the bytes start with the `PK` local-file-header of a zip. */
function looksLikeZip(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

/**
 * Pick which worksheet to read, shared by both readers so they resolve names
 * identically.
 *
 * The `sheetNames.length === 1` fallback matters for the formats SheetJS reads:
 * Microsoft "Web Page" HTML and XML-SpreadsheetML exports (which reporting
 * tools like the BST extract emit under an .xls/.xlsm name) keep the real tab
 * name in an `<x:Name>` island that the HTML reader drops, so a workbook that
 * shows a `GL` tab in Excel parses here as a lone generic `Sheet1`. When there
 * is only one sheet to choose from, the requested name is unambiguous — use it
 * rather than failing on a name the file format simply didn't carry through.
 * With two or more sheets the name is load-bearing, so a miss still throws.
 */
function resolveSheetName(sheetNames: string[], requested?: string): string {
  if (sheetNames.length === 0) {
    throw new Error('The file contains no worksheets.');
  }
  if (!requested) return sheetNames[0];

  const match = sheetNames.find(
    (name) => name.trim().toLowerCase() === requested.trim().toLowerCase()
  );
  if (match) return match;

  if (sheetNames.length === 1) return sheetNames[0];

  throw new Error(
    `Sheet '${requested}' not found. Available sheets: ${sheetNames.join(', ')}`
  );
}

/**
 * Read one worksheet into a padded array-of-arrays.
 *
 * `source` is the raw workbook bytes — a Buffer in the main process, or an
 * ArrayBuffer forwarded from the renderer over IPC. The format is detected from
 * the bytes, not the file name: genuine OOXML zips go to exceljs; a zip exceljs
 * chokes on (i.e. .xlsb) and every non-zip format (.xls BIFF, HTML, XML) go to
 * SheetJS.
 */
export async function readSheetRows(
  source: Buffer | ArrayBuffer | Uint8Array,
  options: ReadSheetRowsOptions = {}
): Promise<SheetRowsResult> {
  const buffer = toNodeBuffer(source);

  if (looksLikeZip(buffer)) {
    try {
      return await readViaExcelJs(buffer, options);
    } catch {
      // A zip exceljs can't open is almost always .xlsb (OOXML binary): a real
      // zip container, but the sheets are binary parts exceljs never learned to
      // read. SheetJS does. Fall through rather than surface the zip-parse error.
      return readViaSheetJs(buffer, options);
    }
  }

  // Not a zip at all: legacy BIFF .xls, or HTML / XML-SpreadsheetML wearing a
  // spreadsheet extension. exceljs would throw the opaque jszip error here.
  return readViaSheetJs(buffer, options);
}

/** OOXML path (.xlsx / .xlsm). */
async function readViaExcelJs(
  buffer: Buffer,
  options: ReadSheetRowsOptions
): Promise<SheetRowsResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheetNames = workbook.worksheets.map((sheet) => sheet.name);
  const resolvedName = resolveSheetName(sheetNames, options.sheetName);
  const worksheet = workbook.worksheets.find((sheet) => sheet.name === resolvedName)!;

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

/** Legacy / binary / markup path (.xls, .xlsb, HTML, XML-SpreadsheetML). */
function readViaSheetJs(
  buffer: Buffer,
  options: ReadSheetRowsOptions
): SheetRowsResult {
  // `cellDates` so date cells arrive as `Date`, matching the exceljs path and
  // the documented output contract instead of raw Excel serial numbers.
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  const sheetNames = workbook.SheetNames;
  const sheetName = resolveSheetName(sheetNames, options.sheetName);

  // The exact call the old inline readers used: header:1 -> array-of-arrays,
  // defval:'' -> empty cells as '', blankrows:false -> drop fully-blank rows.
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
    blankrows: false,
    raw: true,
  });

  // sheet_to_json only pads each row to its own last populated cell, so ragged
  // rows come back at different lengths. Pad to the widest to honour the
  // uniform-width half of the contract exceljs's `columnCount` gives for free.
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  for (const row of rows) {
    while (row.length < width) row.push('');
  }

  return { sheetName, sheetNames, rows };
}
