/**
 * Protea Budget Pack Service
 * ===========================
 * Generates Protea Budget Pack Excel reports.  Shares row structure, department
 * groupings, account movements, and renames with the Protea Report Pack
 * (via proteaShared.ts) but uses a budget-comparison column layout.
 *
 * Column layout (N = number of selected months):
 *   A: Label | B: LY Budget | C: vs Cur % | D: LY Actuals | E: vs Cur %
 *   F: Current Budget Total | G..G+N-1: Budget per month | last: Comments
 *
 * Runs in the Electron main process.
 */

import ExcelJS from 'exceljs';
import * as db from '../local_db';
import { PLCalculationResult } from '../types/plReportTypes';
import { PROTEA_F90_PL_ROW_CONFIG, PROTEA_F90_PL_ROW_CONFIG_WITH_BANQUETING } from './reports/proteaF90PLRowConfig';
import { INVEST_CUSTOM_SUBGROUPS, InvestSubgroupDef } from './reports/investSubgroupConfig';
import {
  ROOMS_KPI_CONFIG,
  FB_KPI_CONFIG,
  MONTH_NAMES,
  TAB_COLOR_REPORT,
  TAB_COLOR_GROUP_SUMMARY,
  TAB_COLOR_DEPARTMENT,
  HEADER_FILL,
  HEADER_FONT,
  SECTION_HEADER_FILL,
  SECTION_HEADER_FONT,
  CATEGORY_HEADER_FILL,
  CATEGORY_HEADER_FONT,
  SEPARATOR_FILL,
  SUBTOTAL_FILL,
  GROUP_HEADER_FILL,
  GROUP_HEADER_FONT,
  GROUP_SUBTOTAL_FILL,
  GROUP_SUBTOTAL_FONT,
  CATEGORY_TOTAL_FILL,
  CATEGORY_TOTAL_FONT,
  CATEGORY_TOTAL_BORDER,
  GROUP_SUBTOTAL_BORDER,
  DATA_FONT,
  TOTAL_ROW_BORDER,
  BORDER_STYLE,
  applyHeaderStyle,
  applySectionHeaderStyle,
  applyCategoryHeaderStyle,
  applyDataRowStyle,
  applyGroupHeaderStyle,
  applyGroupSubtotalStyle,
  applyCategorySubtotalStyle,
  formatNumber,
  formatPercentage,
  sanitizeSheetName,
  getRangeLabel,
  aggregateDuplicateAccounts,
  proteaRenameLabel,
  EXCEL_EXCLUDED_DEPARTMENTS,
  PROTEA_MOVEMENT_SOURCE_DEPTS,
  isMovedAccount,
  PROTEA_DEPARTMENT_MOVEMENTS,
  BANQUETING_DEPARTMENTS,
  PROTEA_GROUP_DISPLAY_ORDER,
  MOVED_DEPT_SET,
  MOVED_DEPT_BY_SOURCE,
  MOVEMENT_TARGET_GROUPS,
  classifyAccountsByLevel20,
} from './reports/proteaShared';

// ============================================================================
// TYPES
// ============================================================================

export interface ProteaBudgetPackConfig {
  ou: string;
  hotelName: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  version: string;              // 'MAIN' or 'OWNR'
  generateDetailTabs: boolean;
  includeBanquetingBreakdown: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Generate period strings for a range (reuse from plCalculationEngine at runtime) */
function generatePeriodsSync(startMonth: number, startYear: number, endMonth: number, endYear: number): string[] {
  const periods: string[] = [];
  let m = startMonth, y = startYear;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    periods.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return periods;
}

/** Offset a period string by -12 months */
function offsetPeriodMinusYear(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${y - 1}-${String(m).padStart(2, '0')}`;
}

/** Compute variance percentage: (a - b) / |b| * 100 */
function pct(a: number, b: number): number | null {
  return b !== 0 ? ((a - b) / Math.abs(b)) * 100 : null;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ProteaBudgetPackService {
  private accpacDescriptions: Map<string, string[]> = new Map();
  private generatedAt: string = '';
  private periods: string[] = [];
  private lyPeriods: string[] = [];

  /** Registry of sheets and group headers for the cover page TOC */
  private sheetRegistry: Array<{
    type: 'sheet' | 'groupHeader';
    sheetName: string;
    groupName?: string;
    indent: boolean;
  }> = [];

  // ============================================================================
  // COLUMN HELPERS
  // ============================================================================

  /** Total columns for current period selection */
  private get totalCols(): number { return this.periods.length + 7; }

  /** Build column definitions for budget pack layout */
  private buildColumns(): Partial<ExcelJS.Column>[] {
    const cols: Partial<ExcelJS.Column>[] = [
      { key: 'label', width: 45 },
      { key: 'lyBud', width: 14 },
      { key: 'lyBudVar', width: 12 },
      { key: 'lyAct', width: 14 },
      { key: 'lyActVar', width: 12 },
      { key: 'curBud', width: 14 },
    ];
    for (let i = 0; i < this.periods.length; i++) {
      cols.push({ key: `budM${i}`, width: 12 });
    }
    cols.push({ key: 'comments', width: 35 });
    return cols;
  }

  /** Short month-year label for column headers (e.g. "Jan 27") */
  private periodLabel(period: string): string {
    const [y, m] = period.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${String(y).slice(-2)}`;
  }

  // ============================================================================
  // TITLE & HEADER HELPERS
  // ============================================================================

  private addSheetTitleHeader(sheet: ExcelJS.Worksheet, config: ProteaBudgetPackConfig, reportName: string): void {
    const tc = this.totalCols;

    // Row 1: Report name
    const reportRow = sheet.addRow(new Array(tc).fill(''));
    reportRow.getCell(1).value = reportName;
    reportRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
    reportRow.getCell(1).alignment = { vertical: 'middle' };
    reportRow.height = 28;
    sheet.mergeCells(reportRow.number, 1, reportRow.number, tc);

    // Row 2: Hotel name + range
    const titleRow = sheet.addRow(new Array(tc).fill(''));
    titleRow.getCell(1).value = `${config.hotelName}  —  Budget Review: ${MONTH_NAMES[config.startMonth - 1]} ${config.startYear} - ${MONTH_NAMES[config.endMonth - 1]} ${config.endYear}`;
    titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1E3A5F' } };
    titleRow.getCell(1).alignment = { vertical: 'middle' };
    titleRow.height = 26;
    sheet.mergeCells(titleRow.number, 1, titleRow.number, tc);

    // Row 3: Generation timestamp
    const tsRow = sheet.addRow(new Array(tc).fill(''));
    tsRow.getCell(1).value = `Generated: ${this.generatedAt}`;
    tsRow.getCell(1).font = { size: 8, color: { argb: 'FF999999' } };
    tsRow.getCell(1).alignment = { vertical: 'middle' };
    tsRow.height = 16;
    sheet.mergeCells(tsRow.number, 1, tsRow.number, tc);
  }

