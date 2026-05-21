/**
 * Protea Payroll Tab — measure registry
 *
 * Programmatically generates the sub-measures + measures consumed by the
 * Payroll worksheet (proteaPayrollPLRowConfig.ts).
 *
 * Naming convention (search-friendly):
 *   payroll_<dept>_assoc_wages_act     ← sub-measure: dept × level_12 Associate Wages
 *   payroll_<dept>_contracts_act       ← sub-measure: dept × base_account A631208
 *   payroll_<dept>_assoc_count_act     ← sub-measure: dept × A972540 (perm headcount)
 *   payroll_<dept>_contract_count_act  ← sub-measure: dept × A988111 (contract headcount)
 *   payroll_<dept>_<x>                 ← simple measure wrapping the _act sub-measure
 *
 * Lodging-Operations-scope sub-measures are keyed with dept='lodging'.
 *
 * Reuses existing per-department `total_<key>_payroll_protea` measures where
 * they exist (rooms, fb registered manually in plMeasureDefinitions.ts;
 * ag, pom, sm registered via registerPctOfRevenueQuartet there). Adds the
 * missing departments (other_ops, util, it) and Lodging Operations.
 *
 * The "NOT BENEFITS ACCOUNT" repointed accounts (A610112, A652101, A632007)
 * are sourced via PROTEA_PAYROLL_REPOINT_ACCOUNTS so adding/removing a
 * repoint in proteaMovements.ts cascades through automatically — DO NOT
 * hardcode this list anywhere in this file.
 */

import { SubMeasure, Measure, MeasureContext } from '../../types/plReportTypes';
import { PROTEA_PAYROLL_REPOINT_ACCOUNTS } from './proteaMovements';

// ----------------------------------------------------------------------------
// Department config — single source of truth for every per-dept row
// ----------------------------------------------------------------------------

export interface PayrollDept {
  /** stable measure-id key */
  key: string;
  /** display label for the row */
  label: string;
  /** level_7 value matching account_maps */
  level7: string;
}

export const PAYROLL_DEPTS: readonly PayrollDept[] = [
  { key: 'rooms',    label: 'Rooms',                    level7: 'Rooms and Reservation' },
  { key: 'fb',       label: 'Food & Beverage',          level7: 'Total Food & Beverage' },
  { key: 'ag',       label: 'Administration & General', level7: 'Administrative & General' },
  { key: 'mkt',      label: 'Marketing',                level7: 'Sales & Marketing and Convention Service' },
  { key: 'pom',      label: 'Repairs & Maintenance',    level7: 'Property Operation & Maintenance' },
  { key: 'other_ops',label: 'Other Operated',           level7: 'Other Operated Departments' },
  { key: 'util',     label: 'Utilities',                level7: 'Utilities Dept' },
  { key: 'it',       label: 'IT',                       level7: 'Information & Telecom Systems' },
] as const;

export const LODGING_LEVEL2 = 'Lodging Operations';

/**
 * Per-department key → existing `total_<key>_payroll_protea` measure id.
 * Used by the STAFF EXPENSES SUMMARY 'Salaries' rows.
 *
 * 'rooms' and 'fb' are registered manually in plMeasureDefinitions.ts.
 * 'ag', 'pom', 'sm' are registered there via registerPctOfRevenueQuartet —
 * note 'mkt' in this file maps to 'sm' there (Sales & Marketing).
 * 'other_ops', 'util', 'it' are registered below in this file.
 */
export const PROTEA_PAYROLL_DEPT_TO_PROTEA_MEASURE: Record<string, string> = {
  rooms:     'total_rooms_payroll_protea',
  fb:        'total_fb_payroll_protea',
  ag:        'total_ag_payroll_protea',
  mkt:       'total_sm_payroll_protea',
  pom:       'total_pom_payroll_protea',
  other_ops: 'total_other_ops_payroll_protea',
  util:      'total_util_payroll_protea',
  it:        'total_it_payroll_protea',
};

// ----------------------------------------------------------------------------
// Payroll Burden line items (15 rows) — Lodging Operations scope.
//
// Order matches the spec. Each `assoc_benefits=true` row contributes to the
// canonical level_12 Associate Benefits aggregate; `assoc_benefits=false`
// rows are the 3 NOT BENEFITS accounts (repointed via proteaMovements.ts).
// ----------------------------------------------------------------------------

export interface BurdenLine {
  key: string;
  label: string;
  account: string;
  /** true = sits inside level_12 Associate Benefits; false = NOT BENEFITS (repointed) */
  assocBenefit: boolean;
}

