/**
 * Protea Shared Module
 * ====================
 * Constants, styling, configs, and utility functions shared between
 * ProteaReportPackService and ProteaBudgetPackService.
 * Single source of truth — changes here affect both reports.
 */

import ExcelJS from 'exceljs';
import { PLRow } from '../../types/plReportTypes';
import * as db from '../../local_db';

// ============================================================================
// KPI ROW CONFIGS — used to compute KPIs via the F90 calculation engine
// instead of from raw department detail data (which can miss stats/categories)
// ============================================================================

export const ROOMS_KPI_CONFIG: PLRow[] = [
  { type: 'measure', label: 'Rooms Available', measureId: 'total_rooms', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sold Rooms', measureId: 'sold_rooms', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Rooms Revenue', measureId: 'rooms_reservations_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Occupancy %', measureId: 'occupancy_rooms', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'ADR', measureId: 'adr', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'RevPAR', measureId: 'rev_par', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Rooms Dept Profit %', measureId: 'rooms_dept_profit_pct', formatting: 'percentage', indentLevel: 1 },
];

export const FB_KPI_CONFIG: PLRow[] = [
  { type: 'measure', label: '% Food COS', measureId: 'food_cost_pct_sales', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: '% Beverage COS', measureId: 'bev_cost_pct_sales', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'F&B Dept Profit %', measureId: 'fb_dept_profit_pct', formatting: 'percentage', indentLevel: 1 },
];

// ============================================================================
// CONSTANTS
// ============================================================================

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// STYLING CONSTANTS
// ============================================================================

// Tab color scheme for worksheet tabs
export const TAB_COLOR_REPORT: Partial<ExcelJS.Color> = { argb: 'FF1E3A5F' };    // Dark blue - F90, Room Segments
export const TAB_COLOR_GROUP_SUMMARY: Partial<ExcelJS.Color> = { argb: 'FF2D5F8A' }; // Medium navy - Group summaries
export const TAB_COLOR_DEPARTMENT: Partial<ExcelJS.Color> = { argb: 'FF8899AA' };   // Blue-gray - Individual departments

export const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' }  // Dark blue
};

export const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },  // White
  size: 11
};

export const SECTION_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4A4A4A' }  // Dark charcoal gray
};

export const SECTION_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  color: { argb: 'FFFFFFFF' }  // White
};

export const CATEGORY_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF0F4F8' }  // Very light blue-gray
};

export const CATEGORY_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10
};

export const SEPARATOR_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF8899AA' }  // Blue-gray separator
};

export const SUBTOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDCE6F0' }  // Light blue for subtotals
};

// level_12 group header - slightly indented, subtle background
export const GROUP_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF5F7FA' }  // Very subtle blue-gray, lighter than category
};

export const GROUP_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10,
  color: { argb: 'FF4A5568' }  // Dark gray
};

// level_12 group subtotal - subtle distinction from category subtotal
export const GROUP_SUBTOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFEDF2F7' }  // Light blue-gray
};

export const GROUP_SUBTOTAL_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10
};

// Category total header - medium navy with white text, strong visual separator
export const CATEGORY_TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2D5F8A' }  // Medium navy
};

export const CATEGORY_TOTAL_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10,
  color: { argb: 'FFFFFFFF' }  // White
};

export const CATEGORY_TOTAL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF1E3A5F' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
};

export const GROUP_SUBTOTAL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF1E3A5F' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
};

export const DATA_FONT: Partial<ExcelJS.Font> = {
  size: 10
};

export const TOTAL_ROW_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
};

export const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
};

// ============================================================================
// STYLING FUNCTIONS
// ============================================================================

export function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 24;
}

export function applySectionHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = SECTION_HEADER_FILL;
    cell.font = SECTION_HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 28;
}

export function applyCategoryHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = CATEGORY_HEADER_FILL;
    cell.font = CATEGORY_HEADER_FONT;
    cell.border = BORDER_STYLE;
  });
  row.height = 20;
}

export function applyDataRowStyle(row: ExcelJS.Row, isHeader: boolean = false): void {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = isHeader ? { ...DATA_FONT, bold: true } : DATA_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle', horizontal: colNumber > 1 ? 'right' : undefined };
  });
}

export function applyGroupHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = GROUP_HEADER_FILL;
    cell.font = GROUP_HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 18;
}

export function applyGroupSubtotalStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.fill = GROUP_SUBTOTAL_FILL;
    cell.font = GROUP_SUBTOTAL_FONT;
    cell.border = GROUP_SUBTOTAL_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: colNumber > 1 ? 'right' : undefined };
  });
  row.height = 18;
}

export function applyCategorySubtotalStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.fill = CATEGORY_TOTAL_FILL;
    cell.font = CATEGORY_TOTAL_FONT;
    cell.border = CATEGORY_TOTAL_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: colNumber > 1 ? 'right' : undefined };
  });
  row.height = 22;
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export function formatNumber(value: number | null, decimals: number = 0): number | string {
  if (value === null || value === undefined) return '';
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return '';
  // Values from the engine are already in 0-100 scale (e.g. 72.5 for 72.5%)
  return `${value.toFixed(1)}%`;
}