  /** Add period group + sub-headers for the budget pack column layout */
  private addColumnHeaders(sheet: ExcelJS.Worksheet, config: ProteaBudgetPackConfig): void {
    const tc = this.totalCols;
    const lyLabel = getRangeLabel(config.startMonth, config.startYear - 1, config.endMonth, config.endYear - 1);
    const curLabel = getRangeLabel(config.startMonth, config.startYear, config.endMonth, config.endYear);

    // Group row: Prior Year spanning B-E, Current Budget spanning F onwards
    const groupRow = sheet.addRow(new Array(tc).fill(''));
    groupRow.getCell(2).value = `Prior Year: ${lyLabel.replace(/^[^:]+:\s*/, '')}`;
    groupRow.getCell(6).value = `Current Budget: ${curLabel.replace(/^[^:]+:\s*/, '')}`;
    sheet.mergeCells(groupRow.number, 2, groupRow.number, 5);
    sheet.mergeCells(groupRow.number, 6, groupRow.number, 6 + this.periods.length);
    applyHeaderStyle(groupRow);

    // Sub-header row
    const subHeaders: string[] = [
      'P&L Line',
      'LY Budget', 'vs Cur %',
      'LY Actuals', 'vs Cur %',
      'Total',
    ];
    for (const p of this.periods) {
      subHeaders.push(this.periodLabel(p));
    }
    subHeaders.push('Comments');
    const headerRow = sheet.addRow(subHeaders);
    applyHeaderStyle(headerRow);
  }

  // ============================================================================
  // ACCOUNT LABEL HELPER
  // ============================================================================

  private buildAccountLabel(displayName: string, accountCode: string, movedFrom?: string): string | ExcelJS.CellRichTextValue {
    displayName = proteaRenameLabel(displayName);
    const descriptions = this.accpacDescriptions.get(accountCode);
    const hasDescriptions = descriptions && descriptions.length > 0;

    if (hasDescriptions || movedFrom) {
      const parts: ExcelJS.RichText[] = [
        { font: { size: 10 }, text: displayName },
      ];
      if (hasDescriptions) {
        parts.push({ font: { size: 10, color: { argb: 'FF999999' } }, text: ` [${descriptions!.join(', ')}]` });
      }
      if (movedFrom) {
        parts.push({ font: { size: 9, italic: true, color: { argb: 'FFB0B0B0' } }, text: ` [moved from ${movedFrom}]` });
      }
      return { richText: parts };
    }
    return displayName;
  }

  // ============================================================================
  // NUMBER FORMAT HELPERS
  // ============================================================================

  /** Apply #,##0 format to all numeric data cells (cols 2 through totalCols-1) */
  private applyNumberFormats(row: ExcelJS.Row): void {
    for (let c = 2; c < this.totalCols; c++) {
      const cell = row.getCell(c);
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    }
  }

  // ============================================================================
  // F90 WORKSHEET
  // ============================================================================