export const PAYROLL_BURDEN_LINES: readonly BurdenLine[] = [
  { key: 'bonus_other',       label: 'Bonus - Other',                  account: 'A580104', assocBenefit: true  },
  { key: 'bonus_xmas',        label: 'Bonus - Xmas',                   account: 'A580111', assocBenefit: true  },
  { key: 'coida',             label: 'COIDA',                          account: 'A560338', assocBenefit: true  },
  { key: 'ir_consult',        label: 'I.R. Consultation',              account: 'A580101', assocBenefit: true  },
  { key: 'leave_pay',         label: 'Leave Pay Provision',            account: 'A560303', assocBenefit: true  },
  { key: 'medical_aid',       label: 'Medical Aid',                    account: 'A560897', assocBenefit: true  },
  { key: 'provident',         label: 'Provident / Pension Fund',       account: 'A560372', assocBenefit: true  },
  { key: 'eti_rebate',        label: 'Rebate - Employee Tax Incentive',account: 'A560322', assocBenefit: true  },
  { key: 'skills_levy',       label: 'Skills Levy - Expense',          account: 'A560370', assocBenefit: true  },
  { key: 'staff_meals',       label: 'STAFF Meals',                    account: 'A569001', assocBenefit: true  },
  { key: 'staff_training',    label: 'STAFF Training - Mandatory',     account: 'A652101', assocBenefit: false },
  { key: 'staff_transport',   label: 'STAFF Transport',                account: 'A632007', assocBenefit: false },
  { key: 'sundry',            label: 'Sundry',                         account: 'A560314', assocBenefit: true  },
  { key: 'uif',               label: 'U.I.F.',                         account: 'A560324', assocBenefit: true  },
  { key: 'uniforms_usage',    label: 'Uniforms - Usage',               account: 'A610112', assocBenefit: false },
] as const;

// ----------------------------------------------------------------------------
// Builders
// ----------------------------------------------------------------------------

const SUB: Record<string, SubMeasure> = {};
const MEA: Record<string, Measure> = {};

/** Per-department sub-measure: dept_level=7 + acc_base=accountList. */
function addDeptAccountSub(id: string, level7: string, account: string | string[]): void {
  SUB[id] = {
    id,
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: level7 },
      { type: 'acc_base', value: account },
    ],
  };
}

/** Per-department sub-measure: dept_level=7 + acc_level=12 Associate Wages. */
function addDeptAssocWagesSub(id: string, level7: string): void {
  SUB[id] = {
    id,
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: level7 },
      { type: 'acc_level', level: 12, value: 'Associate Wages' },
    ],
  };
}

/** Lodging Ops sub-measure: dept_level=2 + acc_base=accountList. */
function addLodgingAccountSub(id: string, account: string | string[]): void {
  SUB[id] = {
    id,
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: LODGING_LEVEL2 },
      { type: 'acc_base', value: account },
    ],
  };
}

/** Simple passthrough measure → wraps a single sub-measure. */
function addSimple(id: string, subId: string): void {
  MEA[id] = { id, type: 'simple', subMeasures: [subId] };
}

// ----------------------------------------------------------------------------
// 1) Per-department × Associate Wages  (Salaries → Perm. & Fixed Term section)
//    Per-department × A631208           (Salaries → Contracts section)
//    Per-department × A972540           (Employee Numbers → Perm. & Fixed Term)
//    Per-department × A988111           (Employee Numbers → Casuals)
// ----------------------------------------------------------------------------

for (const d of PAYROLL_DEPTS) {
  const wagesSub    = `payroll_${d.key}_assoc_wages_act`;
  const contractSub = `payroll_${d.key}_contracts_act`;
  const headSub     = `payroll_${d.key}_assoc_count_act`;
  const casualSub   = `payroll_${d.key}_contract_count_act`;

  addDeptAssocWagesSub(wagesSub, d.level7);
  addDeptAccountSub(contractSub, d.level7, 'A631208');
  addDeptAccountSub(headSub,     d.level7, 'A972540');
  addDeptAccountSub(casualSub,   d.level7, 'A988111');

  addSimple(`payroll_${d.key}_assoc_wages`,    wagesSub);
  addSimple(`payroll_${d.key}_contracts`,      contractSub);
  addSimple(`payroll_${d.key}_assoc_count`,    headSub);
  addSimple(`payroll_${d.key}_contract_count`, casualSub);
}

// ----------------------------------------------------------------------------
// 2) Lodging Operations totals — Salaries section
// ----------------------------------------------------------------------------

