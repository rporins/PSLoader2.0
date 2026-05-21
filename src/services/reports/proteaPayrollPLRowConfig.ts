/**
 * Protea Payroll Tab — row configuration
 *
 * Built programmatically off PAYROLL_DEPTS and PAYROLL_BURDEN_LINES so adding
 * a department or burden line is a one-line edit to proteaPayrollMeasures.ts.
 *
 * Sign convention:
 *   Payroll sub-measures (Associate Wages, A631208, burden accounts) have
 *   NO negate:true in the calculation engine, so the engine returns the raw
 *   stored amount. Expense accounts are stored as positive debits in this
 *   codebase (verified by payroll_pct_rooms_sales_protea returning a
 *   positive percentage of revenue without inversion), so we leave
 *   invertSign off on every row here. Same convention applies to the
 *   headcount accounts (A972540, A988111), which are positive stats.
 */

import { PLRow } from '../../types/plReportTypes';
import {
  PAYROLL_DEPTS,
  PAYROLL_BURDEN_LINES,
} from './proteaPayrollMeasures';

// ----------------------------------------------------------------------------
// Helpers — keep the config compact and let juniors slot rows in by editing
// the source-of-truth tables in proteaPayrollMeasures.ts, not this file.
// ----------------------------------------------------------------------------

const blank: PLRow = { type: 'header', label: '', indentLevel: 0 };
const sectionTitle = (label: string): PLRow =>
  ({ type: 'header', label, indentLevel: 0 });
const subHeader = (label: string): PLRow =>
  ({ type: 'header', label, indentLevel: 0 });
const total = (label: string, measureId: string): PLRow =>
  ({ type: 'header', label, measureId, formatting: 'number', indentLevel: 0 });

const deptRows = (suffix: 'assoc_wages' | 'contracts' | 'assoc_count' | 'contract_count'): PLRow[] =>
  PAYROLL_DEPTS.map(d => ({
    type: 'measure',
    label: d.label,
    measureId: `payroll_${d.key}_${suffix}`,
    formatting: 'number',
    indentLevel: 1,
  }));

const deptStaffSummaryRows = (): PLRow[] =>
  PAYROLL_DEPTS.map(d => ({
    type: 'measure',
    label: d.label,
    measureId: `payroll_${d.key}_staff_summary`,
    formatting: 'number',
    indentLevel: 1,
  }));

const burdenLineRows = (): PLRow[] =>
  PAYROLL_BURDEN_LINES.map(line => ({
    type: 'measure',
    label: line.label,
    measureId: `payroll_burden_${line.key}`,
    formatting: 'number',
    indentLevel: 1,
  }));

// ----------------------------------------------------------------------------
// Row config
// ----------------------------------------------------------------------------

export const PROTEA_PAYROLL_PL_ROW_CONFIG: PLRow[] = [
  // ===== SALARIES =====
  sectionTitle('SALARIES'),
  blank,

  subHeader('Perm. & Fixed Term'),
  ...deptRows('assoc_wages'),
  total('Total Perm. & Fixed Term', 'payroll_lodging_assoc_wages'),
  blank,

  subHeader('Contracts'),
  ...deptRows('contracts'),
  total('Total Contracts', 'payroll_lodging_contracts'),
  blank,

  total('Total Salaries/Casuals/Incentives', 'payroll_lodging_salaries_total'),
  blank,

  // ===== PAYROLL BURDEN =====
  subHeader('PAYROLL BURDEN'),
  ...burdenLineRows(),
  { type: 'measure', label: 'Other', measureId: 'payroll_other_burden', formatting: 'number', indentLevel: 1 },
  total('Total Payroll Burden', 'payroll_total_burden'),
  blank,

  // ===== STAFF EXPENSES SUMMARY (Salaries + Payroll Burden + Contracts) =====
  // Per-dept rows = Total Payroll (level_9) + 3 NOT BENEFITS (repointed)
  // + A631208 Contracts. Contracts sit outside the payroll hierarchy in
  // source data, so the section title and total label call them out.
  sectionTitle('STAFF EXPENSES SUMMARY (Salaries + Payroll Burden + Contracts)'),
  blank,
  subHeader('Salaries'),
  ...deptStaffSummaryRows(),
  blank,
  total('Total Staff Expenses (incl. Contracts)', 'payroll_lodging_staff_summary'),
  blank,

  // ===== EMPLOYEE NUMBERS =====
  sectionTitle('EMPLOYEE NUMBERS INCLUDING CONTRACTS'),
  blank,

  subHeader('Perm. & Fixed Term'),
  ...deptRows('assoc_count'),
  total('Total Perm. & Fixed Term Employees', 'payroll_lodging_assoc_count'),
  blank,

  subHeader('Casuals'),
  ...deptRows('contract_count'),
  total('Total Contracts Employees', 'payroll_lodging_contract_count'),

  total('Total STAFF', 'payroll_lodging_total_staff'),
];
