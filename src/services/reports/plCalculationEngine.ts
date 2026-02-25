import {
  PeriodRange,
  PLCalculationResult,
  BaseQueryResult,
  QueryBuildResult,
  ScenarioType,
  MeasureFilter,
  MeasureContext
} from '../../types/plReportTypes';
import { SUB_MEASURES, MEASURES } from './plMeasureDefinitions';
import { PL_ROW_CONFIG } from './plRowConfig';
import { SUMMARY_PL_ROW_CONFIG } from './summaryPLRowConfig';
import { F90_PL_ROW_CONFIG } from './f90PLRowConfig';

// ============================================================================
// CALCULATION ENGINE FOR CUSTOM P&L REPORT
// Orchestrates SQL query generation, data fetching, and measure evaluation
// ============================================================================

export function generatePeriods(range: PeriodRange): string[] {
  const periods: string[] = [];
  let year = range.startYear;
  let month = range.startMonth;

  while (true) {
    periods.push(`${year}-${String(month).padStart(2, '0')}`);

    if (year === range.endYear && month === range.endMonth) {
      break;
    }

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }

    if (periods.length > 24) {
      throw new Error('Period range exceeds 24 months');
    }
  }

  return periods;
}

export function generateLYPeriods(periods: string[]): string[] {
  return periods.map(period => {
    const [year, month] = period.split('-');
    const lyYear = parseInt(year) - 1;
    return `${lyYear}-${month}`;
  });
}

// ============================================================================
// SQL QUERY BUILDER
// Constructs optimized queries with conditional aggregations
// ============================================================================

function buildFilterCondition(filter: MeasureFilter): string {
  const { type, level, value } = filter;

  if (type === 'dept_level') {
    const column = `dm.level_${level}`;
    if (Array.isArray(value)) {
      return `${column} IN (${value.map(() => '?').join(', ')})`;
    }
    return `${column} = ?`;
  }

  if (type === 'dept_base') {
    if (Array.isArray(value)) {
      return `dm.base_department IN (${value.map(() => '?').join(', ')})`;
    }
    return `dm.base_department = ?`;
  }

  if (type === 'acc_level') {
    const column = `am.level_${level}`;
    if (Array.isArray(value)) {
      return `${column} IN (${value.map(() => '?').join(', ')})`;
    }
    return `${column} = ?`;
  }

  if (type === 'acc_base') {
    if (Array.isArray(value)) {
      return `am.base_account IN (${value.map(() => '?').join(', ')})`;
    }
    return `am.base_account = ?`;
  }

  return '1=1';
}

function getFilterValues(filter: MeasureFilter): any[] {
  if (Array.isArray(filter.value)) {
    return filter.value;
  }
  return [filter.value];
}

export function buildScenarioQuery(
  scenario: ScenarioType,
  periods: string[],
  ou?: string,
  version: string = 'MAIN'
): QueryBuildResult {
  const subMeasureIds = Object.keys(SUB_MEASURES);
  const params: any[] = [];

  // Build SELECT clauses and collect filter params separately
  const filterParams: any[] = [];
  const selectClauses: string[] = subMeasureIds.map(subMeasureId => {
    const subMeasure = SUB_MEASURES[subMeasureId];
    const conditions = subMeasure.filters.map(filter => buildFilterCondition(filter));
    const whereClause = conditions.join(' AND ');

    subMeasure.filters.forEach(filter => {
      filterParams.push(...getFilterValues(filter));
    });

    const multiplier = subMeasure.negate ? '-1' : '1';

    return `SUM(CASE WHEN ${whereClause} THEN cd.amount * ${multiplier} ELSE 0 END) AS ${subMeasureId}`;
  });

  // Push params in the order they appear in the SQL
  const latestStagingPeriod = periods[periods.length - 1];
  params.push(latestStagingPeriod);
  params.push(version);

  periods.forEach(p => params.push(p));
  if (ou) {
    params.push(ou);
  }

  periods.forEach(p => params.push(p));
  if (ou) {
    params.push(ou);
  }

  // Now add all the filter params for the CASE WHEN clauses
  params.push(...filterParams);

  const sql = `
    WITH combined_data AS (
      SELECT
        COALESCE(fds.dep_acc_combo_id, fd.dep_acc_combo_id) AS combo,
        COALESCE(fds.department, fd.department) AS department,
        COALESCE(fds.account, fd.account) AS account,
        COALESCE(fds.amount, fd.amount) AS amount,
        COALESCE(fds.period_combo, fd.period_combo) AS period_combo
      FROM financial_data fd
      LEFT JOIN financial_data_staging fds
        ON fd.dep_acc_combo_id = fds.dep_acc_combo_id
        AND fds.period_combo = ?
        AND fds.scenario = '${scenario}'
      WHERE fd.scenario = '${scenario}'
        AND fd.version = ?
        AND fd.period_combo IN (${periods.map(() => '?').join(', ')})
        ${ou ? 'AND fd.ou = ?' : ''}

      UNION ALL

      SELECT
        fds.dep_acc_combo_id AS combo,
        fds.department,
        fds.account,
        fds.amount,
        fds.period_combo
      FROM financial_data_staging fds
      WHERE fds.scenario = '${scenario}'
        AND fds.period_combo IN (${periods.map(() => '?').join(', ')})
        ${ou ? 'AND fds.ou = ?' : ''}
        AND NOT EXISTS (
          SELECT 1 FROM financial_data fd2
          WHERE fd2.dep_acc_combo_id = fds.dep_acc_combo_id
            AND fd2.period_combo = fds.period_combo
            AND fd2.scenario = '${scenario}'
        )
    )
    SELECT
      ${selectClauses.join(',\n      ')}
    FROM combined_data cd
    LEFT JOIN department_maps dm ON cd.department = dm.base_department
    LEFT JOIN account_maps am ON cd.account = am.base_account
  `;

  return { sql, params };
}