// Total Perm. & Fixed Term Wages (Lodging Ops × Associate Wages level_12)
SUB['payroll_lodging_assoc_wages_act'] = {
  id: 'payroll_lodging_assoc_wages_act',
  formula: 'CALCULATE',
  filters: [
    { type: 'dept_level', level: 2, value: LODGING_LEVEL2 },
    { type: 'acc_level', level: 12, value: 'Associate Wages' },
  ],
};
addSimple('payroll_lodging_assoc_wages', 'payroll_lodging_assoc_wages_act');

// Total Contracts (Lodging Ops × A631208)
addLodgingAccountSub('payroll_lodging_contracts_act', 'A631208');
addSimple('payroll_lodging_contracts', 'payroll_lodging_contracts_act');

// Total Salaries/Casuals/Incentives = Wages + Contracts at Lodging Ops level
MEA['payroll_lodging_salaries_total'] = {
  id: 'payroll_lodging_salaries_total',
  type: 'calculated',
  subMeasures: ['payroll_lodging_assoc_wages_act', 'payroll_lodging_contracts_act'],
  evaluator: (ctx: MeasureContext) =>
    (ctx.subMeasures.payroll_lodging_assoc_wages_act || 0)
    + (ctx.subMeasures.payroll_lodging_contracts_act || 0),
};

// ----------------------------------------------------------------------------
// 3) Payroll Burden — individual line items (Lodging Ops scope)
// ----------------------------------------------------------------------------

for (const line of PAYROLL_BURDEN_LINES) {
  const subId = `payroll_burden_${line.key}_act`;
  addLodgingAccountSub(subId, line.account);
  addSimple(`payroll_burden_${line.key}`, subId);
}

// Canonical level_12 Associate Benefits aggregate at Lodging Ops scope
SUB['payroll_lodging_assoc_benefits_act'] = {
  id: 'payroll_lodging_assoc_benefits_act',
  formula: 'CALCULATE',
  filters: [
    { type: 'dept_level', level: 2, value: LODGING_LEVEL2 },
    { type: 'acc_level', level: 12, value: 'Associate Benefits' },
  ],
};

// Sum of the 3 NOT BENEFITS (repointed) accounts at Lodging Ops scope
SUB['payroll_lodging_not_benefits_act'] = {
  id: 'payroll_lodging_not_benefits_act',
  formula: 'CALCULATE',
  filters: [
    { type: 'dept_level', level: 2, value: LODGING_LEVEL2 },
    { type: 'acc_base', value: PROTEA_PAYROLL_REPOINT_ACCOUNTS },
  ],
};

// Total Payroll Burden = Associate Benefits + the 3 NOT BENEFITS accounts.
// Spec-corrected per user: the 3 repointed accounts count toward the burden
// total even though they sit outside level_12 Associate Benefits.
MEA['payroll_total_burden'] = {
  id: 'payroll_total_burden',
  type: 'calculated',
  subMeasures: ['payroll_lodging_assoc_benefits_act', 'payroll_lodging_not_benefits_act'],
  evaluator: (ctx: MeasureContext) =>
    (ctx.subMeasures.payroll_lodging_assoc_benefits_act || 0)
    + (ctx.subMeasures.payroll_lodging_not_benefits_act || 0),
};

// "Other" = Total Payroll Burden − sum of the 14 named individual lines.
// Pure catch-all; resolves to ~0 on a clean OU. Subtracts the burden-line
// sub-measure ids directly so the evaluator stays a single sum/subtract.
const ALL_BURDEN_SUB_IDS = PAYROLL_BURDEN_LINES.map(l => `payroll_burden_${l.key}_act`);
MEA['payroll_other_burden'] = {
  id: 'payroll_other_burden',
  type: 'calculated',
  subMeasures: [
    'payroll_lodging_assoc_benefits_act',
    'payroll_lodging_not_benefits_act',
    ...ALL_BURDEN_SUB_IDS,
  ],
  evaluator: (ctx: MeasureContext) => {
    const burdenTotal =
      (ctx.subMeasures.payroll_lodging_assoc_benefits_act || 0)
      + (ctx.subMeasures.payroll_lodging_not_benefits_act || 0);
    let sumNamed = 0;
    for (const id of ALL_BURDEN_SUB_IDS) sumNamed += ctx.subMeasures[id] || 0;
    return burdenTotal - sumNamed;
  },
};

