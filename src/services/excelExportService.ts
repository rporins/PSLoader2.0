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
  fgColor: { argb: 'FFE8E8E8' }  // Light gray
};

const SECTION_HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11
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
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 24;
}

function applySectionHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = SECTION_HEADER_FILL;
    cell.font = SECTION_HEADER_FONT;
    cell.border = BORDER_STYLE;
  });
  row.height = 22;
}

function applyCategoryHeaderStyle(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = CATEGORY_HEADER_FILL;
    cell.font = CATEGORY_HEADER_FONT;
    cell.border = BORDER_STYLE;
  });
  row.height = 20;
}

function applyDataRowStyle(row: ExcelJS.Row, isHeader: boolean = false): void {
  row.eachCell((cell) => {
    cell.font = isHeader ? { ...DATA_FONT, bold: true } : DATA_FONT;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'middle' };
  });
}

function formatNumber(value: number | null, decimals: number = 0): number | string {
  if (value === null || value === undefined) return '';
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return '';
  return `${(value * 100).toFixed(1)}%`;
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

class ExcelExportService {
  /**
   * Main entry point - generates the complete Excel report
   * Sheet order: F90 Report -> Room Segments -> Department tabs
   */
  async generateReport(config: ExcelExportConfig, savePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'PS Loader';
    workbook.created = new Date();
    workbook.modified = new Date();

    // 1. Create F90 Report worksheet (first tab)
    await this.createF90Worksheet(workbook, config);

    // 2. Create Room Segments worksheet (second tab)
    await this.createRoomSegmentWorksheet(workbook, config);

    // 3. Create Department worksheets (remaining tabs)
    await this.createDepartmentWorksheets(workbook, config);

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
    const sheet = workbook.addWorksheet('F90 Report');

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
    sheet.addRow([]);

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

      // Color variance cells (green for positive only)
      const vsBudCell = excelRow.getCell(4);
      const vsLyCell = excelRow.getCell(7);

      if (typeof row.vs_bud === 'number' && row.vs_bud > 0) {
        vsBudCell.font = {
          ...vsBudCell.font,
          color: { argb: 'FF008800' }
        };
      }
      if (typeof row.vs_ly === 'number' && row.vs_ly > 0) {
        vsLyCell.font = {
          ...vsLyCell.font,
          color: { argb: 'FF008800' }
        };
      }
    }
  }

  /**
   * Creates one worksheet per department with account-level detail
   */
  private async createDepartmentWorksheets(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig
  ): Promise<void> {
    // Get departments that have data for this OU
    const departments = await db.getDepartmentsWithDataForOU(config.ou, config.version);

    // Track used sheet names to avoid duplicates
    const usedSheetNames = new Set<string>();

    for (const dept of departments) {
      // Fetch single-month data
      const monthDetailData = await db.getDepartmentDetailData(
        config.ou,
        dept.baseDepartment,
        config.selectedMonth,
        config.selectedYear,
        config.selectedMonth,
        config.selectedYear,
        config.version
      );

      // Fetch range data
      const rangeDetailData = await db.getDepartmentDetailData(
        config.ou,
        dept.baseDepartment,
        config.ytdStartMonth,
        config.ytdStartYear,
        config.ytdEndMonth,
        config.ytdEndYear,
        config.version
      );

      // Skip creating worksheet if no data exists for either period
      if (rangeDetailData.length === 0 && monthDetailData.length === 0) {
        continue;
      }

      // department_description_detail_level_max already contains name + ID (e.g., "Rooms D0010")
      let sheetName = sanitizeSheetName(dept.departmentName || dept.baseDepartment);

      // Handle any remaining duplicates by adding a suffix
      let finalName = sheetName;
      let counter = 1;
      while (usedSheetNames.has(finalName.toLowerCase())) {
        const suffix = ` (${counter})`;
        finalName = sheetName.substring(0, 31 - suffix.length) + suffix;
        counter++;
      }
      usedSheetNames.add(finalName.toLowerCase());

      const sheet = workbook.addWorksheet(finalName);

      // Set column widths
      sheet.columns = [
        { header: 'Account', key: 'account', width: 45 },
        { header: 'Actuals', key: 'actuals', width: 14 },
        { header: 'Budget', key: 'budget', width: 14 },
        { header: 'vs Bud', key: 'vsBud', width: 14 },
        { header: 'LY', key: 'ly', width: 14 },
        { header: 'vs LY', key: 'vsLy', width: 14 },
        { header: 'Comments', key: 'comments', width: 35 },
      ];

      // Style header row
      applyHeaderStyle(sheet.getRow(1));

      // --- Selected Month Section ---
      const monthSectionHeader = sheet.addRow([
        `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`,
        '', '', '', '', '', ''
      ]);
      applySectionHeaderStyle(monthSectionHeader);
      sheet.mergeCells(monthSectionHeader.number, 1, monthSectionHeader.number, 7);

      this.addDepartmentDataSection(sheet, monthDetailData);

      // Blank separator row
      sheet.addRow([]);

      // --- Range Section ---
      const rangeSectionHeader = sheet.addRow([
        getRangeLabel(config.ytdStartMonth, config.ytdStartYear, config.ytdEndMonth, config.ytdEndYear),
        '', '', '', '', '', ''
      ]);
      applySectionHeaderStyle(rangeSectionHeader);
      sheet.mergeCells(rangeSectionHeader.number, 1, rangeSectionHeader.number, 7);

      this.addDepartmentDataSection(sheet, rangeDetailData);

      // Freeze panes
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    }
  }

  /**
   * Helper to add department data rows grouped by category
   */
  private addDepartmentDataSection(sheet: ExcelJS.Worksheet, data: any[]): void {
    const categories = ['Revenue', 'Cost of Sales', 'Payroll', 'Controllables', 'Other', 'Stats'];

    for (const category of categories) {
      const categoryRows = data.filter(r => r.category === category);
      if (categoryRows.length === 0) continue;

      // Add category header
      const catHeader = sheet.addRow([category, '', '', '', '', '', '']);
      applyCategoryHeaderStyle(catHeader);
      sheet.mergeCells(catHeader.number, 1, catHeader.number, 7);

      // Add account rows
      for (const row of categoryRows) {
        const excelRow = sheet.addRow({
          account: row.accountName || row.account,
          actuals: formatNumber(row.actuals),
          budget: formatNumber(row.budget),
          vsBud: formatNumber(row.vsBud),
          ly: formatNumber(row.ly),
          vsLy: formatNumber(row.vsLy),
          comments: ''
        });

        applyDataRowStyle(excelRow);

        // Apply number formatting
        [2, 3, 4, 5, 6].forEach(col => {
          const cell = excelRow.getCell(col);
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        });

        // Color variance cells (green for positive only)
        const vsBudCell = excelRow.getCell(4);
        const vsLyCell = excelRow.getCell(6);

        if (row.vsBud > 0) {
          vsBudCell.font = {
            ...vsBudCell.font,
            color: { argb: 'FF008800' }
          };
        }
        if (row.vsLy > 0) {
          vsLyCell.font = {
            ...vsLyCell.font,
            color: { argb: 'FF008800' }
          };
        }
      }

      // Add blank row after category
      sheet.addRow([]);
    }
  }

  /**
   * Creates the Room Segments worksheet
   */
  private async createRoomSegmentWorksheet(
    workbook: ExcelJS.Workbook,
    config: ExcelExportConfig
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Room Segments');

    // Set column widths
    sheet.columns = [
      { header: 'Segment', key: 'description', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Rev Actuals', key: 'revenueActuals', width: 14 },
      { header: 'Rev Budget', key: 'revenueBudget', width: 14 },
      { header: 'Rev LY', key: 'revenueLy', width: 14 },
      { header: 'Nights ACT', key: 'nightsActuals', width: 12 },
      { header: 'Nights BUD', key: 'nightsBudget', width: 12 },
      { header: 'Nights LY', key: 'nightsLy', width: 12 },
      { header: 'Comments', key: 'comments', width: 35 },
    ];

    // Style header row
    applyHeaderStyle(sheet.getRow(1));

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
    const monthSectionHeader = sheet.addRow([
      `Selected Month: ${MONTH_NAMES[config.selectedMonth - 1]} ${config.selectedYear}`,
      '', '', '', '', '', '', '', ''
    ]);
    applySectionHeaderStyle(monthSectionHeader);
    sheet.mergeCells(monthSectionHeader.number, 1, monthSectionHeader.number, 9);

    this.addRoomSegmentDataSection(sheet, monthSegmentData);

    // Blank separator row
    sheet.addRow([]);

    // --- Range Section ---
    const rangeSectionHeader = sheet.addRow([
      getRangeLabel(config.ytdStartMonth, config.ytdStartYear, config.ytdEndMonth, config.ytdEndYear),
      '', '', '', '', '', '', '', ''
    ]);
    applySectionHeaderStyle(rangeSectionHeader);
    sheet.mergeCells(rangeSectionHeader.number, 1, rangeSectionHeader.number, 9);

    this.addRoomSegmentDataSection(sheet, rangeSegmentData);

    // Freeze panes
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  /**
   * Helper to add room segment data rows grouped by category
   */
  private addRoomSegmentDataSection(sheet: ExcelJS.Worksheet, data: any[]): void {
    const categories = ['Sun-Thur', 'Fri-Sat', 'Groups', 'Complimentary'];

    for (const category of categories) {
      const categoryRows = data.filter(r => r.category === category);
      if (categoryRows.length === 0) continue;

      // Add category header
      const catHeader = sheet.addRow([category, '', '', '', '', '', '', '', '']);
      applyCategoryHeaderStyle(catHeader);
      sheet.mergeCells(catHeader.number, 1, catHeader.number, 9);

      // Add segment rows
      for (const row of categoryRows) {
        const excelRow = sheet.addRow({
          description: row.description,
          category: row.category,
          revenueActuals: formatNumber(row.revenueActuals),
          revenueBudget: formatNumber(row.revenueBudget),
          revenueLy: formatNumber(row.revenueLy),
          nightsActuals: formatNumber(row.nightsActuals),
          nightsBudget: formatNumber(row.nightsBudget),
          nightsLy: formatNumber(row.nightsLy),
          comments: ''
        });

        applyDataRowStyle(excelRow);

        // Apply number formatting
        [3, 4, 5].forEach(col => {
          const cell = excelRow.getCell(col);
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        });
        [6, 7, 8].forEach(col => {
          const cell = excelRow.getCell(col);
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        });
      }

      // Add blank row after category
      sheet.addRow([]);
    }
  }
}

export default new ExcelExportService();