export function sanitizeSheetName(name: string): string {
  // Excel sheet names: max 31 chars, no special chars: \ / * ? : [ ]
  // department_description_detail_level_max already contains dept name + ID
  const sanitized = name.replace(/[\\/*?:\[\]]/g, '').trim();
  return sanitized.substring(0, 31) || 'Sheet';
}

export function getRangeLabel(
  startMonth: number,
  startYear: number,
  endMonth: number,
  endYear: number
): string {
  // Single month: start and end are identical
  if (startMonth === endMonth && startYear === endYear) {
    return `Period: ${MONTH_NAMES[startMonth - 1]} ${startYear}`;
  }

  // Jan through Dec of the same year = full year
  if (startMonth === 1 && endMonth === 12 && startYear === endYear) {
    return `Full Year: ${startYear}`;
  }

  // Jan through some month of the same year = year to date
  if (startMonth === 1 && startYear === endYear) {
    return `Year to Date: ${MONTH_NAMES[startMonth - 1]} ${startYear} - ${MONTH_NAMES[endMonth - 1]} ${endYear}`;
  }

  // Everything else is a custom range
  return `Custom Range: ${MONTH_NAMES[startMonth - 1]} ${startYear} - ${MONTH_NAMES[endMonth - 1]} ${endYear}`;
}

// ============================================================================
// DUPLICATE ACCOUNT AGGREGATION
// ============================================================================

/** Aggregate rows that share the same account code by summing their numeric fields.
 *  Keeps the first row's metadata (accountName, category, level12Group, level13Group).
 *  Needed after merging data from moved departments, which may share accounts with
 *  the target group's native departments. */
export function aggregateDuplicateAccounts(rows: any[]): any[] {
  const map = new Map<string, any>();
  for (const row of rows) {
    const existing = map.get(row.account);
    if (existing) {
      existing.actuals = (existing.actuals || 0) + (row.actuals || 0);
      existing.budget = (existing.budget || 0) + (row.budget || 0);
      existing.ly = (existing.ly || 0) + (row.ly || 0);
      existing.vsBud = (existing.vsBud || 0) + (row.vsBud || 0);
      existing.vsLy = (existing.vsLy || 0) + (row.vsLy || 0);
    } else {
      map.set(row.account, { ...row });
    }
  }
  return Array.from(map.values());
}

// ============================================================================
// LABEL RENAME
// ============================================================================

/**
 * Replace "Miscellaneous"/"Misc" with "Sundry" for Protea display labels.
 * Applied at render level only — underlying data is unchanged.
 */
export function proteaRenameLabel(label: string): string {
  return label
    .replace(/\bMiscellaneous\b/gi, 'Sundry')
    .replace(/\bMisc\b/gi, 'Sundry');
}

// ============================================================================
// EXCLUDED DEPARTMENTS
// ============================================================================

export const EXCEL_EXCLUDED_DEPARTMENTS = db.NON_OPERATING_EXCLUDED_DEPARTMENTS;

// ============================================================================
// PROTEA ACCOUNT MOVEMENT CONFIG
// Insurance (A730xxx), audit (A745xxx), and A701603 accounts on D0480/D0490/D0690
// are reported as if they belong to D0410 (Admin & General).  This is a
// report-level-only adjustment — the underlying data is unchanged.
// ============================================================================
export const PROTEA_MOVED_ACCOUNT_PREFIXES = ['A730', 'A745'];
export const PROTEA_MOVED_ACCOUNT_BASES = ['A701603'];
export const PROTEA_MOVEMENT_SOURCE_DEPTS = ['D0480', 'D0490', 'D0690'];
export const isMovedAccount = (acct: string) =>
  PROTEA_MOVED_ACCOUNT_PREFIXES.some(p => acct.startsWith(p)) ||
  PROTEA_MOVED_ACCOUNT_BASES.includes(acct);

// ============================================================================
// PROTEA DEPARTMENT-LEVEL MOVEMENT CONFIG
// Certain departments report under a different group in the Protea extract.
// Report-level only — underlying data is unchanged.  The F90 is unaffected.
// ============================================================================
export interface DepartmentMovement {
  sourceDept: string;        // Department to move from its native level_7 group
  targetGroup: string;       // level_7 group name it merges into
  detailMergeTarget: string; // Department whose detail tab receives the merged data
}

export const PROTEA_DEPARTMENT_MOVEMENTS: DepartmentMovement[] = [
  { sourceDept: 'D0400', targetGroup: 'Administrative & General', detailMergeTarget: 'D0410' },
  { sourceDept: 'D0480', targetGroup: 'Invest Factor Owner',     detailMergeTarget: 'D0490' },
  { sourceDept: 'D0690', targetGroup: 'Invest Factor Owner',     detailMergeTarget: 'D0490' },
];

// Banqueting departments — split out of F&B when banqueting toggle is on
export const BANQUETING_DEPARTMENTS = new Set(['D0230', 'D0231', 'D0232']);

/** Preferred display order for department groups in the Protea report pack.
 *  Groups not listed here appear after these in their natural (alphabetical) order.
 *  'Total Banqueting' only appears when the banqueting toggle is enabled. */
export const PROTEA_GROUP_DISPLAY_ORDER: string[] = [
  'Rooms and Reservation',
  'Total Food & Beverage',
  'Total Banqueting',
  'Other Operated Departments',
  'Administrative & General',
];

// Derived lookups for fast access
export const MOVED_DEPT_SET = new Set(PROTEA_DEPARTMENT_MOVEMENTS.map(m => m.sourceDept));
export const MOVED_DEPT_BY_SOURCE = new Map(PROTEA_DEPARTMENT_MOVEMENTS.map(m => [m.sourceDept, m]));
export const MOVEMENT_TARGET_GROUPS = new Set(PROTEA_DEPARTMENT_MOVEMENTS.map(m => m.targetGroup));