  private async createBudgetF90Worksheet(workbook: ExcelJS.Workbook, config: ProteaBudgetPackConfig): Promise<void> {
    const sheet = workbook.addWorksheet('F90 Report', { properties: { tabColor: TAB_COLOR_REPORT } });
    sheet.columns = this.buildColumns();

    this.addSheetTitleHeader(sheet, config, 'F90 Budget Report');
    this.addColumnHeaders(sheet, config);

    const f90RowConfig = config.includeBanquetingBreakdown
      ? PROTEA_F90_PL_ROW_CONFIG_WITH_BANQUETING
      : PROTEA_F90_PL_ROW_CONFIG;

    // Fetch budget pack F90 data (totals + monthly breakdown)
    // skipFilter=true: both total and monthly must use original (un-renumbered) rowIds
    // so that the renderer can match monthly values to the correct total row.
    // filterZeroRows renumbers rowIds after removal, which breaks alignment.
    const { total: totalJson, monthly } = await db.getProteaBudgetF90PLData(
      config.startMonth, config.startYear,
      config.endMonth, config.endYear,
      config.ou, config.version,
      f90RowConfig, true
    );

    const totalData: PLCalculationResult[] = JSON.parse(totalJson);
    const monthlyData = new Map<string, PLCalculationResult[]>();
    for (const [period, json] of Object.entries(monthly)) {
      monthlyData.set(period, JSON.parse(json as string));
    }

    this.addBudgetF90DataRows(sheet, totalData, monthlyData);

    // Freeze panes (3 title rows + 2 header rows)
    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 5 }];
  }

  /** Render F90 data rows with budget pack columns */
  private addBudgetF90DataRows(
    sheet: ExcelJS.Worksheet,
    totalData: PLCalculationResult[],
    monthlyData: Map<string, PLCalculationResult[]>
  ): void {
    for (const row of totalData) {
      // Skip empty spacing rows only
      if (row.type === 'header' && !row.label) continue;

      const indent = '  '.repeat(row.indentLevel || 0);
      const isPct = row.formatting === 'percentage';

      // Slot remapping: actuals=CurBud, budget=LYBud, ly=LYAct
      const rowData: any = {
        label: indent + row.label,
        lyBud: isPct ? formatPercentage(row.budget) : formatNumber(row.budget),
        lyBudVar: formatPercentage(row.vs_bud_pct),
        lyAct: isPct ? formatPercentage(row.ly) : formatNumber(row.ly),
        lyActVar: formatPercentage(row.vs_ly_pct),
        curBud: isPct ? formatPercentage(row.actuals) : formatNumber(row.actuals),
      };

      // Monthly budget columns
      for (let i = 0; i < this.periods.length; i++) {
        const period = this.periods[i];
        const monthRows = monthlyData.get(period);
        const matchRow = monthRows?.find(r => r.rowId === row.rowId);
        rowData[`budM${i}`] = matchRow
          ? (isPct ? formatPercentage(matchRow.actuals) : formatNumber(matchRow.actuals))
          : '';
      }

      rowData.comments = '';

      const excelRow = sheet.addRow(rowData);

      // Styling
      if (row.type === 'header' && row.label) {
        const hasData = row.actuals !== null;
        excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { size: 10, bold: true };
          if (!hasData) cell.fill = CATEGORY_HEADER_FILL;
          cell.border = row.indentLevel === 0 && hasData
            ? CATEGORY_TOTAL_BORDER
            : row.indentLevel > 0 && hasData
              ? GROUP_SUBTOTAL_BORDER
              : BORDER_STYLE;
          cell.alignment = { vertical: 'middle', horizontal: colNumber > 1 ? 'right' : undefined };
        });
      } else {
        applyDataRowStyle(excelRow, false);
      }

      if (!isPct) this.applyNumberFormats(excelRow);
    }
  }

  // ============================================================================
  // ROOM SEGMENTS WORKSHEET
  // ============================================================================

  private async createBudgetRoomSegmentWorksheet(workbook: ExcelJS.Workbook, config: ProteaBudgetPackConfig): Promise<void> {
    const sheet = workbook.addWorksheet('Room Segments', { properties: { tabColor: TAB_COLOR_REPORT } });

    // Room segments add an extra "Category" column after label
    const segCols: Partial<ExcelJS.Column>[] = [
      { key: 'segment', width: 35 },
      { key: 'category', width: 15 },
      { key: 'lyBud', width: 14 },
      { key: 'lyBudVar', width: 12 },
      { key: 'lyAct', width: 14 },
      { key: 'lyActVar', width: 12 },
      { key: 'curBud', width: 14 },
    ];
    for (let i = 0; i < this.periods.length; i++) {
      segCols.push({ key: `budM${i}`, width: 12 });
    }
    segCols.push({ key: 'comments', width: 35 });
    sheet.columns = segCols;

    const segTotalCols = this.periods.length + 8; // +1 for extra category col

    this.addSheetTitleHeader(sheet, config, 'Room Segments');

    // Column headers for room segments (shifted by 1 for category column)
    const lyLabel = getRangeLabel(config.startMonth, config.startYear - 1, config.endMonth, config.endYear - 1).replace(/^[^:]+:\s*/, '');
    const curLabel = getRangeLabel(config.startMonth, config.startYear, config.endMonth, config.endYear).replace(/^[^:]+:\s*/, '');

    const groupRow = sheet.addRow(new Array(segTotalCols).fill(''));
    groupRow.getCell(3).value = `Prior Year: ${lyLabel}`;
    groupRow.getCell(7).value = `Current Budget: ${curLabel}`;
    sheet.mergeCells(groupRow.number, 3, groupRow.number, 6);
    sheet.mergeCells(groupRow.number, 7, groupRow.number, 7 + this.periods.length);
    applyHeaderStyle(groupRow);

    const subHeaders: string[] = ['Segment', 'Category', 'LY Budget', 'vs Cur %', 'LY Actuals', 'vs Cur %', 'Total'];
    for (const p of this.periods) subHeaders.push(this.periodLabel(p));
    subHeaders.push('Comments');
    const headerRow = sheet.addRow(subHeaders);
    applyHeaderStyle(headerRow);

    // Fetch data: current range for budget, LY range for LY budget + LY actuals
    const currentSegData = await db.getRoomSegmentExportData(
      config.ou,
      config.startMonth, config.startYear,
      config.endMonth, config.endYear,
      config.version
    );
    const lySegData = await db.getRoomSegmentExportData(
      config.ou,
      config.startMonth, config.startYear - 1,
      config.endMonth, config.endYear - 1,
      config.version
    );

    // Per-month current-budget values per account (single pivoted query)
    const monthlyBudgetMap = await db.getRoomSegmentBudgetByMonth(
      config.ou, this.periods, config.version
    );

    // Render sections: Revenue, Room Nights, ADR
    for (const metric of ['revenue', 'nights', 'adr'] as const) {
      const metricLabel = metric === 'revenue' ? 'Revenue' : metric === 'nights' ? 'Room Nights' : 'ADR';
      const secHeader = sheet.addRow(new Array(segTotalCols).fill(''));
      secHeader.getCell(1).value = metricLabel;
      applySectionHeaderStyle(secHeader);
      sheet.mergeCells(secHeader.number, 1, secHeader.number, segTotalCols);

      this.addBudgetRoomSegSection(sheet, currentSegData, lySegData, monthlyBudgetMap, metric, 'consolidated', segTotalCols);

      if (config.generateDetailTabs) {
        const detHeader = sheet.addRow(new Array(segTotalCols).fill(''));
        detHeader.getCell(1).value = 'Detail by Day Type';
        applySectionHeaderStyle(detHeader);
        sheet.mergeCells(detHeader.number, 1, detHeader.number, segTotalCols);
        this.addBudgetRoomSegSection(sheet, currentSegData, lySegData, monthlyBudgetMap, metric, 'detail', segTotalCols);
      }

      // Blank separator between metrics
      const blankRow = sheet.addRow(new Array(segTotalCols).fill(''));
      blankRow.eachCell((cell) => { cell.border = BORDER_STYLE; cell.font = DATA_FONT; });
    }

    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
  }

  /** Render a room segment metric section with budget pack columns */
  private addBudgetRoomSegSection(
    sheet: ExcelJS.Worksheet,
    currentData: any[],
    lyData: any[],
    monthlyBudgetMap: Map<string, number[]>,
    metric: 'revenue' | 'nights' | 'adr',
    mode: 'consolidated' | 'detail',
    segTotalCols: number
  ): void {
    const categories = mode === 'consolidated'
      ? ['Transient', 'Groups', 'Complimentary']
      : ['Sun-Thur', 'Fri-Sat', 'Groups', 'Complimentary'];

    // Fold per-account monthly values into per-segment-row buckets, matching
    // the same (category, name) grouping used by aggregateSegData below
    const monthCount = this.periods.length;
    const monthlyByKey = new Map<string, { revMonthly: number[]; nightsMonthly: number[] }>();
    for (const cfg of db.ROOM_SEGMENTS_CONFIG) {
      const name = mode === 'consolidated' ? cfg.consolidatedName : cfg.description;
      const cat = mode === 'consolidated' ? cfg.consolidatedCategory : cfg.category;
      const key = `${cat}::${name}`;
      let entry = monthlyByKey.get(key);
      if (!entry) {
        entry = { revMonthly: new Array(monthCount).fill(0), nightsMonthly: new Array(monthCount).fill(0) };
        monthlyByKey.set(key, entry);
      }
      const revArr = monthlyBudgetMap.get(cfg.revenueAccount);
      const statArr = cfg.statAccount ? monthlyBudgetMap.get(cfg.statAccount) : undefined;
      if (revArr) for (let i = 0; i < monthCount; i++) entry.revMonthly[i] += revArr[i];
      if (statArr) for (let i = 0; i < monthCount; i++) entry.nightsMonthly[i] += statArr[i];
    }

    const aggregateSegData = (data: any[]) => {
      const map = new Map<string, { name: string; category: string; revAct: number; revBud: number; nightsAct: number; nightsBud: number }>();
      for (const row of data) {
        const name = mode === 'consolidated' ? row.consolidatedName : row.description;
        const cat = mode === 'consolidated' ? row.consolidatedCategory : row.category;
        const key = `${cat}::${name}`;
        if (!map.has(key)) map.set(key, { name, category: cat, revAct: 0, revBud: 0, nightsAct: 0, nightsBud: 0 });
        const agg = map.get(key)!;
        agg.revAct += row.revenueActuals || 0;
        agg.revBud += row.revenueBudget || 0;
        agg.nightsAct += row.nightsActuals || 0;
        agg.nightsBud += row.nightsBudget || 0;
      }
      return map;
    };

    const extractMetric = (row: { revAct: number; revBud: number; nightsAct: number; nightsBud: number }, m: 'revenue' | 'nights' | 'adr') => {
      if (m === 'revenue') return { val: -row.revBud };  // budget (negated for display)
      if (m === 'nights') return { val: row.nightsBud };
      return { val: row.nightsBud !== 0 ? -row.revBud / row.nightsBud : 0 }; // ADR
    };

    const extractMetricActuals = (row: { revAct: number; revBud: number; nightsAct: number; nightsBud: number }, m: 'revenue' | 'nights' | 'adr') => {
      if (m === 'revenue') return { val: -row.revAct };
      if (m === 'nights') return { val: row.nightsAct };
      return { val: row.nightsAct !== 0 ? -row.revAct / row.nightsAct : 0 };
    };

    const curMap = aggregateSegData(currentData);
    const lyMap = aggregateSegData(lyData);
    const decimals = metric === 'adr' ? 2 : 0;

    for (const category of categories) {
      const curRows = Array.from(curMap.values()).filter(r => r.category === category);
      const lyRows = Array.from(lyMap.values()).filter(r => r.category === category);
      const segNames = new Set<string>();
      curRows.forEach(r => segNames.add(r.name));
      lyRows.forEach(r => segNames.add(r.name));
      if (segNames.size === 0) continue;

      // Category header
      const catHeader = sheet.addRow(new Array(segTotalCols).fill(''));
      catHeader.getCell(1).value = category;
      applyCategoryHeaderStyle(catHeader);
      sheet.mergeCells(catHeader.number, 1, catHeader.number, segTotalCols);

      for (const segName of segNames) {
        const curRow = curRows.find(r => r.name === segName) || { revAct: 0, revBud: 0, nightsAct: 0, nightsBud: 0 };
        const lyRow = lyRows.find(r => r.name === segName) || { revAct: 0, revBud: 0, nightsAct: 0, nightsBud: 0 };

        const curBud = extractMetric(curRow, metric).val;
        const lyBud = extractMetric(lyRow, metric).val;
        const lyAct = extractMetricActuals(lyRow, metric).val;

        const rowData: any = {
          segment: segName,
          category: category,
          lyBud: formatNumber(lyBud, decimals),
          lyBudVar: formatPercentage(pct(curBud, lyBud)),
          lyAct: formatNumber(lyAct, decimals),
          lyActVar: formatPercentage(pct(curBud, lyAct)),
          curBud: formatNumber(curBud, decimals),
          comments: '',
        };
        const monthly = monthlyByKey.get(`${category}::${segName}`);
        for (let i = 0; i < this.periods.length; i++) {
          if (!monthly) { rowData[`budM${i}`] = ''; continue; }
          if (metric === 'revenue') {
            rowData[`budM${i}`] = formatNumber(-monthly.revMonthly[i], 0);
          } else if (metric === 'nights') {
            rowData[`budM${i}`] = formatNumber(monthly.nightsMonthly[i], 0);
          } else {
            const n = monthly.nightsMonthly[i];
            const r = monthly.revMonthly[i];
            rowData[`budM${i}`] = formatNumber(n !== 0 ? -r / n : 0, 2);
          }
        }

        const excelRow = sheet.addRow(rowData);
        applyDataRowStyle(excelRow);
      }
    }
  }

  // ============================================================================
  // DEPARTMENT WORKSHEETS
  // ============================================================================

  private async createBudgetDepartmentWorksheets(
    workbook: ExcelJS.Workbook,
    config: ProteaBudgetPackConfig,
    departments: Array<{ baseDepartment: string; departmentName: string; level7Group: string | null }>,
    movedCurrent: any[],
    movedLY: any[],
    movedDeptData: Map<string, { current: any[]; ly: any[] }>,
    movedBudgetByPeriod: Map<string, Array<{ account: string; [p: string]: number }>>
  ): Promise<void> {
    // Group departments by level_7
    const groupMap = new Map<string, typeof departments>();
    for (const dept of departments) {
      let groupKey = dept.level7Group || dept.baseDepartment;
      if (config.includeBanquetingBreakdown && BANQUETING_DEPARTMENTS.has(dept.baseDepartment)) {
        groupKey = 'Total Banqueting';
      }
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey)!.push(dept);
    }

    // Sort groups per display order
    const sortedGroups = [...groupMap.entries()].sort((a, b) => {
      const idxA = PROTEA_GROUP_DISPLAY_ORDER.indexOf(a[0]);
      const idxB = PROTEA_GROUP_DISPLAY_ORDER.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });

    const usedSheetNames = new Set<string>();

    for (const [groupName, groupDepts] of sortedGroups) {
      const nonMovedDepts = groupDepts.filter(d => !MOVED_DEPT_SET.has(d.baseDepartment));
      if (nonMovedDepts.length === 0 && !MOVEMENT_TARGET_GROUPS.has(groupName)) continue;

      this.sheetRegistry.push({ type: 'groupHeader', sheetName: '', groupName, indent: false });

      // Group summary sheet
      const summaryName = await this.createBudgetGroupSummaryWorksheet(
        workbook, config, groupName, groupDepts, usedSheetNames, movedCurrent, movedLY, movedDeptData, movedBudgetByPeriod
      );
      if (summaryName) {
        this.sheetRegistry.push({ type: 'sheet', sheetName: summaryName, indent: true });
      }

      // Individual department detail sheets (if enabled)
      if (config.generateDetailTabs) {
        for (const dept of groupDepts) {
          if (MOVED_DEPT_SET.has(dept.baseDepartment)) continue;
          const deptSheetName = await this.createBudgetSingleDepartmentWorksheet(
            workbook, config, dept, usedSheetNames, undefined, movedCurrent, movedLY, movedDeptData, movedBudgetByPeriod
          );
          if (deptSheetName) {
            this.sheetRegistry.push({ type: 'sheet', sheetName: deptSheetName, indent: true });
          }
        }
      }
    }
  }

  // ============================================================================
  // GROUP SUMMARY WORKSHEET
  // ============================================================================

  private async createBudgetGroupSummaryWorksheet(
    workbook: ExcelJS.Workbook,
    config: ProteaBudgetPackConfig,
    groupName: string,
    groupDepts: Array<{ baseDepartment: string; departmentName: string; level7Group: string | null }>,
    usedSheetNames: Set<string>,
    movedCurrent: any[],
    movedLY: any[],
    movedDeptData: Map<string, { current: any[]; ly: any[] }>,
    movedBudgetByPeriod: Map<string, Array<{ account: string; [p: string]: number }>>
  ): Promise<string | null> {
    const deptIds = groupDepts.map(d => d.baseDepartment);
    let effectiveDeptIds = deptIds.filter(id => !MOVED_DEPT_SET.has(id));
    if (effectiveDeptIds.length === 0 && !MOVEMENT_TARGET_GROUPS.has(groupName)) return null;

    // Fetch current period data (budget=CurBud, ly=LYAct)
    let [currentData, lyData] = await Promise.all([
      effectiveDeptIds.length > 0
        ? db.getProteaGroupDepartmentDetailData(config.ou, effectiveDeptIds, config.startMonth, config.startYear, config.endMonth, config.endYear, config.version)
        : Promise.resolve([]),
      effectiveDeptIds.length > 0
        ? db.getProteaGroupDepartmentDetailData(config.ou, effectiveDeptIds, config.startMonth, config.startYear - 1, config.endMonth, config.endYear - 1, config.version)
        : Promise.resolve([]),
    ]);

    // Fetch per-period budget data
    let budgetByPeriod = effectiveDeptIds.length > 0
      ? await db.getProteaGroupDepartmentBudgetByPeriod(config.ou, effectiveDeptIds, this.periods, config.version)
      : [];

    // Merge moved account data for Admin & General target
    if (MOVEMENT_TARGET_GROUPS.has(groupName)) {
      const movedAccountsCur = movedCurrent.filter(r => isMovedAccount(r.account));
      const movedAccountsLY = movedLY.filter(r => isMovedAccount(r.account));
      currentData = [...currentData, ...movedAccountsCur];
      lyData = [...lyData, ...movedAccountsLY];
    }

    // Merge moved department data
    for (const mv of PROTEA_DEPARTMENT_MOVEMENTS) {
      if (mv.targetGroup === groupName) {
        const mvData = movedDeptData.get(mv.sourceDept);
        if (mvData) {
          currentData = [...currentData, ...mvData.current];
          lyData = [...lyData, ...mvData.ly];
        }
        const mvBudByPeriod = movedBudgetByPeriod.get(mv.sourceDept);
        if (mvBudByPeriod) {
          budgetByPeriod = [...budgetByPeriod, ...mvBudByPeriod];
        }
      }
    }

    currentData = aggregateDuplicateAccounts(currentData);
    lyData = aggregateDuplicateAccounts(lyData);

    if (currentData.length === 0 && lyData.length === 0) return null;

    // Create sheet
    let sheetName = sanitizeSheetName(`${proteaRenameLabel(groupName)} Summary`.toUpperCase());
    let finalName = sheetName;
    let counter = 1;
    while (usedSheetNames.has(finalName.toLowerCase())) {
      const suffix = ` (${counter})`;
      finalName = sheetName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(finalName.toLowerCase());

    const sheet = workbook.addWorksheet(finalName, { properties: { tabColor: TAB_COLOR_GROUP_SUMMARY } });
    sheet.columns = this.buildColumns();

    this.addSheetTitleHeader(sheet, config, proteaRenameLabel(groupName));
    this.addColumnHeaders(sheet, config);

    // Render data — Invest Factor Owner uses custom subgroup layout
    const isInvestGroup = groupName === 'Invest Factor Owner';
    const isRoomsGroup = groupName === 'Rooms and Reservation';
    if (isInvestGroup) {
      this.addBudgetCustomSubgroupDataSection(sheet, currentData, lyData, budgetByPeriod);
    } else {
      this.addBudgetDepartmentDataSection(sheet, currentData, lyData, budgetByPeriod, {
        collapseRevenueDetail: !config.generateDetailTabs && isRoomsGroup,
      });
    }

    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 5 }];
    return finalName;
  }

  // ============================================================================
  // SINGLE DEPARTMENT WORKSHEET
  // ============================================================================

  private async createBudgetSingleDepartmentWorksheet(
    workbook: ExcelJS.Workbook,
    config: ProteaBudgetPackConfig,
    dept: { baseDepartment: string; departmentName: string; level7Group: string | null },
    usedSheetNames: Set<string>,
    nameOverride?: string,
    movedCurrent: any[] = [],
    movedLY: any[] = [],
    movedDeptData: Map<string, { current: any[]; ly: any[] }> = new Map(),
    movedBudgetByPeriod: Map<string, Array<{ account: string; [p: string]: number }>> = new Map()
  ): Promise<string | null> {
    // Fetch data
    let [currentData, lyData] = await Promise.all([
      db.getProteaDepartmentDetailData(config.ou, dept.baseDepartment, config.startMonth, config.startYear, config.endMonth, config.endYear, config.version),
      db.getProteaDepartmentDetailData(config.ou, dept.baseDepartment, config.startMonth, config.startYear - 1, config.endMonth, config.endYear - 1, config.version),
    ]);

    let budgetByPeriod = await db.getProteaDepartmentBudgetByPeriod(config.ou, dept.baseDepartment, this.periods, config.version);

    // Apply account movements
    if (PROTEA_MOVEMENT_SOURCE_DEPTS.includes(dept.baseDepartment)) {
      currentData = currentData.filter(r => !isMovedAccount(r.account));
      lyData = lyData.filter(r => !isMovedAccount(r.account));
      budgetByPeriod = budgetByPeriod.filter(r => !isMovedAccount(r.account));
    }

    // Merge moved accounts into D0410
    if (dept.baseDepartment === 'D0410') {
      currentData = aggregateDuplicateAccounts([...currentData, ...movedCurrent]);
      lyData = aggregateDuplicateAccounts([...lyData, ...movedLY]);
      // Merge moved budget-by-period data
      for (const mvBp of movedBudgetByPeriod.values()) {
        budgetByPeriod = [...budgetByPeriod, ...mvBp.filter(r => isMovedAccount(r.account))];
      }
    }

    // Merge moved department data
    for (const mv of PROTEA_DEPARTMENT_MOVEMENTS) {
      if (mv.detailMergeTarget === dept.baseDepartment && mv.sourceDept !== dept.baseDepartment) {
        const mvData = movedDeptData.get(mv.sourceDept);
        if (mvData) {
          currentData = aggregateDuplicateAccounts([...currentData, ...mvData.current]);
          lyData = aggregateDuplicateAccounts([...lyData, ...mvData.ly]);
        }
        const mvBp = movedBudgetByPeriod.get(mv.sourceDept);
        if (mvBp) budgetByPeriod = [...budgetByPeriod, ...mvBp];
      }
    }

    if (currentData.length === 0 && lyData.length === 0) return null;

    let sheetName = sanitizeSheetName(proteaRenameLabel(nameOverride || dept.departmentName || dept.baseDepartment));
    let finalName = sheetName;
    let counter = 1;
    while (usedSheetNames.has(finalName.toLowerCase())) {
      const suffix = ` (${counter})`;
      finalName = sheetName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedSheetNames.add(finalName.toLowerCase());

    const sheet = workbook.addWorksheet(finalName, { properties: { tabColor: TAB_COLOR_DEPARTMENT } });
    sheet.columns = this.buildColumns();

    this.addSheetTitleHeader(sheet, config, proteaRenameLabel(nameOverride || dept.departmentName));
    this.addColumnHeaders(sheet, config);

    // D0490 detail with incoming movements uses custom subgroup layout
    const isInvestDetail = dept.baseDepartment === 'D0490' &&
      PROTEA_DEPARTMENT_MOVEMENTS.some(mv => mv.detailMergeTarget === dept.baseDepartment && mv.sourceDept !== dept.baseDepartment);
    if (isInvestDetail) {
      this.addBudgetCustomSubgroupDataSection(sheet, currentData, lyData, budgetByPeriod);
    } else {
      this.addBudgetDepartmentDataSection(sheet, currentData, lyData, budgetByPeriod);
    }

    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 5 }];
    return finalName;
  }

  // ============================================================================
  // DEPARTMENT DATA SECTION RENDERING (Budget Pack Column Layout)
  // ============================================================================

  private addBudgetDepartmentDataSection(
    sheet: ExcelJS.Worksheet,
    currentData: any[],   // budget=CurBud, ly=LYAct
    lyData: any[],        // budget=LYBud
    budgetByPeriod: Array<{ account: string; [p: string]: number }>,
    options?: { collapseRevenueDetail?: boolean }
  ): void {
    const tc = this.totalCols;
    const budgetMap = new Map<string, { [p: string]: number }>();
    for (const row of budgetByPeriod) {
      const existing = budgetMap.get(row.account);
      if (existing) {
        for (const p of this.periods) existing[p] = (existing[p] || 0) + (row[p] || 0);
      } else {
        const entry: any = {};
        for (const p of this.periods) entry[p] = row[p] || 0;
        budgetMap.set(row.account, entry);
      }
    }

    // Build lookup by account for LY data
    const lyMap = new Map<string, any>();
    for (const row of lyData) lyMap.set(row.account, row);

    const categories = ['Revenue', 'Cost of Sales', 'Payroll', 'Controllables', 'Other', 'Stats'];

    const sumField = (rows: any[], field: string) =>
      rows.reduce((sum: number, r: any) => sum + (Number(r[field]) || 0), 0);

    /** Add a row with aggregated totals (category or level_12 subtotal) */
    const addTotalRow = (label: string, curRows: any[], lyRows: any[], styleFn: (row: ExcelJS.Row) => void, sign: number = 1) => {
      const curBud = sumField(curRows, 'budget') * sign;
      const lyBud = sumField(lyRows, 'budget') * sign;
      const lyAct = sumField(curRows, 'ly') * sign; // ly field on current-period query = LY actuals

      const rowData: any = {
        label: label,
        lyBud: formatNumber(lyBud),
        lyBudVar: formatPercentage(pct(curBud, lyBud)),
        lyAct: formatNumber(lyAct),
        lyActVar: formatPercentage(pct(curBud, lyAct)),
        curBud: formatNumber(curBud),
        comments: '',
      };

      // Monthly totals
      const accountsInGroup = new Set(curRows.map((r: any) => r.account));
      for (let i = 0; i < this.periods.length; i++) {
        const p = this.periods[i];
        let monthTotal = 0;
        for (const acct of accountsInGroup) {
          const bpRow = budgetMap.get(acct);
          if (bpRow) monthTotal += (bpRow[p] || 0) * sign;
        }
        rowData[`budM${i}`] = formatNumber(monthTotal);
      }

      const excelRow = sheet.addRow(rowData);
      styleFn(excelRow);
      this.applyNumberFormats(excelRow);
    };

    /** Add a blank separator row */
    const addBlank = () => {
      const blankRow = sheet.addRow(new Array(tc).fill(''));
      blankRow.eachCell((cell) => { cell.border = BORDER_STYLE; cell.font = DATA_FONT; });
    };

    for (const category of categories) {
      const curCategoryRows = currentData.filter(r => r.category === category);
      const lyCategoryRows = lyData.filter(r => r.category === category);
      if (curCategoryRows.length === 0 && lyCategoryRows.length === 0) continue;

      const isStats = category === 'Stats';
      const isRevenue = category === 'Revenue';
      const sign = isRevenue ? -1 : 1;

      // When collapsing revenue detail (Rooms & Reservation without dept detail
      // tabs), skip per-account lines — the breakdown lives on Room Segments.
      if (isRevenue && options?.collapseRevenueDetail) {
        addTotalRow(`Total ${category}`, curCategoryRows, lyCategoryRows, applyCategorySubtotalStyle, sign);
        addBlank();
        continue;
      }

      if (isStats) {
        // Stats: flat render, no level_12 grouping
        for (const curRow of curCategoryRows) {
          const lyRow = lyMap.get(curRow.account) || { budget: 0 };
          const bpRow = budgetMap.get(curRow.account);
          const curBud = curRow.budget * sign;
          const lyBud = lyRow.budget * sign;
          const lyAct = curRow.ly * sign;

          const rowData: any = {
            label: `    ${curRow.accountName || curRow.account}`,
            lyBud: formatNumber(lyBud),
            lyBudVar: formatPercentage(pct(curBud, lyBud)),
            lyAct: formatNumber(lyAct),
            lyActVar: formatPercentage(pct(curBud, lyAct)),
            curBud: formatNumber(curBud),
            comments: '',
          };
          for (let i = 0; i < this.periods.length; i++) {
            const p = this.periods[i];
            rowData[`budM${i}`] = bpRow ? formatNumber((bpRow[p] || 0) * sign) : '';
          }

          const excelRow = sheet.addRow(rowData);
          applyDataRowStyle(excelRow);
          this.applyNumberFormats(excelRow);
        }
      } else {
        // Group by level_12
        const curLevel12Map = new Map<string, any[]>();
        for (const row of curCategoryRows) {
          const groupKey = row.level12Group || `Other ${category}`;
          if (!curLevel12Map.has(groupKey)) curLevel12Map.set(groupKey, []);
          curLevel12Map.get(groupKey)!.push(row);
        }
        const lyLevel12Map = new Map<string, any[]>();
        for (const row of lyCategoryRows) {
          const groupKey = row.level12Group || `Other ${category}`;
          if (!lyLevel12Map.has(groupKey)) lyLevel12Map.set(groupKey, []);
          lyLevel12Map.get(groupKey)!.push(row);
        }

        const allGroupNames: string[] = [];
        for (const key of curLevel12Map.keys()) if (!allGroupNames.includes(key)) allGroupNames.push(key);
        for (const key of lyLevel12Map.keys()) if (!allGroupNames.includes(key)) allGroupNames.push(key);

        for (const gName of allGroupNames) {
          const curGroupRows = curLevel12Map.get(gName) || [];
          const lyGroupRows = lyLevel12Map.get(gName) || [];

          // Group header
          const gHeaderRow = sheet.addRow(new Array(tc).fill(''));
          gHeaderRow.getCell(1).value = proteaRenameLabel(gName);
          applyGroupHeaderStyle(gHeaderRow);

          // Account detail rows
          const allAccounts: string[] = [];
          const curAcctMap = new Map<string, any>();
          const lyAcctMap = new Map<string, any>();
          for (const row of curGroupRows) { curAcctMap.set(row.account, row); if (!allAccounts.includes(row.account)) allAccounts.push(row.account); }
          for (const row of lyGroupRows) { lyAcctMap.set(row.account, row); if (!allAccounts.includes(row.account)) allAccounts.push(row.account); }

          for (const acct of allAccounts) {
            const curRow = curAcctMap.get(acct) || { actuals: 0, budget: 0, vsBud: 0, ly: 0, vsLy: 0, accountName: acct, account: acct };
            const lyRow = lyAcctMap.get(acct) || { budget: 0 };
            const bpRow = budgetMap.get(acct);

            const curBud = curRow.budget * sign;
            const lyBud = lyRow.budget * sign;
            const lyAct = curRow.ly * sign;
            const displayName = curRow.accountName || curRow.account;

            const rowData: any = {
              label: `    ${displayName}`,
              lyBud: formatNumber(lyBud),
              lyBudVar: formatPercentage(pct(curBud, lyBud)),
              lyAct: formatNumber(lyAct),
              lyActVar: formatPercentage(pct(curBud, lyAct)),
              curBud: formatNumber(curBud),
              comments: '',
            };
            for (let i = 0; i < this.periods.length; i++) {
              const p = this.periods[i];
              rowData[`budM${i}`] = bpRow ? formatNumber((bpRow[p] || 0) * sign) : '';
            }

            const excelRow = sheet.addRow(rowData);

            // Rich text account label
            const accountLabel = this.buildAccountLabel(displayName, curRow.account);
            if (typeof accountLabel !== 'string') {
              excelRow.getCell(1).value = { richText: [{ font: { size: 10 }, text: '    ' }, ...accountLabel.richText] };
            }

            applyDataRowStyle(excelRow);
            this.applyNumberFormats(excelRow);
          }

          // Group subtotal
          addTotalRow(`  Total ${proteaRenameLabel(gName)}`, curGroupRows, lyGroupRows, applyGroupSubtotalStyle, sign);
          addBlank();
        }
      }

      // Category total
      addTotalRow(`Total ${category}`, curCategoryRows, lyCategoryRows, applyCategorySubtotalStyle, sign);
      addBlank();
    }
  }

  // ============================================================================
  // INVEST FACTOR OWNER — CUSTOM SUBGROUP RENDERING (Budget Pack Column Layout)
  // Groups accounts by level_20 mapping table instead of category/level_12.
  // ============================================================================

  private addBudgetCustomSubgroupDataSection(
    sheet: ExcelJS.Worksheet,
    currentData: any[],
    lyData: any[],
    budgetByPeriod: Array<{ account: string; [p: string]: number }>
  ): void {
    const tc = this.totalCols;
    const budgetMap = new Map<string, { [p: string]: number }>();
    for (const row of budgetByPeriod) {
      const existing = budgetMap.get(row.account);
      if (existing) {
        for (const p of this.periods) existing[p] = (existing[p] || 0) + (row[p] || 0);
      } else {
        const entry: any = {};
        for (const p of this.periods) entry[p] = row[p] || 0;
        budgetMap.set(row.account, entry);
      }
    }

    const lyMap = new Map<string, any>();
    for (const row of lyData) lyMap.set(row.account, row);

    const sumField = (rows: any[], field: string) =>
      rows.reduce((sum: number, r: any) => sum + (Number(r[field]) || 0), 0);

    const pct = (num: number, base: number) =>
      base !== 0 ? ((num - base) / Math.abs(base)) * 100 : null;

    // Filter out stats
    currentData = currentData.filter(r => r.category !== 'Stats');
    lyData = lyData.filter(r => r.category !== 'Stats');

    // Classify accounts using level_20 mapping table
    const allRows = [...currentData, ...lyData];
    const classification = classifyAccountsByLevel20(allRows, INVEST_CUSTOM_SUBGROUPS);
    const catchAllName = INVEST_CUSTOM_SUBGROUPS.find(sg => sg.isCatchAll)?.name || 'Other';

    // Build per-subgroup data sets
    const curBySubgroup = new Map<string, any[]>();
    const lyBySubgroup = new Map<string, any[]>();
    for (const sg of INVEST_CUSTOM_SUBGROUPS) {
      curBySubgroup.set(sg.name, []);
      lyBySubgroup.set(sg.name, []);
    }
    for (const row of currentData) {
      const sg = classification.get(row.account)?.subgroup || catchAllName;
      curBySubgroup.get(sg)?.push(row);
    }
    for (const row of lyData) {
      const sg = classification.get(row.account)?.subgroup || catchAllName;
      lyBySubgroup.get(sg)?.push(row);
    }

    /** Add a row with aggregated totals */
    const addTotalRow = (label: string, curRows: any[], lyRows: any[], styleFn: (row: ExcelJS.Row) => void) => {
      const curBud = sumField(curRows, 'budget');
      const lyBud = sumField(lyRows, 'budget');
      const lyAct = sumField(curRows, 'ly');

      const rowData: any = {
        label: label,
        lyBud: formatNumber(lyBud),
        lyBudVar: formatPercentage(pct(curBud, lyBud)),
        lyAct: formatNumber(lyAct),
        lyActVar: formatPercentage(pct(curBud, lyAct)),
        curBud: formatNumber(curBud),
        comments: '',
      };

      const accountsInGroup = new Set(curRows.map((r: any) => r.account));
      for (let i = 0; i < this.periods.length; i++) {
        const p = this.periods[i];
        let monthTotal = 0;
        for (const acct of accountsInGroup) {
          const bpRow = budgetMap.get(acct);
          if (bpRow) monthTotal += bpRow[p] || 0;
        }
        rowData[`budM${i}`] = formatNumber(monthTotal);
      }

      const excelRow = sheet.addRow(rowData);
      styleFn(excelRow);
      this.applyNumberFormats(excelRow);
    };

    const addBlank = () => {
      const blankRow = sheet.addRow(new Array(tc).fill(''));
      blankRow.eachCell((cell) => { cell.border = BORDER_STYLE; cell.font = DATA_FONT; });
    };

    // Render each subgroup in config order
    for (const sg of INVEST_CUSTOM_SUBGROUPS) {
      const curRows = curBySubgroup.get(sg.name) || [];
      const lyRows = lyBySubgroup.get(sg.name) || [];
      if (curRows.length === 0 && lyRows.length === 0) continue;

      // Subgroup header
      const gHeaderRow = sheet.addRow(new Array(tc).fill(''));
      gHeaderRow.getCell(1).value = proteaRenameLabel(sg.name);
      applyGroupHeaderStyle(gHeaderRow);

      // Account detail rows
      const allAccounts: string[] = [];
      const curAcctMap = new Map<string, any>();
      const lyAcctMap = new Map<string, any>();
      for (const row of curRows) { curAcctMap.set(row.account, row); if (!allAccounts.includes(row.account)) allAccounts.push(row.account); }
      for (const row of lyRows) { lyAcctMap.set(row.account, row); if (!allAccounts.includes(row.account)) allAccounts.push(row.account); }

      for (const acct of allAccounts) {
        const curRow = curAcctMap.get(acct) || { actuals: 0, budget: 0, vsBud: 0, ly: 0, vsLy: 0, accountName: acct, account: acct };
        const lyRow = lyAcctMap.get(acct) || { budget: 0 };
        const bpRow = budgetMap.get(acct);

        const curBud = curRow.budget;
        const lyBud = lyRow.budget;
        const lyAct = curRow.ly;
        const displayName = curRow.accountName || curRow.account;

        const rowData: any = {
          label: `    ${displayName}`,
          lyBud: formatNumber(lyBud),
          lyBudVar: formatPercentage(pct(curBud, lyBud)),
          lyAct: formatNumber(lyAct),
          lyActVar: formatPercentage(pct(curBud, lyAct)),
          curBud: formatNumber(curBud),
          comments: '',
        };
        for (let i = 0; i < this.periods.length; i++) {
          const p = this.periods[i];
          rowData[`budM${i}`] = bpRow ? formatNumber(bpRow[p] || 0) : '';
        }

        const excelRow = sheet.addRow(rowData);

        // Rich text account label
        const accountLabel = this.buildAccountLabel(displayName, curRow.account);
        if (typeof accountLabel !== 'string') {
          excelRow.getCell(1).value = { richText: [{ font: { size: 10 }, text: '    ' }, ...accountLabel.richText] };
        }

        applyDataRowStyle(excelRow);

        // Highlight unmapped accounts
        const acctClassification = classification.get(acct);
        if (acctClassification?.isUnmapped) {
          excelRow.getCell(1).font = { ...DATA_FONT, italic: true, color: { argb: 'FFCC6600' } };
        }

        this.applyNumberFormats(excelRow);
      }

      // Subgroup subtotal
      addTotalRow(`  Total ${proteaRenameLabel(sg.name)}`, curRows, lyRows, applyGroupSubtotalStyle);
      addBlank();
    }
  }

  // ============================================================================
  // COVER PAGE
  // ============================================================================

  private createBudgetCoverPageWorksheet(workbook: ExcelJS.Workbook, config: ProteaBudgetPackConfig): void {
    const sheet = workbook.addWorksheet('Contents');
    (sheet as any).orderNo = 0;

    sheet.columns = [{ key: 'label', width: 55 }];

    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = config.hotelName;
    titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: 'FF1E3A5F' } };
    titleRow.height = 30;

    const reportRow = sheet.getRow(2);
    reportRow.getCell(1).value = 'Protea Budget Pack';
    reportRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF4A4A4A' } };

    const rangeRow = sheet.getRow(3);
    rangeRow.getCell(1).value = `Budget Period: ${MONTH_NAMES[config.startMonth - 1]} ${config.startYear} - ${MONTH_NAMES[config.endMonth - 1]} ${config.endYear}`;
    rangeRow.getCell(1).font = { size: 11, color: { argb: 'FF666666' } };

    const versionRow = sheet.getRow(4);
    versionRow.getCell(1).value = `Version: ${config.version}`;
    versionRow.getCell(1).font = { size: 11, color: { argb: 'FF666666' } };

    const tocHeader = sheet.getRow(6);
    tocHeader.getCell(1).value = 'Table of Contents';
    tocHeader.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1E3A5F' } };
    tocHeader.getCell(1).border = { bottom: { style: 'medium', color: { argb: 'FF1E3A5F' } } };

    let currentRow = 8;
    for (const entry of this.sheetRegistry) {
      const row = sheet.getRow(currentRow);
      if (entry.type === 'groupHeader') {
        row.getCell(1).value = proteaRenameLabel(entry.groupName || '').toUpperCase();
        row.getCell(1).font = { bold: true, size: 11, color: { argb: 'FF1E3A5F' } };
        row.height = 22;
      } else {
        const indent = entry.indent ? '    ' : '';
        row.getCell(1).value = { text: `${indent}${entry.sheetName}`, hyperlink: `#'${entry.sheetName}'!A1` } as any;
        row.getCell(1).font = { size: 10, color: { argb: 'FF0563C1' }, underline: true };
      }
      currentRow++;
    }
  }

  // ============================================================================
  // MAIN ENTRY POINT
  // ============================================================================

  async generateReport(config: ProteaBudgetPackConfig, savePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PS Loader';
    workbook.created = new Date();
    workbook.modified = new Date();

    await db.autoCleanStagingIfImported();

    this.sheetRegistry = [];
    this.periods = generatePeriodsSync(config.startMonth, config.startYear, config.endMonth, config.endYear);
    this.lyPeriods = this.periods.map(offsetPeriodMinusYear);

    const now = new Date();
    this.generatedAt = now.toLocaleString('en-ZA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    // Build AccPac description lookup
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

    // 1. F90 Report
    await this.createBudgetF90Worksheet(workbook, config);
    this.sheetRegistry.push({ type: 'sheet', sheetName: 'F90 Report', indent: false });

    // 2. Room Segments
    await this.createBudgetRoomSegmentWorksheet(workbook, config);
    this.sheetRegistry.push({ type: 'sheet', sheetName: 'Room Segments', indent: false });

    // 3. Departments
    const departments = (await db.getDepartmentsWithDataForOU(config.ou, config.version))
      .filter(d => !EXCEL_EXCLUDED_DEPARTMENTS.has(d.baseDepartment));

    // Pre-fetch moved account data (current + LY periods)
    const [movedAccountsCurrent, movedAccountsLY] = await Promise.all([
      db.getProteaGroupDepartmentDetailData(config.ou, PROTEA_MOVEMENT_SOURCE_DEPTS, config.startMonth, config.startYear, config.endMonth, config.endYear, config.version),
      db.getProteaGroupDepartmentDetailData(config.ou, PROTEA_MOVEMENT_SOURCE_DEPTS, config.startMonth, config.startYear - 1, config.endMonth, config.endYear - 1, config.version),
    ]);
    const movedCurrent = movedAccountsCurrent.filter(r => isMovedAccount(r.account));
    const movedLY = movedAccountsLY.filter(r => isMovedAccount(r.account));

    // Pre-fetch moved department data
    const movedDeptData = new Map<string, { current: any[]; ly: any[] }>();
    const movedBudgetByPeriod = new Map<string, Array<{ account: string; [p: string]: number }>>();
    await Promise.all(PROTEA_DEPARTMENT_MOVEMENTS.map(async (mv) => {
      const [current, ly, budByPeriod] = await Promise.all([
        db.getProteaDepartmentDetailData(config.ou, mv.sourceDept, config.startMonth, config.startYear, config.endMonth, config.endYear, config.version),
        db.getProteaDepartmentDetailData(config.ou, mv.sourceDept, config.startMonth, config.startYear - 1, config.endMonth, config.endYear - 1, config.version),
        db.getProteaDepartmentBudgetByPeriod(config.ou, mv.sourceDept, this.periods, config.version),
      ]);
      movedDeptData.set(mv.sourceDept, {
        current: current.filter(r => !isMovedAccount(r.account)),
        ly: ly.filter(r => !isMovedAccount(r.account)),
      });
      movedBudgetByPeriod.set(mv.sourceDept, budByPeriod.filter(r => !isMovedAccount(r.account)));
    }));

    // 4. Department worksheets
    await this.createBudgetDepartmentWorksheets(workbook, config, departments, movedCurrent, movedLY, movedDeptData, movedBudgetByPeriod);

    // 5. Cover page (built last, positioned first)
    this.createBudgetCoverPageWorksheet(workbook, config);

    await workbook.xlsx.writeFile(savePath);
  }
}

// Singleton export
const proteaBudgetPackService = new ProteaBudgetPackService();
export default proteaBudgetPackService;