// ============================================================================
// MEASURE EVALUATION
// Calculates final measures from base query results
// ============================================================================

function evaluateSubMeasures(queryResult: BaseQueryResult): Record<string, number> {
  const result: Record<string, number> = {};

  Object.keys(SUB_MEASURES).forEach(subMeasureId => {
    result[subMeasureId] = queryResult[subMeasureId] || 0;
  });

  return result;
}

function evaluateMeasure(
  measureId: string,
  subMeasures: Record<string, number>,
  scenario: ScenarioType
): number {
  const measure = MEASURES[measureId];
  if (!measure) return 0;

  const context: MeasureContext = { subMeasures, scenario };

  if (measure.type === 'simple') {
    const subMeasureId = measure.subMeasures?.[0];
    return subMeasureId ? (subMeasures[subMeasureId] || 0) : 0;
  }

  if (measure.type === 'calculated' && measure.evaluator) {
    return measure.evaluator(context);
  }

  return 0;
}

// ============================================================================
// VARIANCE CALCULATIONS
// ============================================================================

function calculateVariance(actual: number, comparison: number): number {
  return actual - comparison;
}

function calculateVariancePercent(actual: number, comparison: number): number {
  if (comparison === 0) return 0;
  return ((actual - comparison) / Math.abs(comparison)) * 100;
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// Exported for use by database query handler
// ============================================================================

export function calculatePLRows(
  actualsData: BaseQueryResult,
  budgetData: BaseQueryResult,
  lyData: BaseQueryResult
): PLCalculationResult[] {
  const actualsSubMeasures = evaluateSubMeasures(actualsData);
  const budgetSubMeasures = evaluateSubMeasures(budgetData);
  const lySubMeasures = evaluateSubMeasures(lyData);

  const results: PLCalculationResult[] = [];
  let rowId = 1;

  PL_ROW_CONFIG.forEach(rowConfig => {
    if (rowConfig.type === 'header') {
      results.push({
        rowId: rowId++,
        type: 'header',
        label: rowConfig.label,
        indentLevel: rowConfig.indentLevel || 0,
        actuals: null,
        budget: null,
        vs_bud: null,
        vs_bud_pct: null,
        ly: null,
        vs_ly: null,
        vs_ly_pct: null,
        formatting: 'number'
      });
      return;
    }

    const measureId = rowConfig.measureId;
    if (!measureId) return;

    const actuals = evaluateMeasure(measureId, actualsSubMeasures, 'ACT');
    const budget = evaluateMeasure(measureId, budgetSubMeasures, 'BUD');
    const ly = evaluateMeasure(measureId, lySubMeasures, 'PY1');

    const vs_bud = calculateVariance(actuals, budget);
    const vs_bud_pct = calculateVariancePercent(actuals, budget);
    const vs_ly = calculateVariance(actuals, ly);
    const vs_ly_pct = calculateVariancePercent(actuals, ly);

    results.push({
      rowId: rowId++,
      type: 'measure',
      label: rowConfig.label,
      indentLevel: rowConfig.indentLevel || 0,
      actuals,
      budget,
      vs_bud,
      vs_bud_pct,
      ly,
      vs_ly,
      vs_ly_pct,
      formatting: rowConfig.formatting || 'number'
    });
  });

  return results;
}

// ============================================================================
// CALCULATE SUMMARY P&L ROWS
// Uses the SUMMARY_PL_ROW_CONFIG instead of PL_ROW_CONFIG
// ============================================================================

export function calculateSummaryPLRows(
  actualsData: BaseQueryResult,
  budgetData: BaseQueryResult,
  lyData: BaseQueryResult
): PLCalculationResult[] {
  const actualsSubMeasures = evaluateSubMeasures(actualsData);
  const budgetSubMeasures = evaluateSubMeasures(budgetData);
  const lySubMeasures = evaluateSubMeasures(lyData);

  const results: PLCalculationResult[] = [];
  let rowId = 1;

  SUMMARY_PL_ROW_CONFIG.forEach(rowConfig => {
    const measureId = rowConfig.measureId;

    // If no measureId, it's a spacing row - add it with null values
    if (!measureId) {
      results.push({
        rowId: rowId++,
        type: rowConfig.type,
        label: rowConfig.label,
        indentLevel: rowConfig.indentLevel || 0,
        actuals: null,
        budget: null,
        vs_bud: null,
        vs_bud_pct: null,
        ly: null,
        vs_ly: null,
        vs_ly_pct: null,
        formatting: rowConfig.formatting || 'number'
      });
      return;
    }

    // Has measureId - calculate values regardless of type (header or measure)
    // Note: unlike F90, data values are NOT sign-flipped here — expense
    // sub-measures carry no negate flag and are already positive debits.
    // invertSign on a row signals variance-colour inversion only (set via
    // invertVariance on the result so the UI can colour accordingly).
    const actuals = evaluateMeasure(measureId, actualsSubMeasures, 'ACT');
    const budget = evaluateMeasure(measureId, budgetSubMeasures, 'BUD');
    const ly = evaluateMeasure(measureId, lySubMeasures, 'PY1');

    const vs_bud = calculateVariance(actuals, budget);
    const vs_bud_pct = calculateVariancePercent(actuals, budget);
    const vs_ly = calculateVariance(actuals, ly);
    const vs_ly_pct = calculateVariancePercent(actuals, ly);

    results.push({
      rowId: rowId++,
      type: rowConfig.type,
      label: rowConfig.label,
      indentLevel: rowConfig.indentLevel || 0,
      actuals,
      budget,
      vs_bud,
      vs_bud_pct,
      ly,
      vs_ly,
      vs_ly_pct,
      formatting: rowConfig.formatting || 'number',
      invertVariance: !!rowConfig.invertSign
    });
  });

  return results;
}

// ============================================================================
// CALCULATE F90 P&L ROWS
// Uses the F90_PL_ROW_CONFIG instead of PL_ROW_CONFIG
// ============================================================================

export function calculateF90PLRows(
  actualsData: BaseQueryResult,
  budgetData: BaseQueryResult,
  lyData: BaseQueryResult
): PLCalculationResult[] {
  const actualsSubMeasures = evaluateSubMeasures(actualsData);
  const budgetSubMeasures = evaluateSubMeasures(budgetData);
  const lySubMeasures = evaluateSubMeasures(lyData);

  const results: PLCalculationResult[] = [];
  let rowId = 1;

  F90_PL_ROW_CONFIG.forEach(rowConfig => {
    const measureId = rowConfig.measureId;

    // If no measureId, it's a spacing row - add it with null values
    if (!measureId) {
      results.push({
        rowId: rowId++,
        type: rowConfig.type,
        label: rowConfig.label,
        indentLevel: rowConfig.indentLevel || 0,
        actuals: null,
        budget: null,
        vs_bud: null,
        vs_bud_pct: null,
        ly: null,
        vs_ly: null,
        vs_ly_pct: null,
        formatting: rowConfig.formatting || 'number'
      });
      return;
    }

    // Has measureId - calculate values regardless of type (header or measure)
    // Apply sign inversion for revenue (credits) and expense (debits) lines
    const sign = rowConfig.invertSign ? -1 : 1;
    const actuals = evaluateMeasure(measureId, actualsSubMeasures, 'ACT') * sign;
    const budget = evaluateMeasure(measureId, budgetSubMeasures, 'BUD') * sign;
    const ly = evaluateMeasure(measureId, lySubMeasures, 'PY1') * sign;

    const vs_bud = calculateVariance(actuals, budget);
    const vs_bud_pct = calculateVariancePercent(actuals, budget);
    const vs_ly = calculateVariance(actuals, ly);
    const vs_ly_pct = calculateVariancePercent(actuals, ly);

    results.push({
      rowId: rowId++,
      type: rowConfig.type,
      label: rowConfig.label,
      indentLevel: rowConfig.indentLevel || 0,
      actuals,
      budget,
      vs_bud,
      vs_bud_pct,
      ly,
      vs_ly,
      vs_ly_pct,
      formatting: rowConfig.formatting || 'number',
      invertVariance: !!rowConfig.invertSign
    });
  });

  return results;
}