// ----------------------------------------------------------------------------
// 4) STAFF EXPENSES SUMMARY — per-department & Lodging Ops _protea totals
//    for the departments NOT already registered in plMeasureDefinitions.ts.
//    (rooms, fb, ag, pom, sm are already present there.)
// ----------------------------------------------------------------------------

function registerPayrollProtea(key: string, deptLevel: number, deptValue: string): void {
  const payrollSub  = `total_${key}_payroll_act`;
  const movementSub = `${key}_payroll_movement_act`;

  SUB[payrollSub] = {
    id: payrollSub,
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: deptLevel, value: deptValue },
      { type: 'acc_level', level: 9, value: 'Total Payroll' },
    ],
  };
  SUB[movementSub] = {
    id: movementSub,
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: deptLevel, value: deptValue },
      { type: 'acc_base', value: PROTEA_PAYROLL_REPOINT_ACCOUNTS },
    ],
  };
  MEA[`total_${key}_payroll`] = { id: `total_${key}_payroll`, type: 'simple', subMeasures: [payrollSub] };
  MEA[`total_${key}_payroll_protea`] = {
    id: `total_${key}_payroll_protea`,
    type: 'calculated',
    subMeasures: [payrollSub, movementSub],
    evaluator: (ctx: MeasureContext) =>
      (ctx.subMeasures[payrollSub] || 0) + (ctx.subMeasures[movementSub] || 0),
  };
}

registerPayrollProtea('other_ops', 7, 'Other Operated Departments');
registerPayrollProtea('util',      7, 'Utilities Dept');
registerPayrollProtea('it',        7, 'Information & Telecom Systems');
registerPayrollProtea('lodging',   2, LODGING_LEVEL2);

// Staff-summary measure per dept (and Lodging Ops) = Total Payroll (incl.
// repointed NOT BENEFITS accounts) + A631208 Contracts. Contracts sit
// outside level_9 Total Payroll in the source hierarchy, so they have to be
// added here explicitly. This measure is consumed ONLY by the Payroll tab's
// STAFF EXPENSES SUMMARY section — do not reuse it for KPI calculations
// without confirming the denominator definition.
function addStaffSummaryMeasure(key: string, proteaMeasureId: string, contractsSubId: string): void {
  // The protea measure is itself calculated from two sub-measures; we depend
  // on those atoms directly so the engine has everything in one context.
  const payrollSub  = `total_${key}_payroll_act`;
  const movementSub = `${key}_payroll_movement_act`;
  MEA[`payroll_${key}_staff_summary`] = {
    id: `payroll_${key}_staff_summary`,
    type: 'calculated',
    subMeasures: [payrollSub, movementSub, contractsSubId],
    evaluator: (ctx: MeasureContext) =>
      (ctx.subMeasures[payrollSub] || 0)
      + (ctx.subMeasures[movementSub] || 0)
      + (ctx.subMeasures[contractsSubId] || 0),
  };
  // proteaMeasureId is kept as a parameter for cross-reference / future
  // hardening (e.g. if the engine ever materialises calculated measures into
  // the sub-measures context); currently unused at evaluator time.
  void proteaMeasureId;
}

for (const d of PAYROLL_DEPTS) {
  addStaffSummaryMeasure(
    d.key,
    PROTEA_PAYROLL_DEPT_TO_PROTEA_MEASURE[d.key],
    `payroll_${d.key}_contracts_act`
  );
}
addStaffSummaryMeasure('lodging', 'total_lodging_payroll_protea', 'payroll_lodging_contracts_act');

// ----------------------------------------------------------------------------
// 5) Employee Numbers — Lodging Ops totals + Total STAFF combined
// ----------------------------------------------------------------------------

addLodgingAccountSub('payroll_lodging_assoc_count_act',    'A972540');
addLodgingAccountSub('payroll_lodging_contract_count_act', 'A988111');
// Total STAFF combined sum — multi-account base filter (proven pattern).
addLodgingAccountSub('payroll_lodging_total_staff_act',    ['A972540', 'A988111']);

addSimple('payroll_lodging_assoc_count',    'payroll_lodging_assoc_count_act');
addSimple('payroll_lodging_contract_count', 'payroll_lodging_contract_count_act');
addSimple('payroll_lodging_total_staff',    'payroll_lodging_total_staff_act');

// ----------------------------------------------------------------------------
// Exports — consumed by plMeasureDefinitions.ts (Object.assign at end-of-file)
// ----------------------------------------------------------------------------

export const PROTEA_PAYROLL_SUB_MEASURES: Record<string, SubMeasure> = SUB;
export const PROTEA_PAYROLL_MEASURES: Record<string, Measure> = MEA;
