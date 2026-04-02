import { PLRow } from '../../types/plReportTypes';

// ============================================================================
// PROTEA F90 P&L ROW CONFIGURATION
// Defines the structure and ordering of the F90 P&L report for Protea packs
//
// SIGN CONVENTION RULES:
// - Credit-balance accounts (revenue, profit, EBITDA, GOP): sub-measures already
//   have negate:true which converts the negative DB credit to a positive display
//   value.  Do NOT add invertSign here — that would double-negate back to negative.
// - Debit-balance accounts (operating expenses, management fees): stored as
//   positive debits in the DB.  Sub-measures have negate:true which flips them
//   negative, so invertSign:true IS needed here to restore a positive display value.
// ============================================================================

export const PROTEA_F90_PL_ROW_CONFIG: PLRow[] = [
  // Revenue Section — credit-balance accounts, no invertSign needed
  { type: 'header', label: 'REVENUE', indentLevel: 0 },
  { type: 'measure', label: 'Rooms and Reservations', measureId: 'rooms_reservations_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Food', measureId: 'food_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Beverage', measureId: 'beverage_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry F&B', measureId: 'sundry_fb_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Operating Depts', measureId: 'total_other_dept_sales', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Income', measureId: 'misc_income_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'header', label: 'TOTAL REVENUE', measureId: 'total_sales', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Department Profit Section — net of revenue credits and expense debits; the net
  // is a credit when profitable, so negate:true in the sub-measure already gives a
  // positive value.  No invertSign needed.
  { type: 'header', label: 'DEPARTMENT PROFIT', indentLevel: 0 },
  { type: 'measure', label: 'Rooms and Reservations', measureId: 'rooms_reservations_profit', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Food and Beverage', measureId: 'total_fb_profit', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Operating Depts', measureId: 'total_other_dept_profit', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Income', measureId: 'misc_income_profit', formatting: 'number', indentLevel: 1 },
  { type: 'header', label: 'TOTAL DEPT PROFIT', measureId: 'total_dept_profit', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Undistributed Operating Expenses — debit-balance accounts stored as positive in
  // the DB.  negate:true in the sub-measure flips them negative, so invertSign:true
  // IS required here to restore a positive display value.
  { type: 'header', label: 'UNDISTRIBUTED OPERATING EXPENSES', indentLevel: 0 },
  { type: 'measure', label: 'Total Administrative & General', measureId: 'admin_general_and_it_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Utilities', measureId: 'utilities_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Property Operation & Maint', measureId: 'property_operation_maint_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Sales & Marketing', measureId: 'sales_marketing_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'TOTAL UNDISTRIBUTED OP EXP', measureId: 'total_undist_op_exp', formatting: 'number', indentLevel: 0, invertSign: true },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Management Controllable Profit — credit-balance account, no invertSign needed
  { type: 'header', label: 'MANAGEMENT CONTROLLABLE PROFIT', measureId: 'gross_operating_profit', formatting: 'number', indentLevel: 0 },
  { type: 'measure', label: 'Fixed Expenses', measureId: 'fixed_expenses', formatting: 'number', indentLevel: 1 },
  { type: 'header', label: 'HOTEL PROFIT BEFORE MGT FEES', measureId: 'hotel_profit_before_mgt_fees', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Management Fees — debit-balance accounts, invertSign:true needed
  { type: 'measure', label: 'Base Mgmt Fee', measureId: 'f90_base_mgmt_fee', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Incentive Fee', measureId: 'f90_base_royalty_fee', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Base Royalty Fee', measureId: 'f90_incentive_fee', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'TOTAL MANAGEMENT FEES', measureId: 'f90_total_mgmt_fees', formatting: 'number', indentLevel: 0, invertSign: true },
  { type: 'header', label: 'HOTEL PROFIT/(LOSS) BEFORE DEPR, INT AND OWNER EXP', measureId: 'f90_income_before_nonop', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Below-the-line items
  { type: 'measure', label: 'Depreciation', measureId: 'f90_depreciation', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Owners Expense', measureId: 'f90_protea_owner_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Net Interest', measureId: 'f90_interest', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Abnormal Items', measureId: 'f90_abnormal_items', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'HOTEL PROFIT/(LOSS) BEFORE TAX', measureId: 'f90_profit_before_tax', formatting: 'number', indentLevel: 0 },
  { type: 'measure', label: 'Tax', measureId: 'f90_tax', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'HOTEL PROFIT/(LOSS) BEFORE DIVIDENDS', measureId: 'f90_net_profit', formatting: 'number', indentLevel: 0 },
  { type: 'measure', label: 'Dividends *', measureId: 'f90_dividends_placeholder', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'NET PROFIT/(LOSS)', measureId: 'f90_profit_after_dividends', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Key Statistics
  { type: 'header', label: 'KEY STATISTICS', indentLevel: 0 },
  { type: 'measure', label: 'Rooms Available', measureId: 'total_rooms', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Rooms SOLD', measureId: 'sold_rooms', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Occupancy', measureId: 'occupancy_rooms_act_sy', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'Average Rate', measureId: 'adr_act_sy', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'REVPAR', measureId: 'rev_par_act_sy', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Rooms Dept Profit %', measureId: 'rooms_dept_profit_pct', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'MCP %', measureId: 'gop_pct', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'GOP %', measureId: 'protea_original_gop_pct', formatting: 'percentage', indentLevel: 1 },

  // F&B KPIs
  { type: 'header', label: 'F&B KPIS', indentLevel: 0 },
  { type: 'measure', label: 'F&B Dept Profit %', measureId: 'fb_dept_profit_pct', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'F&B revenue as % of total Revenue', measureId: 'fb_revenue_pct_total', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: '% Food COS', measureId: 'food_cost_pct_sales', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: '% Beverage COS', measureId: 'bev_cost_pct_sales', formatting: 'percentage', indentLevel: 1 }
];

// ============================================================================
// PROTEA F90 P&L ROW CONFIGURATION — WITH BANQUETING BREAKDOWN
// When the banqueting toggle is ON, F&B revenue/profit lines exclude banqueting
// amounts and a separate Banqueting row is shown. Totals remain unchanged.
// ============================================================================

export const PROTEA_F90_PL_ROW_CONFIG_WITH_BANQUETING: PLRow[] = [
  // Revenue Section — F&B lines exclude banqueting; Banqueting shown separately
  { type: 'header', label: 'REVENUE', indentLevel: 0 },
  { type: 'measure', label: 'Rooms and Reservations', measureId: 'rooms_reservations_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Food', measureId: 'food_revenue_excl_banq', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Beverage', measureId: 'beverage_revenue_excl_banq', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry F&B', measureId: 'sundry_fb_revenue_excl_banq', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Banqueting', measureId: 'banquets_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Operating Depts', measureId: 'total_other_dept_sales', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Income', measureId: 'misc_income_revenue', formatting: 'number', indentLevel: 1 },
  { type: 'header', label: 'TOTAL REVENUE', measureId: 'total_sales', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Department Profit Section — F&B profit excludes banqueting; Banqueting shown separately
  { type: 'header', label: 'DEPARTMENT PROFIT', indentLevel: 0 },
  { type: 'measure', label: 'Rooms and Reservations', measureId: 'rooms_reservations_profit', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Food and Beverage', measureId: 'total_fb_profit_excl_banq', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Banqueting', measureId: 'banquets_profit', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Operating Depts', measureId: 'total_other_dept_profit', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Sundry Income', measureId: 'misc_income_profit', formatting: 'number', indentLevel: 1 },
  { type: 'header', label: 'TOTAL DEPT PROFIT', measureId: 'total_dept_profit', formatting: 'number', indentLevel: 0 },

  // Spacing
  { type: 'header', label: '', indentLevel: 0 },

  // Everything below is identical to the base config
  { type: 'header', label: 'UNDISTRIBUTED OPERATING EXPENSES', indentLevel: 0 },
  { type: 'measure', label: 'Total Administrative & General', measureId: 'admin_general_and_it_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Utilities', measureId: 'utilities_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Property Operation & Maint', measureId: 'property_operation_maint_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Sales & Marketing', measureId: 'sales_marketing_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'TOTAL UNDISTRIBUTED OP EXP', measureId: 'total_undist_op_exp', formatting: 'number', indentLevel: 0, invertSign: true },

  { type: 'header', label: '', indentLevel: 0 },

  { type: 'header', label: 'MANAGEMENT CONTROLLABLE PROFIT', measureId: 'gross_operating_profit', formatting: 'number', indentLevel: 0 },
  { type: 'measure', label: 'Fixed Expenses', measureId: 'fixed_expenses', formatting: 'number', indentLevel: 1 },
  { type: 'header', label: 'HOTEL PROFIT BEFORE MGT FEES', measureId: 'hotel_profit_before_mgt_fees', formatting: 'number', indentLevel: 0 },

  { type: 'header', label: '', indentLevel: 0 },

  { type: 'measure', label: 'Base Mgmt Fee', measureId: 'f90_base_mgmt_fee', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Incentive Fee', measureId: 'f90_base_royalty_fee', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Base Royalty Fee', measureId: 'f90_incentive_fee', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'TOTAL MANAGEMENT FEES', measureId: 'f90_total_mgmt_fees', formatting: 'number', indentLevel: 0, invertSign: true },
  { type: 'header', label: 'HOTEL PROFIT/(LOSS) BEFORE DEPR, INT AND OWNER EXP', measureId: 'f90_income_before_nonop', formatting: 'number', indentLevel: 0 },

  { type: 'header', label: '', indentLevel: 0 },

  { type: 'measure', label: 'Depreciation', measureId: 'f90_depreciation', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Owners Expense', measureId: 'f90_protea_owner_expense', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'measure', label: 'Net Interest', measureId: 'f90_interest', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Abnormal Items', measureId: 'f90_abnormal_items', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'HOTEL PROFIT/(LOSS) BEFORE TAX', measureId: 'f90_profit_before_tax', formatting: 'number', indentLevel: 0 },
  { type: 'measure', label: 'Tax', measureId: 'f90_tax', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'HOTEL PROFIT/(LOSS) BEFORE DIVIDENDS', measureId: 'f90_net_profit', formatting: 'number', indentLevel: 0 },
  { type: 'measure', label: 'Dividends *', measureId: 'f90_dividends_placeholder', formatting: 'number', indentLevel: 1, invertSign: true },
  { type: 'header', label: 'NET PROFIT/(LOSS)', measureId: 'f90_profit_after_dividends', formatting: 'number', indentLevel: 0 },

  { type: 'header', label: '', indentLevel: 0 },

  { type: 'header', label: 'KEY STATISTICS', indentLevel: 0 },
  { type: 'measure', label: 'Rooms Available', measureId: 'total_rooms', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Rooms SOLD', measureId: 'sold_rooms', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Occupancy', measureId: 'occupancy_rooms_act_sy', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'Average Rate', measureId: 'adr_act_sy', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'REVPAR', measureId: 'rev_par_act_sy', formatting: 'number', indentLevel: 1 },
  { type: 'measure', label: 'Rooms Dept Profit %', measureId: 'rooms_dept_profit_pct', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'MCP %', measureId: 'gop_pct', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'GOP %', measureId: 'protea_original_gop_pct', formatting: 'percentage', indentLevel: 1 },

  { type: 'header', label: 'F&B KPIS', indentLevel: 0 },
  { type: 'measure', label: 'F&B Dept Profit %', measureId: 'fb_dept_profit_pct', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: 'F&B revenue as % of total Revenue', measureId: 'fb_revenue_pct_total', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: '% Food COS', measureId: 'food_cost_pct_sales', formatting: 'percentage', indentLevel: 1 },
  { type: 'measure', label: '% Beverage COS', measureId: 'bev_cost_pct_sales', formatting: 'percentage', indentLevel: 1 }
];
