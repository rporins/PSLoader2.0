/**
 * Excel Export Service
 * ====================
 * Generates formatted Excel reports using ExcelJS.
 * Runs in the Electron main process.
 */

import ExcelJS from 'exceljs';
import * as db from '../local_db';
import { PLCalculationResult } from '../types/plReportTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface ExcelExportConfig {
  ou: string;
  hotelName: string;
  selectedMonth: number;
  selectedYear: number;
  ytdStartMonth: number;
  ytdStartYear: number;
  ytdEndMonth: number;
  ytdEndYear: number;
  version: string;  // 'MAIN' or 'OWNR'
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// STYLING HELPERS
// ============================================================================

// Tab color scheme for worksheet tabs
const TAB_COLOR_REPORT: Partial<ExcelJS.Color> = { argb: 'FF1E3A5F' };    // Dark blue - F90, Room Segments
const TAB_COLOR_HOTEL_TOTAL: Partial<ExcelJS.Color> = { argb: 'FF4A4A4A' }; // Dark charcoal - Hotel Total
const TAB_COLOR_GROUP_SUMMARY: Partial<ExcelJS.Color> = { argb: 'FF2D5F8A' }; // Medium navy - Group summaries
const TAB_COLOR_DEPARTMENT: Partial<ExcelJS.Color> = { argb: 'FF8899AA' };   // Blue-gray - Individual departments

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' }  // Dark blue
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },  // White
  size: 11
};

const SECTION_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4A4A4A' }  // Dark charcoal gray
};

const SECTION_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  color: { argb: 'FFFFFFFF' }  // White
};

const CATEGORY_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF0F4F8' }  // Very light blue-gray
};

const CATEGORY_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10
};

const SEPARATOR_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF8899AA' }  // Blue-gray separator
};

const SUBTOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDCE6F0' }  // Light blue for subtotals
};

// level_12 group header - slightly indented, subtle background
const GROUP_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF5F7FA' }  // Very subtle blue-gray, lighter than category
};

const GROUP_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10,
  color: { argb: 'FF4A5568' }  // Dark gray
};

// level_12 group subtotal - subtle distinction from category subtotal
const GROUP_SUBTOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFEDF2F7' }  // Light blue-gray
};

const GROUP_SUBTOTAL_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10
};

// Category total header - medium navy with white text, strong visual separator
const CATEGORY_TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2D5F8A' }  // Medium navy
};

const CATEGORY_TOTAL_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 10,
  color: { argb: 'FFFFFFFF' }  // White
};

const CATEGORY_TOTAL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'medium', color: { argb: 'FF1E3A5F' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FF1E3A5F' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
};

const DATA_FONT: Partial<ExcelJS.Font> = {
  size: 10
};

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
};

function applyHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 24;
}

function applySectionHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = SECTION_HEADER_FILL;
    cell.font = SECTION_HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 28;
}

function applyCategoryHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = CATEGORY_HEADER_FILL;
    cell.font = CATEGORY_HEADER_FONT;
    cell.border = BORDER_STYLE;
  });
  row.height = 20;
}

function applyDataRowStyle(row: ExcelJS.Row, isHeader: boolean = false): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = isHeader ? { ...DATA_FONT, bold: true } : DATA_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
}

function applyGroupHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = GROUP_HEADER_FILL;
    cell.font = GROUP_HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 18;
}

function applyGroupSubtotalStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = GROUP_SUBTOTAL_FILL;
    cell.font = GROUP_SUBTOTAL_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 18;
}

function applyCategorySubtotalStyle(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = CATEGORY_TOTAL_FILL;
    cell.font = CATEGORY_TOTAL_FONT;
    cell.border = CATEGORY_TOTAL_BORDER;
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 22;
}

function formatNumber(value: number | null, decimals: number = 0): number | string {
  if (value === null || value === undefined) return '';
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return '';
  // Values from the engine are already in 0-100 scale (e.g. 72.5 for 72.5%)
  return `${value.toFixed(1)}%`;
}

function sanitizeSheetName(name: string): string {
  // Excel sheet names: max 31 chars, no special chars: \ / * ? : [ ]
  // department_description_detail_level_max already contains dept name + ID
  const sanitized = name.replace(/[\\/*?:\[\]]/g, '').trim();
  return sanitized.substring(0, 31) || 'Sheet';
}

function getRangeLabel(
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
// EXCEL EXPORT SERVICE CLASS
// ============================================================================

// Departments excluded from Excel export (non-operating depts with no reportable data)
const EXCEL_EXCLUDED_DEPARTMENTS = new Set(['D1468', 'D3095', 'D0376']);

class ExcelExportService {
  private accpacDescriptions: Map<string, string[]> = new Map();

  /** Registry of sheets and group headers for the cover page TOC */
  private sheetRegistry: Array<{
    type: 'sheet' | 'groupHeader';
    sheetName: string;
    groupName?: string;
    indent: boolean;
  }> = [];

  /**
   * Main entry point - generates the complete Excel report
   * Sheet order: Contents -> F90 Report -> Room Segments -> Hotel Total -> Department tabs
   */
  async generateReport(config: ExcelExportConfig, savePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'PS Loader';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Auto-clean staging if its period has already been imported into financial_data
    await db.autoCleanStagingIfImported();

    // Reset sheet registry for this report
    this.sheetRegistry = [];

    // Build AccPac description lookup once (used by Hotel Total and all department sheets)
    this.accpacDescriptions.clear();
    const mappings = await db.getMappings(10);
    for (const m of mappings) {
      if (m.target_account && m.source_department && m.is_active) {
        const existing = this.accpacDescriptions.get(m.target_account);
        if (!existing) {
          this.accpacDescriptions.set(m.target_account, [m.source_department]);
        } else if (!existing.includes(m.source_department)) {
          existing.push(m.source_department);
        }
      }
    }

    // 1. Create F90 Report worksheet
    await this.createF90Worksheet(workbook, config);
    this.sheetRegistry.push({ type: 'sheet', sheetName: 'F90 Report', indent: false });

    // 2. Create Room Segments worksheet
    await this.createRoomSegmentWorksheet(workbook, config);
    this.sheetRegistry.push({ type: 'sheet', sheetName: 'Room Segments', indent: false });

    // 3. Fetch departments once -- used by department tabs
    const departments = (await db.getDepartmentsWithDataForOU(config.ou, config.version))
      .filter(d => !EXCEL_EXCLUDED_DEPARTMENTS.has(d.baseDepartment));

    // 4. Create Hotel Total worksheet (queries all Lodging Operations departments directly)
    await this.createHotelTotalWorksheet(workbook, config);
    this.sheetRegistry.push({ type: 'sheet', sheetName: 'HOTEL TOTAL', indent: false });

    // 5. Create Department worksheets (using pre-fetched departments)
    await this.createDepartmentWorksheets(workbook, config, departments);

    // 6. Create Cover Page (last to build, positioned first via orderNo)
    this.createCoverPageWorksheet(workbook, config);

    // Save the workbook
    await workbook.xlsx.writeFile(savePath);
  }

  /**
   * Creates the F90 P&L Report worksheet
   */
  private async createF90Worksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig
  ): Promise<void> {
    const sheet = workbook.addWorksheet('F90 Report', { properties: { tabColor: TAB_COLOR_REPORT } });

    // Set column widths
    sheet.columns = [
      { header: 'P&L Line', key: 'label', width: 45 },
      { header: 'Actuals', key: 'actuals', width: 14 },
      { header: 'Budget', key: 'budget', width: 14 },
      { header: 'vs Bud', key: 'vs_bud', width: 14 },
      { header: 'vs Bud %', key: 'vs_bud_pct', width: 12 },
      { header: 'LY', key: 'ly', width: 14 },
      { header: 'vs LY', key: 'vs_ly', width: 14 },
      { header: 'vs LY %', key: 'vs_ly_pct', width: 12 },
      { header: 'Comments', key: 'comments', width: 35 },
    ];

    // Style header row
    applyHeaderStyle(sheet.getRow(1));

    // Fetch Selected Month data
    const monthDataJson = await db.getF90PLData(
      config.selectedMonth,
      config.selectedYear,
      config.selectedMonth,
      config.selectedYear,
      config.ou,
      config.version
    );
    const monthData: PLCalculationResult[] = JSON.parse(monthDataJson);

    // Fetch YTD data
    const ytdDataJson = await db.getF90PLData(
      config.ytdStartMonth,
      config.ytdStartYear,
      config.ytdEndMonth,
      config.ytdEndYear,
      config.ou,
      config.version
    );
    const ytdData: PLCalculationResult[] = JSON.parse(ytdDataJson);

    // Add Selected Month section header
    const monthHeader = sheet.addRow([
      `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`,
      '', '', '', '', '', '', '', ''
    ]);
    applySectionHeaderStyle(monthHeader);
    sheet.mergeCells(monthHeader.number, 1, monthHeader.number, 9);

    // Add month data rows
    this.addF90DataRows(sheet, monthData);

    // Add blank row
    this.addBlankSeparatorRow(sheet, 9, 'f90');

    // Add range section header
    const ytdHeaderText = getRangeLabel(
      config.ytdStartMonth, config.ytdStartYear,
      config.ytdEndMonth, config.ytdEndYear
    );

    const ytdHeader = sheet.addRow([ytdHeaderText, '', '', '', '', '', '', '', '']);
    applySectionHeaderStyle(ytdHeader);
    sheet.mergeCells(ytdHeader.number, 1, ytdHeader.number, 9);

    // Add YTD data rows
    this.addF90DataRows(sheet, ytdData);

    // Freeze panes (header row)
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Helper to add F90 data rows with proper formatting
   */
  private addF90DataRows(sheet: ExcelJS.Worksheet, data: PLCalculationResult[]): void {
    for (const row of data) {
      // Skip empty spacing rows
      if (row.type === 'header' && !row.label) continue;

      const indent = '  '.repeat(row.indentLevel || 0);
      const isPercentage = row.formatting === 'percentage';

      const excelRow = sheet.addRow({
        label: indent + row.label,
        actuals: isPercentage ? formatPercentage(row.actuals) : formatNumber(row.actuals),
        budget: isPercentage ? formatPercentage(row.budget) : formatNumber(row.budget),
        vs_bud: isPercentage ? formatPercentage(row.vs_bud) : formatNumber(row.vs_bud),
        vs_bud_pct: formatPercentage(row.vs_bud_pct),
        ly: isPercentage ? formatPercentage(row.ly) : formatNumber(row.ly),
        vs_ly: isPercentage ? formatPercentage(row.vs_ly) : formatNumber(row.vs_ly),
        vs_ly_pct: formatPercentage(row.vs_ly_pct),
        comments: ''
      });

      applyDataRowStyle(excelRow, row.type === 'header');

      // Apply number formatting
      if (!isPercentage) {
        [2, 3, 4, 6, 7].forEach(col => {
          const cell = excelRow.getCell(col);
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        });
      }

    }
  }

  /**
   * Creates the Hotel Total worksheet aggregating all lodging operations departments.
   * Appears before individual department sheets as a hotel-wide summary.
   */
  private async createHotelTotalWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig
  ): Promise<void> {
    // Fetch hotel-wide totals across all Lodging Operations departments (excluding non-reportable depts)
    const excludedDepts = [...EXCEL_EXCLUDED_DEPARTMENTS];
    const [monthDetailData, rangeDetailData] = await Promise.all([
      db.getAllDepartmentDetailData(
        config.ou,
        config.selectedMonth, config.selectedYear,
        config.selectedMonth, config.selectedYear,
        config.version,
        excludedDepts
      ),
      db.getAllDepartmentDetailData(
        config.ou,
        config.ytdStartMonth, config.ytdStartYear,
        config.ytdEndMonth, config.ytdEndYear,
        config.version,
        excludedDepts
      )
    ]);

    if (rangeDetailData.length === 0 && monthDetailData.length === 0) return;

    // Use rooms sold as per-unit denominator (hotel-level metric)
    const [monthDenom, rangeDenom] = await Promise.all([
      db.getRoomsSoldForPeriod(
        config.ou, config.selectedMonth, config.selectedYear,
        config.selectedMonth, config.selectedYear, config.version
      ),
      db.getRoomsSoldForPeriod(
        config.ou, config.ytdStartMonth, config.ytdStartYear,
        config.ytdEndMonth, config.ytdEndYear, config.version
      )
    ]);

    const sheet = workbook.addWorksheet('HOTEL TOTAL', { properties: { tabColor: TAB_COLOR_HOTEL_TOTAL } });
    const totalCols = 13;

    sheet.columns = [
      { key: 'account', width: 45 },
      { key: 'actuals', width: 14 },
      { key: 'budget', width: 14 },
      { key: 'vsBud', width: 14 },
      { key: 'ly', width: 14 },
      { key: 'vsLy', width: 14 },
      { key: 'sep', width: 2 },
      { key: 'puAct', width: 14 },
      { key: 'puBud', width: 14 },
      { key: 'puVsBud', width: 14 },
      { key: 'puLy', width: 14 },
      { key: 'puVsLy', width: 14 },
      { key: 'comments', width: 35 },
    ];

    // Row 1: Section group headers
    const groupRow = sheet.addRow(new Array(totalCols).fill(''));
    groupRow.getCell(2).value = 'Amounts';
    groupRow.getCell(8).value = 'Per Room';
    sheet.mergeCells(1, 2, 1, 6);
    sheet.mergeCells(1, 8, 1, 12);
    applyHeaderStyle(groupRow);
    this.styleDeptSeparator(groupRow);

    // Row 2: Column sub-headers
    const headerRow = sheet.addRow([
      'Account',
      'Actuals', 'Budget', 'vs Bud', 'LY', 'vs LY',
      '',
      'Actuals', 'Budget', 'vs Bud', 'LY', 'vs LY',
      'Comments'
    ]);
    applyHeaderStyle(headerRow);
    this.styleDeptSeparator(headerRow);

    // --- Selected Month Section ---
    const monthSectionHeader = sheet.addRow(new Array(totalCols).fill(''));
    monthSectionHeader.getCell(1).value = `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`;
    applySectionHeaderStyle(monthSectionHeader);
    sheet.mergeCells(monthSectionHeader.number, 1, monthSectionHeader.number, totalCols);

    this.addDepartmentDataSection(sheet, monthDetailData, monthDenom, totalCols);

    this.addBlankSeparatorRow(sheet, totalCols);

    // --- Range Section ---
    const rangeSectionHeader = sheet.addRow(new Array(totalCols).fill(''));
    rangeSectionHeader.getCell(1).value = getRangeLabel(config.ytdStartMonth, config.ytdStartYear, config.ytdEndMonth, config.ytdEndYear);
    applySectionHeaderStyle(rangeSectionHeader);
    sheet.mergeCells(rangeSectionHeader.number, 1, rangeSectionHeader.number, totalCols);

    this.addDepartmentDataSection(sheet, rangeDetailData, rangeDenom, totalCols);

    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];
  }

  /**
   * Creates department worksheets grouped by level_7.
   * Multi-department groups get a summary sheet followed by individual detail sheets.
   * Single-department groups get only their detail sheet.
   */
  private async createDepartmentWorksheets(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig,
    departments: Array<{ baseDepartment: string; departmentName: string; level7Group: string | null }>
  ): Promise<void> {
    // Group departments by level_7
    const groupMap = new Map<string, typeof departments>();
    for (const dept of departments) {
      const groupKey = dept.level7Group || dept.baseDepartment;
      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(dept);
    }

    // Fetch rooms sold once (used as denominator for all non-F&B departments)
    const [monthRoomsSold, rangeRoomsSold] = await Promise.all([
      db.getRoomsSoldForPeriod(
        config.ou, config.selectedMonth, config.selectedYear,
        config.selectedMonth, config.selectedYear, config.version
      ),
      db.getRoomsSoldForPeriod(
        config.ou, config.ytdStartMonth, config.ytdStartYear,
        config.ytdEndMonth, config.ytdEndYear, config.version
      )
    ]);

    // Track used sheet names to avoid duplicates
    const usedSheetNames = new Set<string>();

    // Iterate groups: summary sheet first (if multi-dept), then individual sheets
    for (const [groupName, groupDepts] of groupMap) {
      const isMultiDeptGroup = groupDepts.length > 1;
      const isFnB = groupName === 'Total Food & Beverage';
      const perUnitLabel = isFnB ? 'Per Cover' : 'Per Room';

      // Register group header in TOC for every group (including singletons)
      this.sheetRegistry.push({ type: 'groupHeader', sheetName: '', groupName, indent: false });

      // Determine per-unit denominators
      let monthDenom: db.PerUnitDenominator;
      let rangeDenom: db.PerUnitDenominator;

      if (isFnB) {
        // F&B group: fetch department volume (covers) for all departments in the group
        const allFnBDeptIds = groupDepts.map(d => d.baseDepartment);
        [monthDenom, rangeDenom] = await Promise.all([
          db.getDepartmentVolumeForPeriod(
            config.ou, allFnBDeptIds,
            config.selectedMonth, config.selectedYear,
            config.selectedMonth, config.selectedYear, config.version
          ),
          db.getDepartmentVolumeForPeriod(
            config.ou, allFnBDeptIds,
            config.ytdStartMonth, config.ytdStartYear,
            config.ytdEndMonth, config.ytdEndYear, config.version
          )
        ]);
      } else {
        monthDenom = monthRoomsSold;
        rangeDenom = rangeRoomsSold;
      }

      if (isMultiDeptGroup) {
        // Create group summary sheet for multi-department groups
        const summaryName = await this.createGroupSummaryWorksheet(
          workbook, config, groupName, groupDepts, usedSheetNames,
          perUnitLabel, monthDenom, rangeDenom
        );
        if (summaryName) {
          this.sheetRegistry.push({ type: 'sheet', sheetName: summaryName, indent: true });
        }

        // Create individual department detail sheets
        for (const dept of groupDepts) {
          // For individual F&B departments, use that department's own volume
          // Kitchen departments (D019*) don't generate covers — use total F&B volume instead
          let deptMonthDenom = monthDenom;
          let deptRangeDenom = rangeDenom;

          if (isFnB && !dept.baseDepartment.startsWith('D019')) {
            [deptMonthDenom, deptRangeDenom] = await Promise.all([
              db.getDepartmentVolumeForPeriod(
                config.ou, [dept.baseDepartment],
                config.selectedMonth, config.selectedYear,
                config.selectedMonth, config.selectedYear, config.version
              ),
              db.getDepartmentVolumeForPeriod(
                config.ou, [dept.baseDepartment],
                config.ytdStartMonth, config.ytdStartYear,
                config.ytdEndMonth, config.ytdEndYear, config.version
              )
            ]);
          }

          const deptSheetName = await this.createSingleDepartmentWorksheet(
            workbook, config, dept, usedSheetNames,
            perUnitLabel, deptMonthDenom, deptRangeDenom
          );
          if (deptSheetName) {
            this.sheetRegistry.push({ type: 'sheet', sheetName: deptSheetName, indent: true });
          }
        }
      } else {
        // Singleton group: create both summary + individual sheet for consistent pattern
        const dept = groupDepts[0];

        // Group summary sheet (uses same data as the single dept)
        const summaryName = await this.createGroupSummaryWorksheet(
          workbook, config, groupName, groupDepts, usedSheetNames,
          perUnitLabel, monthDenom, rangeDenom
        );
        if (summaryName) {
          this.sheetRegistry.push({ type: 'sheet', sheetName: summaryName, indent: true });
        }

        // Individual department detail sheet
        let deptMonthDenom = monthDenom;
        let deptRangeDenom = rangeDenom;

        if (isFnB && !dept.baseDepartment.startsWith('D019')) {
          [deptMonthDenom, deptRangeDenom] = await Promise.all([
            db.getDepartmentVolumeForPeriod(
              config.ou, [dept.baseDepartment],
              config.selectedMonth, config.selectedYear,
              config.selectedMonth, config.selectedYear, config.version
            ),
            db.getDepartmentVolumeForPeriod(
              config.ou, [dept.baseDepartment],
              config.ytdStartMonth, config.ytdStartYear,
              config.ytdEndMonth, config.ytdEndYear, config.version
            )
          ]);
        }

        const deptSheetName = await this.createSingleDepartmentWorksheet(
          workbook, config, dept, usedSheetNames,
          perUnitLabel, deptMonthDenom, deptRangeDenom
        );
        if (deptSheetName) {
          this.sheetRegistry.push({ type: 'sheet', sheetName: deptSheetName, indent: true });
        }
      }
    }
  }

  /**
   * Creates a summary worksheet that aggregates data across all departments in a group
   */
  private async createGroupSummaryWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig,
    groupName: string,
    groupDepts: Array<{ baseDepartment: string; departmentName: string; level7Group: string | null }>,
    usedSheetNames: Set<string>,
    perUnitLabel: string,
    monthDenom: db.PerUnitDenominator,
    rangeDenom: db.PerUnitDenominator
  ): Promise<string | null> {
    const deptIds = groupDepts.map(d => d.baseDepartment);

    // Fetch aggregated data for the group
    const monthDetailData = await db.getGroupDepartmentDetailData(
      config.ou,
      deptIds,
      config.selectedMonth,
      config.selectedYear,
      config.selectedMonth,
      config.selectedYear,
      config.version
    );

    const rangeDetailData = await db.getGroupDepartmentDetailData(
      config.ou,
      deptIds,
      config.ytdStartMonth,
      config.ytdStartYear,
      config.ytdEndMonth,
      config.ytdEndYear,
      config.version
    );

    if (rangeDetailData.length === 0 && monthDetailData.length === 0) {
      return null;
    }

    let sheetName = sanitizeSheetName(`${groupName} Summary`.toUpperCase());
    let finalName = sheetName;
    let counter = 1;
    while (usedSheetNames.has(finalName.toLowerCase())) {
      const suffix = ` (${counter})`;
      finalName = sheetName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(finalName.toLowerCase());

    const sheet = workbook.addWorksheet(finalName, { properties: { tabColor: TAB_COLOR_GROUP_SUMMARY } });
    const totalCols = 13;

    sheet.columns = [
      { key: 'account', width: 45 },
      { key: 'actuals', width: 14 },
      { key: 'budget', width: 14 },
      { key: 'vsBud', width: 14 },
      { key: 'ly', width: 14 },
      { key: 'vsLy', width: 14 },
      { key: 'sep', width: 2 },
      { key: 'puAct', width: 14 },
      { key: 'puBud', width: 14 },
      { key: 'puVsBud', width: 14 },
      { key: 'puLy', width: 14 },
      { key: 'puVsLy', width: 14 },
      { key: 'comments', width: 35 },
    ];

    // Row 1: Section group headers
    const groupRow = sheet.addRow(new Array(totalCols).fill(''));
    groupRow.getCell(2).value = 'Amounts';
    groupRow.getCell(8).value = perUnitLabel;
    sheet.mergeCells(1, 2, 1, 6);
    sheet.mergeCells(1, 8, 1, 12);
    applyHeaderStyle(groupRow);
    this.styleDeptSeparator(groupRow);

    // Row 2: Column sub-headers
    const headerRow = sheet.addRow([
      'Account',
      'Actuals', 'Budget', 'vs Bud', 'LY', 'vs LY',
      '',
      'Actuals', 'Budget', 'vs Bud', 'LY', 'vs LY',
      'Comments'
    ]);
    applyHeaderStyle(headerRow);
    this.styleDeptSeparator(headerRow);

    // --- Selected Month Section ---
    const monthSectionHeader = sheet.addRow(new Array(totalCols).fill(''));
    monthSectionHeader.getCell(1).value = `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`;
    applySectionHeaderStyle(monthSectionHeader);
    sheet.mergeCells(monthSectionHeader.number, 1, monthSectionHeader.number, totalCols);

    this.addDepartmentDataSection(sheet, monthDetailData, monthDenom, totalCols);

    this.addBlankSeparatorRow(sheet, totalCols);

    // --- Range Section ---
    const rangeSectionHeader = sheet.addRow(new Array(totalCols).fill(''));
    rangeSectionHeader.getCell(1).value = getRangeLabel(config.ytdStartMonth, config.ytdStartYear, config.ytdEndMonth, config.ytdEndYear);
    applySectionHeaderStyle(rangeSectionHeader);
    sheet.mergeCells(rangeSectionHeader.number, 1, rangeSectionHeader.number, totalCols);

    this.addDepartmentDataSection(sheet, rangeDetailData, rangeDenom, totalCols);

    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

    return finalName;
  }

  /**
   * Creates a single department detail worksheet with account-level data
   */
  private async createSingleDepartmentWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig,
    dept: { baseDepartment: string; departmentName: string; level7Group: string | null },
    usedSheetNames: Set<string>,
    perUnitLabel: string,
    monthDenom: db.PerUnitDenominator,
    rangeDenom: db.PerUnitDenominator,
    nameOverride?: string
  ): Promise<string | null> {
    const monthDetailData = await db.getDepartmentDetailData(
      config.ou,
      dept.baseDepartment,
      config.selectedMonth,
      config.selectedYear,
      config.selectedMonth,
      config.selectedYear,
      config.version
    );

    const rangeDetailData = await db.getDepartmentDetailData(
      config.ou,
      dept.baseDepartment,
      config.ytdStartMonth,
      config.ytdStartYear,
      config.ytdEndMonth,
      config.ytdEndYear,
      config.version
    );

    if (rangeDetailData.length === 0 && monthDetailData.length === 0) {
      return null;
    }

    let sheetName = sanitizeSheetName(nameOverride || dept.departmentName || dept.baseDepartment);
    let finalName = sheetName;
    let counter = 1;
    while (usedSheetNames.has(finalName.toLowerCase())) {
      const suffix = ` (${counter})`;
      finalName = sheetName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(finalName.toLowerCase());

    const sheet = workbook.addWorksheet(finalName, { properties: { tabColor: TAB_COLOR_DEPARTMENT } });
    const totalCols = 13;

    sheet.columns = [
      { key: 'account', width: 45 },
      { key: 'actuals', width: 14 },
      { key: 'budget', width: 14 },
      { key: 'vsBud', width: 14 },
      { key: 'ly', width: 14 },
      { key: 'vsLy', width: 14 },
      { key: 'sep', width: 2 },
      { key: 'puAct', width: 14 },
      { key: 'puBud', width: 14 },
      { key: 'puVsBud', width: 14 },
      { key: 'puLy', width: 14 },
      { key: 'puVsLy', width: 14 },
      { key: 'comments', width: 35 },
    ];

    // Row 1: Section group headers
    const groupRow = sheet.addRow(new Array(totalCols).fill(''));
    groupRow.getCell(2).value = 'Amounts';
    groupRow.getCell(8).value = perUnitLabel;
    sheet.mergeCells(1, 2, 1, 6);
    sheet.mergeCells(1, 8, 1, 12);
    applyHeaderStyle(groupRow);
    this.styleDeptSeparator(groupRow);

    // Row 2: Column sub-headers
    const headerRow = sheet.addRow([
      'Account',
      'Actuals', 'Budget', 'vs Bud', 'LY', 'vs LY',
      '',
      'Actuals', 'Budget', 'vs Bud', 'LY', 'vs LY',
      'Comments'
    ]);
    applyHeaderStyle(headerRow);
    this.styleDeptSeparator(headerRow);

    // --- Selected Month Section ---
    const monthSectionHeader = sheet.addRow(new Array(totalCols).fill(''));
    monthSectionHeader.getCell(1).value = `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`;
    applySectionHeaderStyle(monthSectionHeader);
    sheet.mergeCells(monthSectionHeader.number, 1, monthSectionHeader.number, totalCols);

    this.addDepartmentDataSection(sheet, monthDetailData, monthDenom, totalCols);

    this.addBlankSeparatorRow(sheet, totalCols);

    // --- Range Section ---
    const rangeSectionHeader = sheet.addRow(new Array(totalCols).fill(''));
    rangeSectionHeader.getCell(1).value = getRangeLabel(config.ytdStartMonth, config.ytdStartYear, config.ytdEndMonth, config.ytdEndYear);
    applySectionHeaderStyle(rangeSectionHeader);
    sheet.mergeCells(rangeSectionHeader.number, 1, rangeSectionHeader.number, totalCols);

    this.addDepartmentDataSection(sheet, rangeDetailData, rangeDenom, totalCols);

    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

    return finalName;
  }

  /**
   * Creates the cover page / table of contents worksheet.
   * Built last (all sheet names are known), repositioned first via orderNo.
   */
  private createCoverPageWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig
  ): void {
    const sheet = workbook.addWorksheet('Contents');

    // Position as the first sheet by setting orderNo to 0
    // (all other sheets have orderNo >= 1 from auto-increment)
    (sheet as any).orderNo = 0;

    sheet.columns = [
      { key: 'label', width: 55 },
    ];

    // --- Header section ---
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = config.hotelName;
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: 'FF1E3A5F' } };
    titleRow.height = 30;

    const reportRow = sheet.getRow(2);
    reportRow.getCell(1).value = 'F90 P&L Report';
    reportRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF4A4A4A' } };

    const periodRow = sheet.getRow(3);
    periodRow.getCell(1).value = `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`;
    periodRow.getCell(1).font = { size: 11, color: { argb: 'FF666666' } };

    const rangeRow = sheet.getRow(4);
    rangeRow.getCell(1).value = getRangeLabel(
      config.ytdStartMonth, config.ytdStartYear,
      config.ytdEndMonth, config.ytdEndYear
    );
    rangeRow.getCell(1).font = { size: 11, color: { argb: 'FF666666' } };

    const versionRow = sheet.getRow(5);
    versionRow.getCell(1).value = `Version: ${config.version}`;
    versionRow.getCell(1).font = { size: 11, color: { argb: 'FF666666' } };

    // Row 7: TOC header (row 6 is blank spacer)
    const tocHeader = sheet.getRow(7);
    tocHeader.getCell(1).value = 'Table of Contents';
    tocHeader.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
    tocHeader.getCell(1).border = { bottom: { style: 'medium', color: { argb: 'FF1E3A5F' } } };

    // --- TOC entries ---
    let currentRow = 9; // start after a blank spacer row

    for (const entry of this.sheetRegistry) {
      const row = sheet.getRow(currentRow);

      if (entry.type === 'groupHeader') {
        // Uppercase bold group name (not a hyperlink)
        row.getCell(1).value = (entry.groupName || '').toUpperCase();
        row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
        row.height = 22;
      } else {
        // Hyperlinked sheet name (indented for department sheets)
        const indent = entry.indent ? '    ' : '';
        const displayText = `${indent}${entry.sheetName}`;
        row.getCell(1).value = {
          text: displayText,
          hyperlink: `#'${entry.sheetName}'!A1`
        } as any;
        row.getCell(1).font = {
          size: 10,
          color: { argb: 'FF0563C1' },
          underline: true
        };
      }
      currentRow++;
    }
  }

  /**
   * Returns a rich text value with the AccPac description in light grey brackets,
   * or a plain string if no AccPac description exists.
   */
  private buildAccountLabel(displayName: string, accountCode: string): string | ExcelJS.CellRichTextValue {
    const descriptions = this.accpacDescriptions.get(accountCode);
    if (descriptions && descriptions.length > 0) {
      return {
        richText: [
          { font: { size: 10 }, text: displayName },
          { font: { size: 10, color: { argb: 'FF999999' } }, text: ` [${descriptions.join(', ')}]` },
        ]
      };
    }
    return displayName;
  }

  /**
   * Adds a blank separator row with consistent formatting (borders, font, separator column).
   * Ensures the grid looks continuous even on empty rows.
   */
  private addBlankSeparatorRow(sheet: ExcelJS.Worksheet, totalCols: number, separatorType: 'dept' | 'roomSeg' | 'f90' = 'dept'): void {
    const blankRow = sheet.addRow(new Array(totalCols).fill(''));
    blankRow.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.font = DATA_FONT;
    });
    if (separatorType === 'dept') {
      this.styleDeptSeparator(blankRow);
    } else if (separatorType === 'roomSeg') {
      this.styleRoomSegSeparators(blankRow);
    }
  }

  /**
   * Helper to add department data rows grouped by category with level_12 sub-grouping.
   * Totals are embedded in the header rows (category and group headers carry the values).
   * Blank rows create visual separation between sub-sections.
   *
   * Layout:
   *   Total Revenue          ACT  BUD  ...   ← category header WITH totals
   *     Total Room Revenue   ACT  BUD  ...   ← level_12 group header WITH totals
   *       Account 1          ACT  BUD  ...   ← detail row
   *       Account 2          ACT  BUD  ...   ← detail row
   *                                          ← blank separator
   *     Total Other Revenue  ACT  BUD  ...   ← next group header
   *       Account 3          ACT  BUD  ...
   *                                          ← blank separator
   *                                          ← blank separator (end of category)
   */
  private addDepartmentDataSection(
    sheet: ExcelJS.Worksheet,
    data: any[],
    denom: db.PerUnitDenominator,
    totalCols: number
  ): void {
    const categories = ['Revenue', 'Cost of Sales', 'Payroll', 'Controllables', 'Other', 'Stats'];
    const PU_COLS = [8, 9, 10, 11, 12]; // per-unit column indices
    const ABS_COLS = [2, 3, 4, 5, 6]; // absolute value column indices

    // Helper: compute per-unit value, returns null if denominator is 0
    const perUnit = (value: number, denomValue: number): number | null => {
      if (denomValue === 0) return null;
      return value / denomValue;
    };

    // Helper: apply number formatting to absolute and per-unit columns
    const applyNumberFormats = (row: ExcelJS.Row) => {
      ABS_COLS.forEach(col => {
        const cell = row.getCell(col);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0';
      });
      PU_COLS.forEach(col => {
        const cell = row.getCell(col);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
      });
    };

    // Helper: sum a numeric field across rows
    const sumField = (rows: any[], field: string) =>
      rows.reduce((sum: number, r: any) => sum + (Number(r[field]) || 0), 0);

    // Helper: create a header row that carries aggregated totals
    const addHeaderWithTotals = (
      label: string,
      rows: any[],
      styleFn: (row: ExcelJS.Row) => void,
      isStats: boolean = false
    ) => {
      const totActuals = sumField(rows, 'actuals');
      const totBudget = sumField(rows, 'budget');
      const totLy = sumField(rows, 'ly');
      const totVsBud = totActuals - totBudget;
      const totVsLy = totActuals - totLy;

      const puAct = isStats ? null : perUnit(totActuals, denom.actuals);
      const puBud = isStats ? null : perUnit(totBudget, denom.budget);
      const puLy = isStats ? null : perUnit(totLy, denom.ly);
      const puVsBud = (puAct !== null && puBud !== null) ? puAct - puBud : null;
      const puVsLy = (puAct !== null && puLy !== null) ? puAct - puLy : null;

      const headerRow = sheet.addRow({
        account: label,
        actuals: formatNumber(totActuals),
        budget: formatNumber(totBudget),
        vsBud: formatNumber(totVsBud),
        ly: formatNumber(totLy),
        vsLy: formatNumber(totVsLy),
        sep: '',
        puAct: puAct !== null ? formatNumber(puAct) : null,
        puBud: puBud !== null ? formatNumber(puBud) : null,
        puVsBud: puVsBud !== null ? formatNumber(puVsBud) : null,
        puLy: puLy !== null ? formatNumber(puLy) : null,
        puVsLy: puVsLy !== null ? formatNumber(puVsLy) : null,
        comments: ''
      });
      styleFn(headerRow);
      this.styleDeptSeparator(headerRow);
      applyNumberFormats(headerRow);
    };

    for (const category of categories) {
      const categoryRows = data.filter(r => r.category === category);
      if (categoryRows.length === 0) continue;

      const isStats = category === 'Stats';

      // Category header row WITH totals
      addHeaderWithTotals(`Total ${category}`, categoryRows, applyCategorySubtotalStyle, isStats);

      if (isStats) {
        // Stats: render flat without level_12 sub-grouping
        for (const row of categoryRows) {
          const excelRow = sheet.addRow({
            account: `    ${row.accountName || row.account}`,
            actuals: formatNumber(row.actuals),
            budget: formatNumber(row.budget),
            vsBud: formatNumber(row.vsBud),
            ly: formatNumber(row.ly),
            vsLy: formatNumber(row.vsLy),
            sep: '',
            puAct: '',
            puBud: '',
            puVsBud: '',
            puLy: '',
            puVsLy: '',
            comments: ''
          });

          const accountLabel = this.buildAccountLabel(row.accountName || row.account, row.account);
          if (typeof accountLabel !== 'string') {
            excelRow.getCell(1).value = { richText: [{ font: { size: 10 }, text: '    ' }, ...accountLabel.richText] };
          }

          applyDataRowStyle(excelRow);
          this.styleDeptSeparator(excelRow);
          applyNumberFormats(excelRow);
        }
      } else {
        // Non-stats: group accounts by level_12
        const level12Map = new Map<string, any[]>();
        for (const row of categoryRows) {
          const groupKey = row.level12Group || `Other ${category}`;
          if (!level12Map.has(groupKey)) level12Map.set(groupKey, []);
          level12Map.get(groupKey)!.push(row);
        }

        for (const [groupName, groupRows] of level12Map) {
          // level_12 group header WITH totals (indented 2 spaces)
          addHeaderWithTotals(`  Total ${groupName}`, groupRows, applyGroupSubtotalStyle);

          // Account detail rows (indented 4 spaces)
          for (const row of groupRows) {
            const puAct = perUnit(row.actuals, denom.actuals);
            const puBud = perUnit(row.budget, denom.budget);
            const puLy = perUnit(row.ly, denom.ly);
            const puVsBud = (puAct !== null && puBud !== null) ? puAct - puBud : null;
            const puVsLy = (puAct !== null && puLy !== null) ? puAct - puLy : null;

            const displayName = row.accountName || row.account;
            const excelRow = sheet.addRow({
              account: `    ${displayName}`,
              actuals: formatNumber(row.actuals),
              budget: formatNumber(row.budget),
              vsBud: formatNumber(row.vsBud),
              ly: formatNumber(row.ly),
              vsLy: formatNumber(row.vsLy),
              sep: '',
              puAct: puAct !== null ? formatNumber(puAct) : null,
              puBud: puBud !== null ? formatNumber(puBud) : null,
              puVsBud: puVsBud !== null ? formatNumber(puVsBud) : null,
              puLy: puLy !== null ? formatNumber(puLy) : null,
              puVsLy: puVsLy !== null ? formatNumber(puVsLy) : null,
              comments: ''
            });

            // Override account cell with rich text if AccPac description exists
            const accountLabel = this.buildAccountLabel(displayName, row.account);
            if (typeof accountLabel !== 'string') {
              excelRow.getCell(1).value = { richText: [{ font: { size: 10 }, text: '    ' }, ...accountLabel.richText] };
            }

            applyDataRowStyle(excelRow);
            this.styleDeptSeparator(excelRow);
            applyNumberFormats(excelRow);
          }

          // Blank row separator after each level_12 sub-group
          this.addBlankSeparatorRow(sheet, totalCols);
        }
      }

      // Blank row separator after category
      this.addBlankSeparatorRow(sheet, totalCols);
    }

    // --- Department Profit & GOP% ---
    // Revenue is stored as negative (credit-balance), expenses as positive (debit-balance)
    // Profit = -(Revenue + Expenses), displayed as positive when profitable
    const revenueRows = data.filter(r => r.category === 'Revenue');
    const expenseCategories = ['Cost of Sales', 'Payroll', 'Controllables', 'Other'];
    const expenseRows = data.filter(r => expenseCategories.includes(r.category));

    if (revenueRows.length > 0) {
      // Sum raw values (revenue negative, expenses positive)
      const revActuals = sumField(revenueRows, 'actuals');
      const revBudget = sumField(revenueRows, 'budget');
      const revLy = sumField(revenueRows, 'ly');
      const expActuals = sumField(expenseRows, 'actuals');
      const expBudget = sumField(expenseRows, 'budget');
      const expLy = sumField(expenseRows, 'ly');

      // Department Profit = negate(revenue + expenses) so positive = profitable
      const profitActuals = -(revActuals + expActuals);
      const profitBudget = -(revBudget + expBudget);
      const profitLy = -(revLy + expLy);
      const profitVsBud = profitActuals - profitBudget;
      const profitVsLy = profitActuals - profitLy;

      // Per-unit for Department Profit
      const puProfitAct = perUnit(profitActuals, denom.actuals);
      const puProfitBud = perUnit(profitBudget, denom.budget);
      const puProfitLy = perUnit(profitLy, denom.ly);
      const puProfitVsBud = (puProfitAct !== null && puProfitBud !== null) ? puProfitAct - puProfitBud : null;
      const puProfitVsLy = (puProfitAct !== null && puProfitLy !== null) ? puProfitAct - puProfitLy : null;

      // Revenue totals (positive for display/denominator)
      const revTotalActuals = -revActuals;
      const revTotalBudget = -revBudget;
      const revTotalLy = -revLy;

      // Department Profit row (subtotal style)
      const profitRow = sheet.addRow({
        account: 'Department Profit',
        actuals: formatNumber(profitActuals),
        budget: formatNumber(profitBudget),
        vsBud: formatNumber(profitVsBud),
        ly: formatNumber(profitLy),
        vsLy: formatNumber(profitVsLy),
        sep: '',
        puAct: puProfitAct !== null ? formatNumber(puProfitAct) : null,
        puBud: puProfitBud !== null ? formatNumber(puProfitBud) : null,
        puVsBud: puProfitVsBud !== null ? formatNumber(puProfitVsBud) : null,
        puLy: puProfitLy !== null ? formatNumber(puProfitLy) : null,
        puVsLy: puProfitVsLy !== null ? formatNumber(puProfitVsLy) : null,
        comments: ''
      });
      profitRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = SUBTOTAL_FILL;
        cell.font = { ...DATA_FONT, bold: true };
        cell.border = BORDER_STYLE;
        cell.alignment = { vertical: 'middle' };
      });
      this.styleDeptSeparator(profitRow);
      ABS_COLS.forEach(col => {
        const cell = profitRow.getCell(col);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0';
      });
      PU_COLS.forEach(col => {
        const cell = profitRow.getCell(col);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
      });

      // GOP% row (no per-unit — already a ratio)
      const gopPctActuals = revTotalActuals !== 0 ? (profitActuals / revTotalActuals) * 100 : 0;
      const gopPctBudget = revTotalBudget !== 0 ? (profitBudget / revTotalBudget) * 100 : 0;
      const gopPctLy = revTotalLy !== 0 ? (profitLy / revTotalLy) * 100 : 0;

      const gopRow = sheet.addRow({
        account: 'GOP %',
        actuals: formatPercentage(gopPctActuals),
        budget: formatPercentage(gopPctBudget),
        vsBud: `${(gopPctActuals - gopPctBudget).toFixed(1)} pts`,
        ly: formatPercentage(gopPctLy),
        vsLy: `${(gopPctActuals - gopPctLy).toFixed(1)} pts`,
        sep: '',
        puAct: '',
        puBud: '',
        puVsBud: '',
        puLy: '',
        puVsLy: '',
        comments: ''
      });
      gopRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = SUBTOTAL_FILL;
        cell.font = { ...DATA_FONT, bold: true };
        cell.border = BORDER_STYLE;
        cell.alignment = { vertical: 'middle' };
      });
      this.styleDeptSeparator(gopRow);
    } else if (data.length > 0) {
      // Non-revenue departments (e.g. Admin & General): simple Total row
      const allRows = data.filter(r => r.category !== 'Stats');
      const totActuals = sumField(allRows, 'actuals');
      const totBudget = sumField(allRows, 'budget');
      const totLy = sumField(allRows, 'ly');
      const totVsBud = totActuals - totBudget;
      const totVsLy = totActuals - totLy;

      const puAct = perUnit(totActuals, denom.actuals);
      const puBud = perUnit(totBudget, denom.budget);
      const puLy = perUnit(totLy, denom.ly);
      const puVsBud = (puAct !== null && puBud !== null) ? puAct - puBud : null;
      const puVsLy = (puAct !== null && puLy !== null) ? puAct - puLy : null;

      const totalRow = sheet.addRow({
        account: 'Total',
        actuals: formatNumber(totActuals),
        budget: formatNumber(totBudget),
        vsBud: formatNumber(totVsBud),
        ly: formatNumber(totLy),
        vsLy: formatNumber(totVsLy),
        sep: '',
        puAct: puAct !== null ? formatNumber(puAct) : null,
        puBud: puBud !== null ? formatNumber(puBud) : null,
        puVsBud: puVsBud !== null ? formatNumber(puVsBud) : null,
        puLy: puLy !== null ? formatNumber(puLy) : null,
        puVsLy: puVsLy !== null ? formatNumber(puVsLy) : null,
        comments: ''
      });
      totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = SUBTOTAL_FILL;
        cell.font = { ...DATA_FONT, bold: true };
        cell.border = BORDER_STYLE;
        cell.alignment = { vertical: 'middle' };
      });
      this.styleDeptSeparator(totalRow);
      ABS_COLS.forEach(col => {
        const cell = totalRow.getCell(col);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0';
      });
      PU_COLS.forEach(col => {
        const cell = totalRow.getCell(col);
        if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
      });
    }
  }

  /**
   * Creates the Room Segments worksheet with Revenue, Room Nights, and ADR sections
   */
  private async createRoomSegmentWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Room Segments', { properties: { tabColor: TAB_COLOR_REPORT } });
    const TOTAL_COLS = 26;

    // 26 columns: Segment, Category, Revenue(7), Sep, Nights(7), Sep, ADR(7), Comments
    sheet.columns = [
      { key: 'segment', width: 35 },
      { key: 'category', width: 15 },
      { key: 'revAct', width: 14 },
      { key: 'revBud', width: 14 },
      { key: 'revVsBud', width: 14 },
      { key: 'revVsBudPct', width: 12 },
      { key: 'revLy', width: 14 },
      { key: 'revVsLy', width: 14 },
      { key: 'revVsLyPct', width: 12 },
      { key: 'sep1', width: 2 },
      { key: 'nightsAct', width: 12 },
      { key: 'nightsBud', width: 12 },
      { key: 'nightsVsBud', width: 12 },
      { key: 'nightsVsBudPct', width: 12 },
      { key: 'nightsLy', width: 12 },
      { key: 'nightsVsLy', width: 12 },
      { key: 'nightsVsLyPct', width: 12 },
      { key: 'sep2', width: 2 },
      { key: 'adrAct', width: 12 },
      { key: 'adrBud', width: 12 },
      { key: 'adrVsBud', width: 12 },
      { key: 'adrVsBudPct', width: 12 },
      { key: 'adrLy', width: 12 },
      { key: 'adrVsLy', width: 12 },
      { key: 'adrVsLyPct', width: 12 },
      { key: 'comments', width: 35 },
    ];

    // Row 1: Section group headers
    const groupRow = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    groupRow.getCell(3).value = 'Revenue';
    groupRow.getCell(11).value = 'Room Nights';
    groupRow.getCell(19).value = 'ADR';
    sheet.mergeCells(1, 3, 1, 9);
    sheet.mergeCells(1, 11, 1, 17);
    sheet.mergeCells(1, 19, 1, 25);
    applyHeaderStyle(groupRow);
    this.styleRoomSegSeparators(groupRow);

    // Row 2: Column sub-headers
    const headerRow = sheet.addRow([
      'Segment', 'Category',
      'Actuals', 'Budget', 'vs Bud', 'vs Bud %', 'LY', 'vs LY', 'vs LY %',
      '',
      'Actuals', 'Budget', 'vs Bud', 'vs Bud %', 'LY', 'vs LY', 'vs LY %',
      '',
      'Actuals', 'Budget', 'vs Bud', 'vs Bud %', 'LY', 'vs LY', 'vs LY %',
      'Comments'
    ]);
    applyHeaderStyle(headerRow);
    this.styleRoomSegSeparators(headerRow);

    // Fetch single-month data
    const monthSegmentData = await db.getRoomSegmentExportData(
      config.ou,
      config.selectedMonth,
      config.selectedYear,
      config.selectedMonth,
      config.selectedYear,
      config.version
    );

    // Fetch range data
    const rangeSegmentData = await db.getRoomSegmentExportData(
      config.ou,
      config.ytdStartMonth,
      config.ytdStartYear,
      config.ytdEndMonth,
      config.ytdEndYear,
      config.version
    );

    // --- Selected Month Section ---
    const monthSectionHeader = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    monthSectionHeader.getCell(1).value = `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`;
    applySectionHeaderStyle(monthSectionHeader);
    sheet.mergeCells(monthSectionHeader.number, 1, monthSectionHeader.number, TOTAL_COLS);

    // Consolidated summary (no weekday/weekend split)
    const monthConsolHeader = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    monthConsolHeader.getCell(1).value = 'Consolidated Summary';
    applySectionHeaderStyle(monthConsolHeader);
    sheet.mergeCells(monthConsolHeader.number, 1, monthConsolHeader.number, TOTAL_COLS);

    this.addConsolidatedSegmentSection(sheet, monthSegmentData, TOTAL_COLS);

    this.addBlankSeparatorRow(sheet, TOTAL_COLS, 'roomSeg');

    // Detail by day type
    const monthDetailHeader = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    monthDetailHeader.getCell(1).value = 'Detail by Day Type';
    applySectionHeaderStyle(monthDetailHeader);
    sheet.mergeCells(monthDetailHeader.number, 1, monthDetailHeader.number, TOTAL_COLS);

    this.addRoomSegmentDataSection(sheet, monthSegmentData, TOTAL_COLS);

    // Blank separator row
    this.addBlankSeparatorRow(sheet, TOTAL_COLS, 'roomSeg');

    // --- Range Section ---
    const rangeSectionHeader = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    rangeSectionHeader.getCell(1).value = getRangeLabel(
      config.ytdStartMonth, config.ytdStartYear,
      config.ytdEndMonth, config.ytdEndYear
    );
    applySectionHeaderStyle(rangeSectionHeader);
    sheet.mergeCells(rangeSectionHeader.number, 1, rangeSectionHeader.number, TOTAL_COLS);

    // Consolidated summary (no weekday/weekend split)
    const rangeConsolHeader = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    rangeConsolHeader.getCell(1).value = 'Consolidated Summary';
    applySectionHeaderStyle(rangeConsolHeader);
    sheet.mergeCells(rangeConsolHeader.number, 1, rangeConsolHeader.number, TOTAL_COLS);

    this.addConsolidatedSegmentSection(sheet, rangeSegmentData, TOTAL_COLS);

    this.addBlankSeparatorRow(sheet, TOTAL_COLS, 'roomSeg');

    // Detail by day type
    const rangeDetailHeader = sheet.addRow(new Array(TOTAL_COLS).fill(''));
    rangeDetailHeader.getCell(1).value = 'Detail by Day Type';
    applySectionHeaderStyle(rangeDetailHeader);
    sheet.mergeCells(rangeDetailHeader.number, 1, rangeDetailHeader.number, TOTAL_COLS);

    this.addRoomSegmentDataSection(sheet, rangeSegmentData, TOTAL_COLS);

    // Freeze panes (2 header rows)
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];
  }

  /**
   * Helper to add room segment data rows grouped by category with subtotals
   */
  private addRoomSegmentDataSection(
    sheet: ExcelJS.Worksheet,
    data: any[],
    totalCols: number
  ): void {
    const categories = ['Sun-Thur', 'Fri-Sat', 'Groups', 'Complimentary'];

    const grandTotals = {
      revAct: 0, revBud: 0, revLy: 0,
      nightsAct: 0, nightsBud: 0, nightsLy: 0
    };

    for (const category of categories) {
      const categoryRows = data.filter(r => r.category === category);
      if (categoryRows.length === 0) continue;

      // Category header
      const catHeader = sheet.addRow(new Array(totalCols).fill(''));
      catHeader.getCell(1).value = category;
      applyCategoryHeaderStyle(catHeader);
      sheet.mergeCells(catHeader.number, 1, catHeader.number, totalCols);

      const subtotals = {
        revAct: 0, revBud: 0, revLy: 0,
        nightsAct: 0, nightsBud: 0, nightsLy: 0
      };

      for (const row of categoryRows) {
        const revAct = row.revenueActuals || 0;
        const revBud = row.revenueBudget || 0;
        const revLy = row.revenueLy || 0;
        const nightsAct = row.nightsActuals || 0;
        const nightsBud = row.nightsBudget || 0;
        const nightsLy = row.nightsLy || 0;

        const values = this.computeRoomSegRow(
          row.description, row.category,
          revAct, revBud, revLy, nightsAct, nightsBud, nightsLy
        );
        const excelRow = sheet.addRow(values);
        applyDataRowStyle(excelRow);
        this.styleRoomSegSeparators(excelRow);
        this.applyRoomSegNumFormats(excelRow);

        subtotals.revAct += revAct;
        subtotals.revBud += revBud;
        subtotals.revLy += revLy;
        subtotals.nightsAct += nightsAct;
        subtotals.nightsBud += nightsBud;
        subtotals.nightsLy += nightsLy;
      }

      // Category subtotal row
      const subValues = this.computeRoomSegRow(
        `${category} Total`, '',
        subtotals.revAct, subtotals.revBud, subtotals.revLy,
        subtotals.nightsAct, subtotals.nightsBud, subtotals.nightsLy
      );
      const subRow = sheet.addRow(subValues);
      this.applySubtotalRowStyle(subRow, false);
      this.styleRoomSegSeparators(subRow);
      this.applyRoomSegNumFormats(subRow);

      // Accumulate grand totals
      grandTotals.revAct += subtotals.revAct;
      grandTotals.revBud += subtotals.revBud;
      grandTotals.revLy += subtotals.revLy;
      grandTotals.nightsAct += subtotals.nightsAct;
      grandTotals.nightsBud += subtotals.nightsBud;
      grandTotals.nightsLy += subtotals.nightsLy;

      // Blank row after category
      this.addBlankSeparatorRow(sheet, totalCols, 'roomSeg');
    }

    // Grand total row
    const grandValues = this.computeRoomSegRow(
      'Grand Total', '',
      grandTotals.revAct, grandTotals.revBud, grandTotals.revLy,
      grandTotals.nightsAct, grandTotals.nightsBud, grandTotals.nightsLy
    );
    const grandRow = sheet.addRow(grandValues);
    this.applySubtotalRowStyle(grandRow, true);
    this.styleRoomSegSeparators(grandRow);
    this.applyRoomSegNumFormats(grandRow);
  }

  /**
   * Helper to add consolidated (non-weekday/weekend split) room segment data.
   * Groups rows by consolidatedName and consolidatedCategory, sums values,
   * then renders with category subtotals and grand total.
   */
  private addConsolidatedSegmentSection(
    sheet: ExcelJS.Worksheet,
    data: db.RoomSegmentExportRow[],
    totalCols: number
  ): void {
    const consolidatedCategories = ['Transient', 'Groups', 'Complimentary'];

    // Aggregate rows by consolidatedName + consolidatedCategory (preserve insertion order)
    const consolidatedMap = new Map<string, {
      name: string; category: string;
      revAct: number; revBud: number; revLy: number;
      nightsAct: number; nightsBud: number; nightsLy: number;
    }>();

    for (const row of data) {
      const key = `${row.consolidatedCategory}::${row.consolidatedName}`;
      if (!consolidatedMap.has(key)) {
        consolidatedMap.set(key, {
          name: row.consolidatedName,
          category: row.consolidatedCategory,
          revAct: 0, revBud: 0, revLy: 0,
          nightsAct: 0, nightsBud: 0, nightsLy: 0
        });
      }
      const agg = consolidatedMap.get(key)!;
      agg.revAct += row.revenueActuals || 0;
      agg.revBud += row.revenueBudget || 0;
      agg.revLy += row.revenueLy || 0;
      agg.nightsAct += row.nightsActuals || 0;
      agg.nightsBud += row.nightsBudget || 0;
      agg.nightsLy += row.nightsLy || 0;
    }

    const allConsolidated = Array.from(consolidatedMap.values());
    const grandTotals = {
      revAct: 0, revBud: 0, revLy: 0,
      nightsAct: 0, nightsBud: 0, nightsLy: 0
    };

    for (const category of consolidatedCategories) {
      const categoryRows = allConsolidated.filter(r => r.category === category);
      if (categoryRows.length === 0) continue;

      // Category header
      const catHeader = sheet.addRow(new Array(totalCols).fill(''));
      catHeader.getCell(1).value = category;
      applyCategoryHeaderStyle(catHeader);
      sheet.mergeCells(catHeader.number, 1, catHeader.number, totalCols);

      const subtotals = {
        revAct: 0, revBud: 0, revLy: 0,
        nightsAct: 0, nightsBud: 0, nightsLy: 0
      };

      for (const row of categoryRows) {
        const values = this.computeRoomSegRow(
          row.name, row.category,
          row.revAct, row.revBud, row.revLy,
          row.nightsAct, row.nightsBud, row.nightsLy
        );
        const excelRow = sheet.addRow(values);
        applyDataRowStyle(excelRow);
        this.styleRoomSegSeparators(excelRow);
        this.applyRoomSegNumFormats(excelRow);

        subtotals.revAct += row.revAct;
        subtotals.revBud += row.revBud;
        subtotals.revLy += row.revLy;
        subtotals.nightsAct += row.nightsAct;
        subtotals.nightsBud += row.nightsBud;
        subtotals.nightsLy += row.nightsLy;
      }

      // Category subtotal
      const subValues = this.computeRoomSegRow(
        `${category} Total`, '',
        subtotals.revAct, subtotals.revBud, subtotals.revLy,
        subtotals.nightsAct, subtotals.nightsBud, subtotals.nightsLy
      );
      const subRow = sheet.addRow(subValues);
      this.applySubtotalRowStyle(subRow, false);
      this.styleRoomSegSeparators(subRow);
      this.applyRoomSegNumFormats(subRow);

      grandTotals.revAct += subtotals.revAct;
      grandTotals.revBud += subtotals.revBud;
      grandTotals.revLy += subtotals.revLy;
      grandTotals.nightsAct += subtotals.nightsAct;
      grandTotals.nightsBud += subtotals.nightsBud;
      grandTotals.nightsLy += subtotals.nightsLy;

      this.addBlankSeparatorRow(sheet, totalCols, 'roomSeg');
    }

    // Grand total
    const grandValues = this.computeRoomSegRow(
      'Grand Total', '',
      grandTotals.revAct, grandTotals.revBud, grandTotals.revLy,
      grandTotals.nightsAct, grandTotals.nightsBud, grandTotals.nightsLy
    );
    const grandRow = sheet.addRow(grandValues);
    this.applySubtotalRowStyle(grandRow, true);
    this.styleRoomSegSeparators(grandRow);
    this.applyRoomSegNumFormats(grandRow);
  }

  /**
   * Compute all values for a room segment row including variances and ADR
   */
  private computeRoomSegRow(
    description: string,
    category: string,
    revAct: number, revBud: number, revLy: number,
    nightsAct: number, nightsBud: number, nightsLy: number
  ): (string | number)[] {
    const revVsBud = revAct - revBud;
    const revVsBudPct = revBud !== 0 ? (revVsBud / Math.abs(revBud)) * 100 : null;
    const revVsLy = revAct - revLy;
    const revVsLyPct = revLy !== 0 ? (revVsLy / Math.abs(revLy)) * 100 : null;

    const nightsVsBud = nightsAct - nightsBud;
    const nightsVsBudPct = nightsBud !== 0 ? (nightsVsBud / Math.abs(nightsBud)) * 100 : null;
    const nightsVsLy = nightsAct - nightsLy;
    const nightsVsLyPct = nightsLy !== 0 ? (nightsVsLy / Math.abs(nightsLy)) * 100 : null;

    const adrAct = nightsAct !== 0 ? revAct / nightsAct : null;
    const adrBud = nightsBud !== 0 ? revBud / nightsBud : null;
    const adrLy = nightsLy !== 0 ? revLy / nightsLy : null;
    const adrVsBud = adrAct !== null && adrBud !== null ? adrAct - adrBud : null;
    const adrVsBudPct = adrVsBud !== null && adrBud !== null && adrBud !== 0
      ? (adrVsBud / Math.abs(adrBud)) * 100 : null;
    const adrVsLy = adrAct !== null && adrLy !== null ? adrAct - adrLy : null;
    const adrVsLyPct = adrVsLy !== null && adrLy !== null && adrLy !== 0
      ? (adrVsLy / Math.abs(adrLy)) * 100 : null;

    return [
      description, category,
      formatNumber(revAct), formatNumber(revBud), formatNumber(revVsBud),
      formatPercentage(revVsBudPct), formatNumber(revLy), formatNumber(revVsLy),
      formatPercentage(revVsLyPct),
      '',
      formatNumber(nightsAct), formatNumber(nightsBud), formatNumber(nightsVsBud),
      formatPercentage(nightsVsBudPct), formatNumber(nightsLy), formatNumber(nightsVsLy),
      formatPercentage(nightsVsLyPct),
      '',
      formatNumber(adrAct, 2), formatNumber(adrBud, 2), formatNumber(adrVsBud, 2),
      formatPercentage(adrVsBudPct), formatNumber(adrLy, 2), formatNumber(adrVsLy, 2),
      formatPercentage(adrVsLyPct),
      ''
    ];
  }

  /**
   * Style separator columns (10 and 18) with blue-gray fill
   */
  private styleRoomSegSeparators(row: ExcelJS.Row): void {
    [10, 18].forEach(col => {
      const cell = row.getCell(col);
      cell.fill = SEPARATOR_FILL;
      cell.value = '';
    });
  }

  /**
   * Style the separator column (col 7) on department sheets
   */
  private styleDeptSeparator(row: ExcelJS.Row): void {
    const cell = row.getCell(7);
    cell.fill = SEPARATOR_FILL;
    cell.value = '';
  }

  /**
   * Apply subtotal or grand total row styling
   */
  private applySubtotalRowStyle(row: ExcelJS.Row, isGrandTotal: boolean): void {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = isGrandTotal ? SECTION_HEADER_FILL : SUBTOTAL_FILL;
      cell.font = isGrandTotal
        ? { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
        : { bold: true, size: 10 };
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'middle' };
    });
    row.height = isGrandTotal ? 22 : 20;
  }

  /**
   * Apply number formatting to room segment data columns
   */
  private applyRoomSegNumFormats(row: ExcelJS.Row): void {
    // Revenue currency: cols 3-5, 7-8
    [3, 4, 5, 7, 8].forEach(col => {
      const cell = row.getCell(col);
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    });
    // Nights integer: cols 11-13, 15-16
    [11, 12, 13, 15, 16].forEach(col => {
      const cell = row.getCell(col);
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    });
    // ADR decimal: cols 19-21, 23-24
    [19, 20, 21, 23, 24].forEach(col => {
      const cell = row.getCell(col);
      if (typeof cell.value === 'number') cell.numFmt = '#,##0.00';
    });
  }
}

export default new ExcelExportService();
