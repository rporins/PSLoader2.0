import { SubMeasure, Measure, MeasureContext } from '../../types/plReportTypes';
// investSubgroupConfig accessors removed — F90 measures now use level_20 filters directly

// ============================================================================
// SUB-MEASURE DEFINITIONS
// Base calculations that aggregate financial data with specific filters
// ============================================================================

export const SUB_MEASURES: Record<string, SubMeasure> = {
  // Rooms Statistics
  sold_rooms_act: {
    id: 'sold_rooms_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 10, value: 'Rooms' },
      { type: 'acc_base', value: 'A960103' }
    ]
  },

  total_rooms_act: {
    id: 'total_rooms_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 10, value: 'Rooms' },
      { type: 'acc_base', value: 'A960101' }
    ]
  },

  // Revenue Measures
  total_rooms_revenue_act: {
    id: 'total_rooms_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 5, value: 'ROOMS_and_RESERVATION' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_revenue_act: {
    id: 'total_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_fb_revenue_act: {
    id: 'total_fb_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 5, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // Profit Measures
  total_profit_act: {
    id: 'total_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  rooms_dept_profit_act: {
    id: 'rooms_dept_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  fb_profit_act: {
    id: 'fb_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // NOI Components
  lodging_ops_ebitda_act: {
    id: 'lodging_ops_ebitda_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'dept_level', level: 2, value: 'Lodging Operations' }
    ]
  },

  total_hotel_ebitda_act: {
    id: 'total_hotel_ebitda_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 1, value: 'NOI' },
      { type: 'dept_level', level: 2, value: 'NOI' }
    ]
  },

  replacement_reserve_act: {
    id: 'replacement_reserve_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_base', value: ['A701110', 'A701111', 'A759372'] },
      { type: 'dept_base', value: 'D0480' }
    ]
  },

  // Same Year (SY) Scenario - Rooms Statistics
  sold_rooms_act_sy: {
    id: 'sold_rooms_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 10, value: 'Rooms' },
      { type: 'acc_base', value: 'A960103' }
    ]
  },

  total_rooms_act_sy: {
    id: 'total_rooms_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 10, value: 'Rooms' },
      { type: 'acc_base', value: 'A960101' }
    ]
  },

  // Same Year (SY) Scenario - Revenue
  total_rooms_revenue_act_sy: {
    id: 'total_rooms_revenue_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 5, value: 'ROOMS_and_RESERVATION' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_revenue_act_sy: {
    id: 'total_revenue_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // Same Year (SY) Scenario - Profit
  total_profit_act_sy: {
    id: 'total_profit_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  rooms_dept_profit_act_sy: {
    id: 'rooms_dept_profit_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // Same Year (SY) Scenario - F&B
  total_fb_revenue_act_sy: {
    id: 'total_fb_revenue_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 5, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  fb_profit_act_sy: {
    id: 'fb_profit_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // Same Year (SY) Scenario - Other Operated Departments
  other_revenue_act_sy: {
    id: 'other_revenue_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 5, value: 'Other Operated Departments' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  other_profit_act_sy: {
    id: 'other_profit_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 5, value: 'Other Operated Departments' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // Same Year (SY) Scenario - Administrative & General
  admin_act_sy: {
    id: 'admin_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: 'Administrative & General' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  cc_expense_act_sy: {
    id: 'cc_expense_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 14, value: 'Credit Card Expense' }
    ]
  },

  it_and_telecom_act_sy: {
    id: 'it_and_telecom_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: 'Information & Telecom Systems' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  utilities_act_sy: {
    id: 'utilities_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: 'Utilities Dept' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  pom_act_sy: {
    id: 'pom_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: 'Property Operation & Maintenance' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  sales_act_sy: {
    id: 'sales_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: 'Sales & Marketing and Convention Service' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  other_uoe_act_sy: {
    id: 'other_uoe_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 7, value: 'Other UOE' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // TODO: Replace this hardcoded department list with hierarchy-based filters
  // (e.g., dept_level + acc_level as used by total_payroll_expenses_act_sy below).
  // This list will silently go stale when departments are added or removed.
  total_payroll_act_sy: {
    id: 'total_payroll_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 9, value: 'Total Payroll' },
      { type: 'dept_base', value: ['D0010', 'D0011', 'D0012', 'D0013', 'D0015', 'D0020', 'D0040', 'D0041', 'D0080', 'D0100', 'D0102', 'D0103', 'D0110', 'D0120', 'D0128', 'D0140', 'D0141', 'D0160', 'D0170', 'D0171', 'D0172', 'D0180', 'D0190', 'D0191', 'D0192', 'D0199', 'D0200', 'D0210', 'D0211', 'D0212', 'D0213', 'D0214', 'D0217', 'D0220', 'D0221', 'D0222', 'D0223', 'D0224', 'D0225', 'D0226', 'D0227', 'D0229', 'D0230', 'D0238', 'D0240', 'D0241', 'D0251', 'D0252', 'D0253', 'D0254', 'D0255', 'D0261', 'D0262', 'D0265', 'D0266', 'D0270', 'D0272', 'D0282', 'D0286', 'D0330', 'D0385', 'D0387', 'D0400', 'D0410', 'D0411', 'D0412', 'D0430', 'D0431', 'D0440', 'D0448', 'D0470', 'D0471', 'D0475', 'D0478'] }
    ]
  },

  total_payroll_expenses_act_sy: {
    id: 'total_payroll_expenses_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      // Note: Original spec excluded "Payroll Cost Allocation" but filter system doesn't support exclusion
      { type: 'acc_level', level: 9, value: 'Total Payroll' }
    ]
  },

  ta_commission_act_sy: {
    id: 'ta_commission_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 15, value: 'TA Commissions' },
      { type: 'dept_level', level: 2, value: ['Lodging Operations'] }
    ]
  },

  rooms_expense_act_sy: {
    id: 'rooms_expense_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 6, value: 'Total Expenses' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' }
    ]
  },

  rooms_sold_act_sy: {
    id: 'rooms_sold_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 6, value: 'Rooms Sold' }
    ]
  },

  // Prior Year 1 (PY1) Scenario - Revenue
  total_revenue_act_py1: {
    id: 'total_revenue_act_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // Prior Year 1 (PY1) Scenario - Profit
  total_profit_act_py1: {
    id: 'total_profit_act_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // Same Year (SY) Scenario - NOI Components
  lodging_ops_ebitda_act_sy: {
    id: 'lodging_ops_ebitda_act_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'dept_level', level: 2, value: 'Lodging Operations' }
    ]
  },

  total_hotel_ebitda_act_sy: {
    id: 'total_hotel_ebitda_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_level', level: 1, value: 'NOI' },
      { type: 'dept_level', level: 2, value: 'NOI' }
    ]
  },

  replacement_reserve_act_sy: {
    id: 'replacement_reserve_act_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'acc_base', value: ['A701110', 'A701111', 'A759372'] },
      { type: 'dept_base', value: 'D0480' }
    ]
  },

  // F90 P&L - Rooms and Reservations Revenue
  rooms_reservations_revenue_act: {
    id: 'rooms_reservations_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  rooms_reservations_revenue_sy: {
    id: 'rooms_reservations_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  rooms_reservations_revenue_py1: {
    id: 'rooms_reservations_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Gift Shop Revenue
  gift_shop_revenue_act: {
    id: 'gift_shop_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Gift Shop' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  gift_shop_revenue_sy: {
    id: 'gift_shop_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Gift Shop' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  gift_shop_revenue_py1: {
    id: 'gift_shop_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Gift Shop' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Restaurants and Room Service Revenue
  restaurants_room_service_revenue_act: {
    id: 'restaurants_room_service_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Restaurants and Room Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  restaurants_room_service_revenue_sy: {
    id: 'restaurants_room_service_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Restaurants and Room Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  restaurants_room_service_revenue_py1: {
    id: 'restaurants_room_service_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Restaurants and Room Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Lounges Revenue
  lounges_revenue_act: {
    id: 'lounges_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Lounge' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  lounges_revenue_sy: {
    id: 'lounges_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Lounge' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  lounges_revenue_py1: {
    id: 'lounges_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Lounge' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Audio Visual Revenue
  audio_visual_revenue_act: {
    id: 'audio_visual_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Audio Visual' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  audio_visual_revenue_sy: {
    id: 'audio_visual_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Audio Visual' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  audio_visual_revenue_py1: {
    id: 'audio_visual_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Audio Visual' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Banquets Revenue
  banquets_revenue_act: {
    id: 'banquets_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  banquets_revenue_sy: {
    id: 'banquets_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  banquets_revenue_py1: {
    id: 'banquets_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Banquet Food Revenue (for excl-banqueting calculations)
  banq_food_rev_act: {
    id: 'banq_food_rev_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Food Revenue' }
    ]
  },

  // F90 P&L - Banquet Beverage Revenue (for excl-banqueting calculations)
  banq_bev_rev_act: {
    id: 'banq_bev_rev_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Beverage Revenue' }
    ]
  },

  // F90 P&L - Leisure & Recreation Revenue
  leisure_recreation_revenue_act: {
    id: 'leisure_recreation_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Recreation Center' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  leisure_recreation_revenue_sy: {
    id: 'leisure_recreation_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Recreation Center' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  leisure_recreation_revenue_py1: {
    id: 'leisure_recreation_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Recreation Center' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Golf Revenue
  golf_revenue_act: {
    id: 'golf_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Golf' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  golf_revenue_sy: {
    id: 'golf_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Golf' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  golf_revenue_py1: {
    id: 'golf_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Golf' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Spa Revenue
  spa_revenue_act: {
    id: 'spa_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Spa' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  spa_revenue_sy: {
    id: 'spa_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Spa' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  spa_revenue_py1: {
    id: 'spa_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Spa' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Casino Revenue
  casino_revenue_act: {
    id: 'casino_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Casino' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  casino_revenue_sy: {
    id: 'casino_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Casino' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  casino_revenue_py1: {
    id: 'casino_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Casino' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Miscellaneous Income Revenue
  misc_income_revenue_act: {
    id: 'misc_income_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  misc_income_revenue_sy: {
    id: 'misc_income_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  misc_income_revenue_py1: {
    id: 'misc_income_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Drycleaning Revenue
  drycleaning_revenue_act: {
    id: 'drycleaning_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Dry Cleaning' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  drycleaning_revenue_sy: {
    id: 'drycleaning_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Dry Cleaning' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  drycleaning_revenue_py1: {
    id: 'drycleaning_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Dry Cleaning' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Garage Revenue
  garage_revenue_act: {
    id: 'garage_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Garage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  garage_revenue_sy: {
    id: 'garage_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Garage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  garage_revenue_py1: {
    id: 'garage_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Garage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Guest Communications Revenue
  guest_communications_revenue_act: {
    id: 'guest_communications_revenue_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Guest Communications' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  guest_communications_revenue_sy: {
    id: 'guest_communications_revenue_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Guest Communications' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  guest_communications_revenue_py1: {
    id: 'guest_communications_revenue_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Guest Communications' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Total Other Departments Sales (Other Profit Departments + Dry Cleaning)
  total_other_dept_sales_act: {
    id: 'total_other_dept_sales_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: ['Other Profit Departments', 'Dry Cleaning'] },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_other_dept_sales_sy: {
    id: 'total_other_dept_sales_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: ['Other Profit Departments', 'Dry Cleaning'] },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_other_dept_sales_py1: {
    id: 'total_other_dept_sales_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: ['Other Profit Departments', 'Dry Cleaning'] },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Total Sales (Operating Departments)
  total_sales_act: {
    id: 'total_sales_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_sales_sy: {
    id: 'total_sales_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  total_sales_py1: {
    id: 'total_sales_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Revenue' }
    ]
  },

  // F90 P&L - Rooms and Reservations Profit
  rooms_reservations_profit_act: {
    id: 'rooms_reservations_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  rooms_reservations_profit_sy: {
    id: 'rooms_reservations_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  rooms_reservations_profit_py1: {
    id: 'rooms_reservations_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Rooms and Reservation' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Gift Shop Profit
  gift_shop_profit_act: {
    id: 'gift_shop_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Gift Shop' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  gift_shop_profit_sy: {
    id: 'gift_shop_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Gift Shop' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  gift_shop_profit_py1: {
    id: 'gift_shop_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Gift Shop' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Restaurants and Room Service Profit
  restaurants_room_service_profit_act: {
    id: 'restaurants_room_service_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Restaurants and Room Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  restaurants_room_service_profit_sy: {
    id: 'restaurants_room_service_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Restaurants and Room Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  restaurants_room_service_profit_py1: {
    id: 'restaurants_room_service_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Restaurants and Room Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Lounges Profit
  lounges_profit_act: {
    id: 'lounges_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Lounge' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  lounges_profit_sy: {
    id: 'lounges_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Lounge' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  lounges_profit_py1: {
    id: 'lounges_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 11, value: 'Lounge' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Audio Visual Profit
  audio_visual_profit_act: {
    id: 'audio_visual_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Audio Visual' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  audio_visual_profit_sy: {
    id: 'audio_visual_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Audio Visual' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  audio_visual_profit_py1: {
    id: 'audio_visual_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Audio Visual' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Banquets Profit
  banquets_profit_act: {
    id: 'banquets_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  banquets_profit_sy: {
    id: 'banquets_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  banquets_profit_py1: {
    id: 'banquets_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 12, value: 'Banquet' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Food Cost (for % Food COS calculation)
  food_cost_act: {
    id: 'food_cost_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 12, value: 'Food Cost' }
    ]
  },

  food_cost_sy: {
    id: 'food_cost_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 12, value: 'Food Cost' }
    ]
  },

  food_cost_py1: {
    id: 'food_cost_py1',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 12, value: 'Food Cost' }
    ]
  },

  // F90 P&L - Food Revenue (for % Food COS calculation)
  food_rev_act: {
    id: 'food_rev_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Food Revenue' }
    ]
  },

  food_rev_sy: {
    id: 'food_rev_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Food Revenue' }
    ]
  },

  food_rev_py1: {
    id: 'food_rev_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Food Revenue' }
    ]
  },

  // F90 P&L - Beverage Cost (for % Beverage COS calculation)
  bev_cost_act: {
    id: 'bev_cost_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 12, value: 'Beverage Cost' }
    ]
  },

  bev_cost_sy: {
    id: 'bev_cost_sy',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 12, value: 'Beverage Cost' }
    ]
  },

  bev_cost_py1: {
    id: 'bev_cost_py1',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 12, value: 'Beverage Cost' }
    ]
  },

  // F90 P&L - Beverage Revenue (for % Beverage COS calculation)
  bev_rev_act: {
    id: 'bev_rev_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Beverage Revenue' }
    ]
  },

  bev_rev_sy: {
    id: 'bev_rev_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Beverage Revenue' }
    ]
  },

  bev_rev_py1: {
    id: 'bev_rev_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 9, value: 'Beverage Revenue' }
    ]
  },

  // F90 P&L - Total F&B Profit
  total_fb_profit_act: {
    id: 'total_fb_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 5, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  total_fb_profit_sy: {
    id: 'total_fb_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 5, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  total_fb_profit_py1: {
    id: 'total_fb_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 5, value: 'Total Food & Beverage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Leisure & Recreation Profit
  leisure_recreation_profit_act: {
    id: 'leisure_recreation_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Recreation Center' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  leisure_recreation_profit_sy: {
    id: 'leisure_recreation_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Recreation Center' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  leisure_recreation_profit_py1: {
    id: 'leisure_recreation_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Recreation Center' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Golf Profit
  golf_profit_act: {
    id: 'golf_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Golf' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  golf_profit_sy: {
    id: 'golf_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Golf' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  golf_profit_py1: {
    id: 'golf_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Golf' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Spa Profit
  spa_profit_act: {
    id: 'spa_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Spa' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  spa_profit_sy: {
    id: 'spa_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Spa' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  spa_profit_py1: {
    id: 'spa_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Spa' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Casino Profit
  casino_profit_act: {
    id: 'casino_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Casino' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  casino_profit_sy: {
    id: 'casino_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Casino' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  casino_profit_py1: {
    id: 'casino_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Casino' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Miscellaneous Income Profit
  misc_income_profit_act: {
    id: 'misc_income_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  misc_income_profit_sy: {
    id: 'misc_income_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  misc_income_profit_py1: {
    id: 'misc_income_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Drycleaning Profit (In House)
  drycleaning_profit_act: {
    id: 'drycleaning_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Dry Cleaning' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  drycleaning_profit_sy: {
    id: 'drycleaning_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Dry Cleaning' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  drycleaning_profit_py1: {
    id: 'drycleaning_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Dry Cleaning' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Garage Profit
  garage_profit_act: {
    id: 'garage_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Garage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  garage_profit_sy: {
    id: 'garage_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Garage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  garage_profit_py1: {
    id: 'garage_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 12, value: 'Garage' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Guest Communications Profit
  guest_communications_profit_act: {
    id: 'guest_communications_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'dept_level', level: 12, value: 'Guest Communications' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  guest_communications_profit_sy: {
    id: 'guest_communications_profit_sy',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'dept_level', level: 12, value: 'Guest Communications' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  guest_communications_profit_py1: {
    id: 'guest_communications_profit_py1',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: 'Miscellaneous Income' },
      { type: 'dept_level', level: 12, value: 'Guest Communications' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Total Other Departments Profit (Other Profit Departments + Dry Cleaning)
  total_other_dept_profit_act: {
    id: 'total_other_dept_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'dept_level', level: 7, value: 'Other Operated Departments' },
      { type: 'dept_level', level: 10, value: ['Other Profit Departments', 'Dry Cleaning'] },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Total Department Profit
  total_dept_profit_act: {
    id: 'total_dept_profit_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Operating Departments' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 4, value: 'Profit Amount' }
    ]
  },

  // F90 P&L - Administrative and General Expense
  admin_general_expense_act: {
    id: 'admin_general_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_base', value: 'D0410' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Human Resources Expense
  human_resources_expense_act: {
    id: 'human_resources_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_base', value: 'D0411' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Loss Prevention Expense
  loss_prevention_expense_act: {
    id: 'loss_prevention_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_base', value: 'D0412' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Accounting Expense
  accounting_expense_act: {
    id: 'accounting_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_level', level: 10, value: 'Accounting' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Administrative & General Expense (Dept Level 7)
  admin_general_dept_expense_act: {
    id: 'admin_general_dept_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_level', level: 7, value: 'Administrative & General' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Information & Telecom Systems Expense
  info_telecom_systems_expense_act: {
    id: 'info_telecom_systems_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_level', level: 7, value: 'Information & Telecom Systems' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Utilities Expense
  utilities_expense_act: {
    id: 'utilities_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_level', level: 7, value: 'Utilities Dept' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Property Operation & Maintenance Expense
  property_operation_maint_expense_act: {
    id: 'property_operation_maint_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_level', level: 7, value: 'Property Operation & Maintenance' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Sales & Marketing Expense
  sales_marketing_expense_act: {
    id: 'sales_marketing_expense_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'dept_level', level: 7, value: 'Sales & Marketing and Convention Service' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Total Undistributed Operating Expenses
  total_undist_op_exp_act: {
    id: 'total_undist_op_exp_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 2, value: 'Lodging Operations' },
      { type: 'dept_level', level: 4, value: 'Undistributed Operating Expenses' },
      { type: 'acc_level', level: 1, value: 'EBITDA' },
      { type: 'acc_level', level: 6, value: 'Total Expenses' }
    ]
  },

  // F90 P&L - Base Management Fee
  base_mgmt_fee_act: {
    id: 'base_mgmt_fee_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 10, value: 'Invest Factor NonOp' },
      { type: 'acc_base', value: ['A701120', 'A701121'] }
    ]
  },

  // F90 P&L - Incentive Management Fee
  // Note: accounts 701125/701126 are on department D0490, which has a different
  // level_10 value than D0480 ('Invest Factor NonOp'). Use dept_base to target directly.
  incentive_mgmt_fee_act: {
    id: 'incentive_mgmt_fee_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0490' },
      { type: 'acc_base', value: ['A701125', 'A701126'] }
    ]
  },

  // F90 P&L - EBITDA
  ebitda_act: {
    id: 'ebitda_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'acc_level', level: 1, value: 'EBITDA' }
    ]
  },

  // F90 P&L - Net Due To/(From) Owner
  net_due_owner_act: {
    id: 'net_due_owner_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_level', level: 10, value: 'Invest Factor NonOp' },
      { type: 'acc_base', value: ['A700304', 'A701601', 'A701602', 'A701603'] }
    ]
  },

  // ============================================================================
  // F90 KPI Sub-Measures — Detailed management fees, non-op, owner, depreciation
  // ============================================================================

  // Base Management Fee (D0480 - Lease Expenses / Base Fees)
  f90_base_mgmt_fee_act: {
    id: 'f90_base_mgmt_fee_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0480' },
      { type: 'acc_level', level: 13, value: 'Managed Fees' },
      { type: 'acc_level', level: 14, value: 'Lease Expenses' },
      { type: 'acc_level', level: 15, value: 'Base Fees' }
    ]
  },

  // Base Royalty Fee (D0490 - Lease Expenses / Incentive Fees)
  f90_base_royalty_fee_act: {
    id: 'f90_base_royalty_fee_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0490' },
      { type: 'acc_level', level: 13, value: 'Managed Fees' },
      { type: 'acc_level', level: 14, value: 'Lease Expenses' },
      { type: 'acc_level', level: 15, value: 'Incentive Fees' }
    ]
  },

  // Incentive Fee (D0480 - Royalty Costs / Base Fees)
  f90_incentive_fee_act: {
    id: 'f90_incentive_fee_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0480' },
      { type: 'acc_level', level: 13, value: 'Managed Fees' },
      { type: 'acc_level', level: 14, value: 'Royalty Costs' },
      { type: 'acc_level', level: 15, value: 'Base Fees' }
    ]
  },

  // D0480 All Accounts (for exclusion-based NON-OP calculation)
  f90_d0480_all_act: {
    id: 'f90_d0480_all_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0480' },
      { type: 'acc_level', level: 1, value: 'EBITDA' }
    ]
  },

  // D0490 All Accounts (for exclusion-based OWNER EXPENSE calculation)
  f90_d0490_all_act: {
    id: 'f90_d0490_all_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0490' },
      { type: 'acc_level', level: 1, value: 'EBITDA' }
    ]
  },

  // Replacement Reserve — D0480, A701110 only
  f90_replacement_reserve_act: {
    id: 'f90_replacement_reserve_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0480' },
      { type: 'acc_base', value: 'A701110' }
    ]
  },

  // D0690 All Accounts — Owner Depreciation & Amortization
  f90_d0690_all_act: {
    id: 'f90_d0690_all_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0690' },
      { type: 'acc_level', level: 1, value: 'EBITDA' }
    ]
  },

  // D0691 All Accounts — Owner Interest & Income Tax
  f90_d0691_all_act: {
    id: 'f90_d0691_all_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0691' },
      { type: 'acc_level', level: 1, value: 'EBITDA' }
    ]
  },

  // ============================================================================
  // LEVEL 20 — INVEST FACTOR OWNER SUBGROUP SUB-MEASURES
  // Each subgroup is a single filter across all 4 owner departments.
  // Replaces the old prefix/overlap/extra account pattern.
  // ============================================================================

  // Fixed Expenses (debit-balance: stored positive, no negate)
  f90_fixed_expenses_l20_act: {
    id: 'f90_fixed_expenses_l20_act',
    formula: 'CALCULATE',
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Fixed Expenses' }
    ]
  },

  // Depreciation
  f90_depreciation_l20_act: {
    id: 'f90_depreciation_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Depreciation' }
    ]
  },

  // Owner Expense
  f90_owner_expense_l20_act: {
    id: 'f90_owner_expense_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Owner Expense' }
    ]
  },

  // Interest
  f90_interest_l20_act: {
    id: 'f90_interest_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Interest' }
    ]
  },

  // Refurbishment Fund
  f90_refurbishment_fund_l20_act: {
    id: 'f90_refurbishment_fund_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Refurbishment Fund' }
    ]
  },

  // Tax
  f90_tax_l20_act: {
    id: 'f90_tax_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Tax' }
    ]
  },

  // Deferred Tax
  f90_deferred_tax_l20_act: {
    id: 'f90_deferred_tax_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Deferred Tax' }
    ]
  },

  // Dividends
  f90_dividends_l20_act: {
    id: 'f90_dividends_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Dividends' }
    ]
  },

  // Abnormal Items (explicit level_20 match — catch-all residual is computed in the calculated measure)
  f90_abnormal_items_l20_act: {
    id: 'f90_abnormal_items_l20_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: ['D0480', 'D0490', 'D0690', 'D0691'] },
      { type: 'acc_level', level: 20, value: 'Abnormal Items' }
    ]
  },

  // ============================================================================
  // PROTEA ACCOUNT MOVEMENT — A730/A745 insurance/audit sub-measures per dept
  // Used by applyProteaAccountMovement() to shift costs into Admin & General
  // ============================================================================

  protea_moved_accounts_d0480_act: {
    id: 'protea_moved_accounts_d0480_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0480' },
      { type: 'acc_prefix', value: ['A730', 'A745'] }
    ]
  },

  protea_moved_accounts_d0490_act: {
    id: 'protea_moved_accounts_d0490_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0490' },
      { type: 'acc_prefix', value: ['A730', 'A745'] }
    ]
  },

  protea_moved_accounts_d0690_act: {
    id: 'protea_moved_accounts_d0690_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0690' },
      { type: 'acc_prefix', value: ['A730', 'A745'] }
    ]
  },

  protea_moved_accounts_d0691_act: {
    id: 'protea_moved_accounts_d0691_act',
    formula: 'CALCULATE',
    negate: true,
    filters: [
      { type: 'dept_base', value: 'D0691' },
      { type: 'acc_prefix', value: ['A730', 'A745'] }
    ]
  }
};

// ============================================================================
// MEASURE DEFINITIONS
// Final calculations that combine sub-measures with formulas
// ============================================================================

function evaluateDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (denominator === 0) return defaultValue;
  return numerator / denominator;
}

export const MEASURES: Record<string, Measure> = {
  // Key Metrics
  occupancy_rooms: {
    id: 'occupancy_rooms',
    type: 'calculated',
    subMeasures: ['sold_rooms_act', 'total_rooms_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.sold_rooms_act || 0,
        ctx.subMeasures.total_rooms_act || 0,
        0
      ) * 100;
    }
  },

  adr: {
    id: 'adr',
    type: 'calculated',
    subMeasures: ['total_rooms_revenue_act', 'sold_rooms_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_rooms_revenue_act || 0,
        ctx.subMeasures.sold_rooms_act || 0,
        0
      );
    }
  },

  rev_par: {
    id: 'rev_par',
    type: 'calculated',
    subMeasures: ['total_rooms_revenue_act', 'total_rooms_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_rooms_revenue_act || 0,
        ctx.subMeasures.total_rooms_act || 0,
        0
      );
    }
  },

  adr_act_sy: {
    id: 'adr_act_sy',
    type: 'calculated',
    subMeasures: ['total_rooms_revenue_act_sy', 'sold_rooms_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_rooms_revenue_act_sy || 0,
        ctx.subMeasures.sold_rooms_act_sy || 0,
        0
      );
    }
  },

  rev_par_act_sy: {
    id: 'rev_par_act_sy',
    type: 'calculated',
    subMeasures: ['total_rooms_revenue_act_sy', 'total_rooms_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_rooms_revenue_act_sy || 0,
        ctx.subMeasures.total_rooms_act_sy || 0,
        0
      );
    }
  },

  occupancy_rooms_act_sy: {
    id: 'occupancy_rooms_act_sy',
    type: 'calculated',
    subMeasures: ['sold_rooms_act_sy', 'total_rooms_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.sold_rooms_act_sy || 0,
        ctx.subMeasures.total_rooms_act_sy || 0,
        0
      ) * 100;
    }
  },

  all_rev_par_act_sy: {
    id: 'all_rev_par_act_sy',
    type: 'calculated',
    subMeasures: ['total_revenue_act_sy', 'total_rooms_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_revenue_act_sy || 0,
        ctx.subMeasures.total_rooms_act_sy || 0,
        0
      );
    }
  },

  total_revenue_act_sy: {
    id: 'total_revenue_act_sy',
    type: 'simple',
    subMeasures: ['total_revenue_act_sy']
  },

  total_profit_act_sy: {
    id: 'total_profit_act_sy',
    type: 'simple',
    subMeasures: ['total_profit_act_sy']
  },

  total_profit_pct_revenue_sy: {
    id: 'total_profit_pct_revenue_sy',
    type: 'calculated',
    subMeasures: ['total_profit_act_sy', 'total_revenue_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_profit_act_sy || 0,
        ctx.subMeasures.total_revenue_act_sy || 0,
        0
      ) * 100;
    }
  },

  flow_thru_act_sy: {
    id: 'flow_thru_act_sy',
    type: 'calculated',
    subMeasures: ['total_revenue_act_sy', 'total_revenue_act_py1', 'total_profit_act_sy', 'total_profit_act_py1'],
    evaluator: (ctx: MeasureContext) => {
      const revChange = (ctx.subMeasures.total_revenue_act_sy || 0) - (ctx.subMeasures.total_revenue_act_py1 || 0);
      const profitChange = (ctx.subMeasures.total_profit_act_sy || 0) - (ctx.subMeasures.total_profit_act_py1 || 0);
      const ratio = evaluateDivide(profitChange, revChange, 0);

      // SWITCH logic from DAX formula
      if (revChange === 0) return 0; // BLANK() -> 0
      if (revChange > 0) return ratio * 100;
      if (profitChange < 0) return (1 - ratio) * 100;
      return Math.abs(1 - ratio) * 100;
    }
  },

  noi_act_sy: {
    id: 'noi_act_sy',
    type: 'calculated',
    subMeasures: ['lodging_ops_ebitda_act_sy', 'total_hotel_ebitda_act_sy', 'replacement_reserve_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      const lodging = ctx.subMeasures.lodging_ops_ebitda_act_sy || 0;
      const hotel = ctx.subMeasures.total_hotel_ebitda_act_sy || 0;
      const reserve = ctx.subMeasures.replacement_reserve_act_sy || 0;
      return lodging + hotel - reserve;
    }
  },

  total_rooms_revenue_act_sy_measure: {
    id: 'total_rooms_revenue_act_sy_measure',
    type: 'simple',
    subMeasures: ['total_rooms_revenue_act_sy']
  },

  rooms_dept_profit_act_sy_measure: {
    id: 'rooms_dept_profit_act_sy_measure',
    type: 'simple',
    subMeasures: ['rooms_dept_profit_act_sy']
  },

  rooms_dept_profit_pct_revenue_act_sy: {
    id: 'rooms_dept_profit_pct_revenue_act_sy',
    type: 'calculated',
    subMeasures: ['rooms_dept_profit_act_sy', 'total_rooms_revenue_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.rooms_dept_profit_act_sy || 0,
        ctx.subMeasures.total_rooms_revenue_act_sy || 0,
        0
      ) * 100;
    }
  },

  total_fb_revenue_act_sy_measure: {
    id: 'total_fb_revenue_act_sy_measure',
    type: 'simple',
    subMeasures: ['total_fb_revenue_act_sy']
  },

  fb_profit_sy: {
    id: 'fb_profit_sy',
    type: 'simple',
    subMeasures: ['fb_profit_act_sy']
  },

  fb_profit_pct_revenue_act_sy: {
    id: 'fb_profit_pct_revenue_act_sy',
    type: 'calculated',
    subMeasures: ['fb_profit_act_sy', 'total_fb_revenue_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.fb_profit_act_sy || 0,
        ctx.subMeasures.total_fb_revenue_act_sy || 0,
        0
      ) * 100;
    }
  },

  other_revenue_act_sy_measure: {
    id: 'other_revenue_act_sy_measure',
    type: 'simple',
    subMeasures: ['other_revenue_act_sy']
  },

  other_profit_act_sy_measure: {
    id: 'other_profit_act_sy_measure',
    type: 'simple',
    subMeasures: ['other_profit_act_sy']
  },

  other_profit_pct_revenue_act_sy: {
    id: 'other_profit_pct_revenue_act_sy',
    type: 'calculated',
    subMeasures: ['other_profit_act_sy', 'other_revenue_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.other_profit_act_sy || 0,
        ctx.subMeasures.other_revenue_act_sy || 0,
        0
      ) * 100;
    }
  },

  dep_profit_act_sy: {
    id: 'dep_profit_act_sy',
    type: 'calculated',
    subMeasures: ['rooms_dept_profit_act_sy', 'fb_profit_act_sy', 'other_profit_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      const rooms = ctx.subMeasures.rooms_dept_profit_act_sy || 0;
      const fb = ctx.subMeasures.fb_profit_act_sy || 0;
      const other = ctx.subMeasures.other_profit_act_sy || 0;
      return rooms + fb + other;
    }
  },

  dep_profit_pct_revenue_act_sy: {
    id: 'dep_profit_pct_revenue_act_sy',
    type: 'calculated',
    subMeasures: ['dep_profit_act_sy', 'total_rooms_revenue_act_sy', 'total_fb_revenue_act_sy', 'other_revenue_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      const profit = ctx.subMeasures.dep_profit_act_sy || 0;
      const roomsRev = ctx.subMeasures.total_rooms_revenue_act_sy || 0;
      const fbRev = ctx.subMeasures.total_fb_revenue_act_sy || 0;
      const otherRev = ctx.subMeasures.other_revenue_act_sy || 0;
      const totalDepRevenue = roomsRev + fbRev + otherRev;
      return evaluateDivide(profit, totalDepRevenue, 0) * 100;
    }
  },

  admin_wo_cc_act_sy: {
    id: 'admin_wo_cc_act_sy',
    type: 'calculated',
    subMeasures: ['admin_act_sy', 'cc_expense_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      const admin = ctx.subMeasures.admin_act_sy || 0;
      const cc = ctx.subMeasures.cc_expense_act_sy || 0;
      return admin - cc;
    }
  },

  cc_expense_act_sy_measure: {
    id: 'cc_expense_act_sy_measure',
    type: 'simple',
    subMeasures: ['cc_expense_act_sy']
  },

  it_and_telecom_act_sy_measure: {
    id: 'it_and_telecom_act_sy_measure',
    type: 'simple',
    subMeasures: ['it_and_telecom_act_sy']
  },

  utilities_act_sy_measure: {
    id: 'utilities_act_sy_measure',
    type: 'simple',
    subMeasures: ['utilities_act_sy']
  },

  pom_act_sy_measure: {
    id: 'pom_act_sy_measure',
    type: 'simple',
    subMeasures: ['pom_act_sy']
  },

  sales_act_sy_measure: {
    id: 'sales_act_sy_measure',
    type: 'simple',
    subMeasures: ['sales_act_sy']
  },

  other_uoe_act_sy_measure: {
    id: 'other_uoe_act_sy_measure',
    type: 'simple',
    subMeasures: ['other_uoe_act_sy']
  },

  total_uoe_act_sy: {
    id: 'total_uoe_act_sy',
    type: 'calculated',
    subMeasures: ['admin_act_sy', 'it_and_telecom_act_sy', 'utilities_act_sy', 'pom_act_sy', 'sales_act_sy', 'other_uoe_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      const admin = ctx.subMeasures.admin_act_sy || 0;
      const it = ctx.subMeasures.it_and_telecom_act_sy || 0;
      const utilities = ctx.subMeasures.utilities_act_sy || 0;
      const pom = ctx.subMeasures.pom_act_sy || 0;
      const sales = ctx.subMeasures.sales_act_sy || 0;
      const otherUoe = ctx.subMeasures.other_uoe_act_sy || 0;
      return admin + it + utilities + pom + sales + otherUoe;
    }
  },

  total_payroll_act_sy_measure: {
    id: 'total_payroll_act_sy_measure',
    type: 'simple',
    subMeasures: ['total_payroll_act_sy']
  },

  payroll_pct_revenue_act_sy: {
    id: 'payroll_pct_revenue_act_sy',
    type: 'calculated',
    subMeasures: ['total_payroll_expenses_act_sy', 'total_revenue_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_payroll_expenses_act_sy || 0,
        ctx.subMeasures.total_revenue_act_sy || 0,
        0
      ) * 100;
    }
  },

  ta_commission_act_sy_measure: {
    id: 'ta_commission_act_sy_measure',
    type: 'simple',
    subMeasures: ['ta_commission_act_sy']
  },

  cpsr_act: {
    id: 'cpsr_act',
    type: 'calculated',
    subMeasures: ['rooms_expense_act_sy', 'rooms_sold_act_sy'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.rooms_expense_act_sy || 0,
        ctx.subMeasures.rooms_sold_act_sy || 0,
        0
      );
    }
  },

  // Revenue
  total_revenue: {
    id: 'total_revenue',
    type: 'simple',
    subMeasures: ['total_revenue_act']
  },

  rooms_revenue: {
    id: 'rooms_revenue',
    type: 'simple',
    subMeasures: ['total_rooms_revenue_act']
  },

  fb_revenue: {
    id: 'fb_revenue',
    type: 'simple',
    subMeasures: ['total_fb_revenue_act']
  },

  // Profit
  gross_operating_profit: {
    id: 'gross_operating_profit',
    type: 'simple',
    subMeasures: ['total_profit_act']
  },

  gross_operating_profit_margin: {
    id: 'gross_operating_profit_margin',
    type: 'calculated',
    subMeasures: ['total_profit_act', 'total_revenue_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_profit_act || 0,
        ctx.subMeasures.total_revenue_act || 0,
        0
      ) * 100;
    }
  },

  rooms_dept_profit: {
    id: 'rooms_dept_profit',
    type: 'simple',
    subMeasures: ['rooms_dept_profit_act']
  },

  rooms_dept_profit_margin: {
    id: 'rooms_dept_profit_margin',
    type: 'calculated',
    subMeasures: ['rooms_dept_profit_act', 'total_rooms_revenue_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.rooms_dept_profit_act || 0,
        ctx.subMeasures.total_rooms_revenue_act || 0,
        0
      ) * 100;
    }
  },

  fb_dept_profit: {
    id: 'fb_dept_profit',
    type: 'simple',
    subMeasures: ['fb_profit_act']
  },

  fb_dept_profit_margin: {
    id: 'fb_dept_profit_margin',
    type: 'calculated',
    subMeasures: ['fb_profit_act', 'total_fb_revenue_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.fb_profit_act || 0,
        ctx.subMeasures.total_fb_revenue_act || 0,
        0
      ) * 100;
    }
  },

  // NOI
  noi: {
    id: 'noi',
    type: 'calculated',
    subMeasures: ['lodging_ops_ebitda_act', 'total_hotel_ebitda_act', 'replacement_reserve_act'],
    evaluator: (ctx: MeasureContext) => {
      const lodging = ctx.subMeasures.lodging_ops_ebitda_act || 0;
      const hotel = ctx.subMeasures.total_hotel_ebitda_act || 0;
      const reserve = ctx.subMeasures.replacement_reserve_act || 0;
      return lodging + hotel - reserve;
    }
  },

  // F90 P&L - Rooms and Reservations Revenue
  rooms_reservations_revenue: {
    id: 'rooms_reservations_revenue',
    type: 'simple',
    subMeasures: ['rooms_reservations_revenue_act']
  },

  // F90 P&L - Gift Shop Revenue
  gift_shop_revenue: {
    id: 'gift_shop_revenue',
    type: 'simple',
    subMeasures: ['gift_shop_revenue_act']
  },

  // F90 P&L - Restaurants and Room Service Revenue
  restaurants_room_service_revenue: {
    id: 'restaurants_room_service_revenue',
    type: 'simple',
    subMeasures: ['restaurants_room_service_revenue_act']
  },

  // F90 P&L - Lounges Revenue
  lounges_revenue: {
    id: 'lounges_revenue',
    type: 'simple',
    subMeasures: ['lounges_revenue_act']
  },

  // F90 P&L - Audio Visual Revenue
  audio_visual_revenue: {
    id: 'audio_visual_revenue',
    type: 'simple',
    subMeasures: ['audio_visual_revenue_act']
  },

  // F90 P&L - Banquets Revenue
  banquets_revenue: {
    id: 'banquets_revenue',
    type: 'simple',
    subMeasures: ['banquets_revenue_act']
  },

  // F90 P&L - Total F&B Revenue (uses existing sub-measures)
  total_fb_revenue: {
    id: 'total_fb_revenue',
    type: 'simple',
    subMeasures: ['total_fb_revenue_act']
  },

  // F90 P&L - Leisure & Recreation Revenue
  leisure_recreation_revenue: {
    id: 'leisure_recreation_revenue',
    type: 'simple',
    subMeasures: ['leisure_recreation_revenue_act']
  },

  // F90 P&L - Golf Revenue
  golf_revenue: {
    id: 'golf_revenue',
    type: 'simple',
    subMeasures: ['golf_revenue_act']
  },

  // F90 P&L - Spa Revenue
  spa_revenue: {
    id: 'spa_revenue',
    type: 'simple',
    subMeasures: ['spa_revenue_act']
  },

  // F90 P&L - Casino Revenue
  casino_revenue: {
    id: 'casino_revenue',
    type: 'simple',
    subMeasures: ['casino_revenue_act']
  },

  // F90 P&L - Miscellaneous Income Revenue
  misc_income_revenue: {
    id: 'misc_income_revenue',
    type: 'simple',
    subMeasures: ['misc_income_revenue_act']
  },

  // F90 P&L - Drycleaning Revenue
  drycleaning_revenue: {
    id: 'drycleaning_revenue',
    type: 'simple',
    subMeasures: ['drycleaning_revenue_act']
  },

  // F90 P&L - Garage Revenue
  garage_revenue: {
    id: 'garage_revenue',
    type: 'simple',
    subMeasures: ['garage_revenue_act']
  },

  // F90 P&L - Guest Communications Revenue
  guest_communications_revenue: {
    id: 'guest_communications_revenue',
    type: 'simple',
    subMeasures: ['guest_communications_revenue_act']
  },

  // F90 P&L - Total Other Departments Sales
  total_other_dept_sales: {
    id: 'total_other_dept_sales',
    type: 'simple',
    subMeasures: ['total_other_dept_sales_act']
  },

  // F90 P&L - Food Revenue (all F&B departments)
  food_revenue: {
    id: 'food_revenue',
    type: 'simple',
    subMeasures: ['food_rev_act']
  },

  // F90 P&L - Beverage Revenue (all F&B departments)
  beverage_revenue: {
    id: 'beverage_revenue',
    type: 'simple',
    subMeasures: ['bev_rev_act']
  },

  // F90 P&L - Sundry F&B Revenue (Total F&B minus Food minus Beverage)
  sundry_fb_revenue: {
    id: 'sundry_fb_revenue',
    type: 'calculated',
    subMeasures: ['total_fb_revenue_act', 'food_rev_act', 'bev_rev_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.total_fb_revenue_act || 0)
        - (ctx.subMeasures.food_rev_act || 0)
        - (ctx.subMeasures.bev_rev_act || 0);
    }
  },

  // F90 P&L - Food Revenue excluding Banqueting
  food_revenue_excl_banq: {
    id: 'food_revenue_excl_banq',
    type: 'calculated',
    subMeasures: ['food_rev_act', 'banq_food_rev_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.food_rev_act || 0)
        - (ctx.subMeasures.banq_food_rev_act || 0);
    }
  },

  // F90 P&L - Beverage Revenue excluding Banqueting
  beverage_revenue_excl_banq: {
    id: 'beverage_revenue_excl_banq',
    type: 'calculated',
    subMeasures: ['bev_rev_act', 'banq_bev_rev_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.bev_rev_act || 0)
        - (ctx.subMeasures.banq_bev_rev_act || 0);
    }
  },

  // F90 P&L - Sundry F&B Revenue excluding Banqueting
  // Original sundry = total_fb - food - bev; banquet sundry = banquets - banq_food - banq_bev
  sundry_fb_revenue_excl_banq: {
    id: 'sundry_fb_revenue_excl_banq',
    type: 'calculated',
    subMeasures: ['total_fb_revenue_act', 'food_rev_act', 'bev_rev_act', 'banquets_revenue_act', 'banq_food_rev_act', 'banq_bev_rev_act'],
    evaluator: (ctx: MeasureContext) => {
      const originalSundry = (ctx.subMeasures.total_fb_revenue_act || 0)
        - (ctx.subMeasures.food_rev_act || 0)
        - (ctx.subMeasures.bev_rev_act || 0);
      const banqSundry = (ctx.subMeasures.banquets_revenue_act || 0)
        - (ctx.subMeasures.banq_food_rev_act || 0)
        - (ctx.subMeasures.banq_bev_rev_act || 0);
      return originalSundry - banqSundry;
    }
  },

  // F90 P&L - Total Sales
  total_sales: {
    id: 'total_sales',
    type: 'simple',
    subMeasures: ['total_sales_act']
  },

  // F90 P&L - Rooms and Reservations Profit
  rooms_reservations_profit: {
    id: 'rooms_reservations_profit',
    type: 'simple',
    subMeasures: ['rooms_reservations_profit_act']
  },

  // F90 P&L - Gift Shop Profit
  gift_shop_profit: {
    id: 'gift_shop_profit',
    type: 'simple',
    subMeasures: ['gift_shop_profit_act']
  },

  // F90 P&L - Restaurants and Room Service Profit
  restaurants_room_service_profit: {
    id: 'restaurants_room_service_profit',
    type: 'simple',
    subMeasures: ['restaurants_room_service_profit_act']
  },

  // F90 P&L - Lounges Profit
  lounges_profit: {
    id: 'lounges_profit',
    type: 'simple',
    subMeasures: ['lounges_profit_act']
  },

  // F90 P&L - Audio Visual Profit
  audio_visual_profit: {
    id: 'audio_visual_profit',
    type: 'simple',
    subMeasures: ['audio_visual_profit_act']
  },

  // F90 P&L - Banquets Profit
  banquets_profit: {
    id: 'banquets_profit',
    type: 'simple',
    subMeasures: ['banquets_profit_act']
  },

  // F90 P&L - % Food COS
  food_cost_pct_sales: {
    id: 'food_cost_pct_sales',
    type: 'calculated',
    subMeasures: ['food_cost_act', 'food_rev_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.food_cost_act || 0,
        ctx.subMeasures.food_rev_act || 0,
        0
      ) * 100;
    }
  },

  // F90 P&L - % Beverage COS
  bev_cost_pct_sales: {
    id: 'bev_cost_pct_sales',
    type: 'calculated',
    subMeasures: ['bev_cost_act', 'bev_rev_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.bev_cost_act || 0,
        ctx.subMeasures.bev_rev_act || 0,
        0
      ) * 100;
    }
  },

  // F90 P&L - GOP %
  gop_pct: {
    id: 'gop_pct',
    type: 'calculated',
    subMeasures: ['total_profit_act', 'total_sales_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_profit_act || 0,
        ctx.subMeasures.total_sales_act || 0,
        0
      ) * 100;
    }
  },

  // F90 P&L - Rooms Department Profit %
  rooms_dept_profit_pct: {
    id: 'rooms_dept_profit_pct',
    type: 'calculated',
    subMeasures: ['rooms_reservations_profit_act', 'rooms_reservations_revenue_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.rooms_reservations_profit_act || 0,
        ctx.subMeasures.rooms_reservations_revenue_act || 0,
        0
      ) * 100;
    }
  },

  // F90 P&L - F&B Department Profit %
  fb_dept_profit_pct: {
    id: 'fb_dept_profit_pct',
    type: 'calculated',
    subMeasures: ['total_fb_profit_act', 'total_fb_revenue_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_fb_profit_act || 0,
        ctx.subMeasures.total_fb_revenue_act || 0,
        0
      ) * 100;
    }
  },

  // F&B Revenue as % of Total Revenue
  fb_revenue_pct_total: {
    id: 'fb_revenue_pct_total',
    type: 'calculated',
    subMeasures: ['total_fb_revenue_act', 'total_revenue_act'],
    evaluator: (ctx: MeasureContext) => {
      return evaluateDivide(
        ctx.subMeasures.total_fb_revenue_act || 0,
        ctx.subMeasures.total_revenue_act || 0,
        0
      ) * 100;
    }
  },

  // F90 P&L - Total F&B Profit
  total_fb_profit: {
    id: 'total_fb_profit',
    type: 'simple',
    subMeasures: ['total_fb_profit_act']
  },

  // F90 P&L - Total F&B Profit excluding Banqueting
  total_fb_profit_excl_banq: {
    id: 'total_fb_profit_excl_banq',
    type: 'calculated',
    subMeasures: ['total_fb_profit_act', 'banquets_profit_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.total_fb_profit_act || 0)
        - (ctx.subMeasures.banquets_profit_act || 0);
    }
  },

  // F90 P&L - Leisure & Recreation Profit
  leisure_recreation_profit: {
    id: 'leisure_recreation_profit',
    type: 'simple',
    subMeasures: ['leisure_recreation_profit_act']
  },

  // F90 P&L - Golf Profit
  golf_profit: {
    id: 'golf_profit',
    type: 'simple',
    subMeasures: ['golf_profit_act']
  },

  // F90 P&L - Spa Profit
  spa_profit: {
    id: 'spa_profit',
    type: 'simple',
    subMeasures: ['spa_profit_act']
  },

  // F90 P&L - Casino Profit
  casino_profit: {
    id: 'casino_profit',
    type: 'simple',
    subMeasures: ['casino_profit_act']
  },

  // F90 P&L - Miscellaneous Income Profit
  misc_income_profit: {
    id: 'misc_income_profit',
    type: 'simple',
    subMeasures: ['misc_income_profit_act']
  },

  // F90 P&L - Drycleaning Profit (In House)
  drycleaning_profit: {
    id: 'drycleaning_profit',
    type: 'simple',
    subMeasures: ['drycleaning_profit_act']
  },

  // F90 P&L - Garage Profit
  garage_profit: {
    id: 'garage_profit',
    type: 'simple',
    subMeasures: ['garage_profit_act']
  },

  // F90 P&L - Guest Communications Profit
  guest_communications_profit: {
    id: 'guest_communications_profit',
    type: 'simple',
    subMeasures: ['guest_communications_profit_act']
  },

  // F90 P&L - Total Other Departments Profit
  total_other_dept_profit: {
    id: 'total_other_dept_profit',
    type: 'simple',
    subMeasures: ['total_other_dept_profit_act']
  },

  // F90 P&L - Total Department Profit
  total_dept_profit: {
    id: 'total_dept_profit',
    type: 'simple',
    subMeasures: ['total_dept_profit_act']
  },

  // F90 P&L - Administrative and General Expense
  admin_general_expense: {
    id: 'admin_general_expense',
    type: 'simple',
    subMeasures: ['admin_general_expense_act']
  },

  // F90 P&L - Human Resources Expense
  human_resources_expense: {
    id: 'human_resources_expense',
    type: 'simple',
    subMeasures: ['human_resources_expense_act']
  },

  // F90 P&L - Loss Prevention Expense
  loss_prevention_expense: {
    id: 'loss_prevention_expense',
    type: 'simple',
    subMeasures: ['loss_prevention_expense_act']
  },

  // F90 P&L - Accounting Expense
  accounting_expense: {
    id: 'accounting_expense',
    type: 'simple',
    subMeasures: ['accounting_expense_act']
  },

  // F90 P&L - Administrative & General Expense (Dept Level 7)
  admin_general_dept_expense: {
    id: 'admin_general_dept_expense',
    type: 'simple',
    subMeasures: ['admin_general_dept_expense_act']
  },

  // F90 P&L - Information & Telecom Systems Expense
  info_telecom_systems_expense: {
    id: 'info_telecom_systems_expense',
    type: 'simple',
    subMeasures: ['info_telecom_systems_expense_act']
  },

  // F90 P&L - Admin & General + IT combined
  admin_general_and_it_expense: {
    id: 'admin_general_and_it_expense',
    type: 'calculated',
    subMeasures: ['admin_general_dept_expense_act', 'info_telecom_systems_expense_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.admin_general_dept_expense_act || 0)
        + (ctx.subMeasures.info_telecom_systems_expense_act || 0);
    }
  },

  // F90 P&L - Utilities Expense
  utilities_expense: {
    id: 'utilities_expense',
    type: 'simple',
    subMeasures: ['utilities_expense_act']
  },

  // F90 P&L - Property Operation & Maintenance Expense
  property_operation_maint_expense: {
    id: 'property_operation_maint_expense',
    type: 'simple',
    subMeasures: ['property_operation_maint_expense_act']
  },

  // F90 P&L - Sales & Marketing Expense
  sales_marketing_expense: {
    id: 'sales_marketing_expense',
    type: 'simple',
    subMeasures: ['sales_marketing_expense_act']
  },

  // F90 P&L - Total Undistributed Operating Expenses
  total_undist_op_exp: {
    id: 'total_undist_op_exp',
    type: 'simple',
    subMeasures: ['total_undist_op_exp_act']
  },

  // F90 P&L - Base Management Fee
  base_mgmt_fee: {
    id: 'base_mgmt_fee',
    type: 'simple',
    subMeasures: ['base_mgmt_fee_act']
  },

  // F90 P&L - Incentive Management Fee
  incentive_mgmt_fee: {
    id: 'incentive_mgmt_fee',
    type: 'simple',
    subMeasures: ['incentive_mgmt_fee_act']
  },

  // F90 P&L - EBITDA
  ebitda: {
    id: 'ebitda',
    type: 'simple',
    subMeasures: ['ebitda_act']
  },

  // F90 P&L - Net Due To/(From) Owner
  net_due_owner: {
    id: 'net_due_owner',
    type: 'simple',
    subMeasures: ['net_due_owner_act']
  },

  // F90 P&L - Total Rooms (Statistic)
  total_rooms: {
    id: 'total_rooms',
    type: 'simple',
    subMeasures: ['total_rooms_act']
  },

  // F90 P&L - Rooms Sold (Statistic)
  sold_rooms: {
    id: 'sold_rooms',
    type: 'simple',
    subMeasures: ['sold_rooms_act']
  },

  // ============================================================================
  // F90 KPI Measures — Detailed management fees, non-op, owner, depreciation
  // ============================================================================

  // Simple wrappers
  f90_base_mgmt_fee: {
    id: 'f90_base_mgmt_fee',
    type: 'simple',
    subMeasures: ['f90_base_mgmt_fee_act']
  },

  f90_base_royalty_fee: {
    id: 'f90_base_royalty_fee',
    type: 'simple',
    subMeasures: ['f90_base_royalty_fee_act']
  },

  f90_incentive_fee: {
    id: 'f90_incentive_fee',
    type: 'simple',
    subMeasures: ['f90_incentive_fee_act']
  },

  f90_repl_reserve: {
    id: 'f90_repl_reserve',
    type: 'simple',
    subMeasures: ['f90_replacement_reserve_act']
  },

  f90_owner_depr_amort: {
    id: 'f90_owner_depr_amort',
    type: 'simple',
    subMeasures: ['f90_d0690_all_act']
  },

  f90_owner_interest_income_tax: {
    id: 'f90_owner_interest_income_tax',
    type: 'simple',
    subMeasures: ['f90_d0691_all_act']
  },

  // Calculated measures
  f90_total_mgmt_fees: {
    id: 'f90_total_mgmt_fees',
    type: 'calculated',
    subMeasures: ['f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act', 'f90_incentive_fee_act'],
    evaluator: (ctx: MeasureContext) => {
      const baseMgmt = ctx.subMeasures.f90_base_mgmt_fee_act || 0;
      const baseRoyalty = ctx.subMeasures.f90_base_royalty_fee_act || 0;
      const incentive = ctx.subMeasures.f90_incentive_fee_act || 0;
      return baseMgmt + baseRoyalty + incentive;
    }
  },

  f90_income_before_nonop: {
    id: 'f90_income_before_nonop',
    type: 'calculated',
    subMeasures: ['total_profit_act', 'f90_fixed_expenses_l20_act',
      'f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act', 'f90_incentive_fee_act'],
    evaluator: (ctx: MeasureContext) => {
      const gop = ctx.subMeasures.total_profit_act || 0;
      const fixed = ctx.subMeasures.f90_fixed_expenses_l20_act || 0;
      // Management fees (negate:true so values are negative, addition subtracts)
      const fees = (ctx.subMeasures.f90_base_mgmt_fee_act || 0)
        + (ctx.subMeasures.f90_base_royalty_fee_act || 0)
        + (ctx.subMeasures.f90_incentive_fee_act || 0);
      return gop - fixed + fees;
    }
  },

  f90_nonop_inc_exp: {
    id: 'f90_nonop_inc_exp',
    type: 'calculated',
    subMeasures: ['f90_d0480_all_act', 'f90_base_mgmt_fee_act', 'f90_incentive_fee_act', 'f90_replacement_reserve_act'],
    evaluator: (ctx: MeasureContext) => {
      const d0480All = ctx.subMeasures.f90_d0480_all_act || 0;
      const baseMgmt = ctx.subMeasures.f90_base_mgmt_fee_act || 0;
      const incentive = ctx.subMeasures.f90_incentive_fee_act || 0;
      const replReserve = ctx.subMeasures.f90_replacement_reserve_act || 0;
      return d0480All - baseMgmt - incentive - replReserve;
    }
  },

  f90_ebitda_excl_owner: {
    id: 'f90_ebitda_excl_owner',
    type: 'calculated',
    subMeasures: [
      'total_profit_act', 'f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act',
      'f90_incentive_fee_act', 'f90_d0480_all_act', 'f90_replacement_reserve_act'
    ],
    evaluator: (ctx: MeasureContext) => {
      const gop = ctx.subMeasures.total_profit_act || 0;
      const baseMgmt = ctx.subMeasures.f90_base_mgmt_fee_act || 0;
      const baseRoyalty = ctx.subMeasures.f90_base_royalty_fee_act || 0;
      const incentive = ctx.subMeasures.f90_incentive_fee_act || 0;
      const incomeBeforeNonOp = gop + baseMgmt + baseRoyalty + incentive;

      const d0480All = ctx.subMeasures.f90_d0480_all_act || 0;
      const replReserve = ctx.subMeasures.f90_replacement_reserve_act || 0;
      const nonOp = d0480All - baseMgmt - incentive - replReserve;

      return incomeBeforeNonOp + nonOp;
    }
  },

  f90_owner_expense: {
    id: 'f90_owner_expense',
    type: 'calculated',
    subMeasures: ['f90_d0490_all_act', 'f90_base_royalty_fee_act'],
    evaluator: (ctx: MeasureContext) => {
      const d0490All = ctx.subMeasures.f90_d0490_all_act || 0;
      const royaltyFee = ctx.subMeasures.f90_base_royalty_fee_act || 0;
      return d0490All - royaltyFee;
    }
  },

  f90_ebitda: {
    id: 'f90_ebitda',
    type: 'calculated',
    subMeasures: [
      'total_profit_act', 'f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act',
      'f90_incentive_fee_act', 'f90_d0480_all_act', 'f90_replacement_reserve_act',
      'f90_d0490_all_act'
    ],
    evaluator: (ctx: MeasureContext) => {
      const gop = ctx.subMeasures.total_profit_act || 0;
      const baseMgmt = ctx.subMeasures.f90_base_mgmt_fee_act || 0;
      const baseRoyalty = ctx.subMeasures.f90_base_royalty_fee_act || 0;
      const incentive = ctx.subMeasures.f90_incentive_fee_act || 0;
      const incomeBeforeNonOp = gop + baseMgmt + baseRoyalty + incentive;

      const d0480All = ctx.subMeasures.f90_d0480_all_act || 0;
      const replReserve = ctx.subMeasures.f90_replacement_reserve_act || 0;
      const nonOp = d0480All - baseMgmt - incentive - replReserve;
      const ebitdaExclOwner = incomeBeforeNonOp + nonOp;

      const d0490All = ctx.subMeasures.f90_d0490_all_act || 0;
      const ownerExpense = d0490All - baseRoyalty;

      return ebitdaExclOwner + ownerExpense;
    }
  },

  f90_ebitda_less_repl_reserve: {
    id: 'f90_ebitda_less_repl_reserve',
    type: 'calculated',
    subMeasures: [
      'total_profit_act', 'f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act',
      'f90_incentive_fee_act', 'f90_d0480_all_act', 'f90_replacement_reserve_act',
      'f90_d0490_all_act'
    ],
    evaluator: (ctx: MeasureContext) => {
      const gop = ctx.subMeasures.total_profit_act || 0;
      const baseMgmt = ctx.subMeasures.f90_base_mgmt_fee_act || 0;
      const baseRoyalty = ctx.subMeasures.f90_base_royalty_fee_act || 0;
      const incentive = ctx.subMeasures.f90_incentive_fee_act || 0;
      const incomeBeforeNonOp = gop + baseMgmt + baseRoyalty + incentive;

      const d0480All = ctx.subMeasures.f90_d0480_all_act || 0;
      const replReserve = ctx.subMeasures.f90_replacement_reserve_act || 0;
      const nonOp = d0480All - baseMgmt - incentive - replReserve;
      const ebitdaExclOwner = incomeBeforeNonOp + nonOp;

      const d0490All = ctx.subMeasures.f90_d0490_all_act || 0;
      const ownerExpense = d0490All - baseRoyalty;
      const ebitda = ebitdaExclOwner + ownerExpense;

      return ebitda + replReserve;
    }
  },

  f90_total_mgr_profit_contrib: {
    id: 'f90_total_mgr_profit_contrib',
    type: 'calculated',
    subMeasures: [
      'total_profit_act', 'f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act',
      'f90_incentive_fee_act', 'f90_d0480_all_act', 'f90_replacement_reserve_act',
      'f90_d0490_all_act', 'f90_d0690_all_act', 'f90_d0691_all_act'
    ],
    evaluator: (ctx: MeasureContext) => {
      const gop = ctx.subMeasures.total_profit_act || 0;
      const baseMgmt = ctx.subMeasures.f90_base_mgmt_fee_act || 0;
      const baseRoyalty = ctx.subMeasures.f90_base_royalty_fee_act || 0;
      const incentive = ctx.subMeasures.f90_incentive_fee_act || 0;
      const incomeBeforeNonOp = gop + baseMgmt + baseRoyalty + incentive;

      const d0480All = ctx.subMeasures.f90_d0480_all_act || 0;
      const replReserve = ctx.subMeasures.f90_replacement_reserve_act || 0;
      const nonOp = d0480All - baseMgmt - incentive - replReserve;
      const ebitdaExclOwner = incomeBeforeNonOp + nonOp;

      const d0490All = ctx.subMeasures.f90_d0490_all_act || 0;
      const ownerExpense = d0490All - baseRoyalty;
      const ebitda = ebitdaExclOwner + ownerExpense;
      const ebitdaLessReserve = ebitda + replReserve;

      const ownerDepr = ctx.subMeasures.f90_d0690_all_act || 0;
      const ownerInterestTax = ctx.subMeasures.f90_d0691_all_act || 0;
      return ebitdaLessReserve + ownerDepr + ownerInterestTax;
    }
  },

  // F90 P&L - Fixed Expenses (level_20 = 'Fixed Expenses' across all owner departments)
  fixed_expenses: {
    id: 'fixed_expenses',
    type: 'simple',
    subMeasures: ['f90_fixed_expenses_l20_act']
  },

  // F90 P&L - Hotel Profit Before Mgt Fees (MCP minus Fixed Expenses)
  hotel_profit_before_mgt_fees: {
    id: 'hotel_profit_before_mgt_fees',
    type: 'calculated',
    subMeasures: ['total_profit_act', 'f90_fixed_expenses_l20_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.total_profit_act || 0) - (ctx.subMeasures.f90_fixed_expenses_l20_act || 0);
    }
  },

  // F90 P&L - Depreciation (level_20 = 'Depreciation')
  f90_depreciation: {
    id: 'f90_depreciation',
    type: 'simple',
    subMeasures: ['f90_depreciation_l20_act']
  },

  // F90 P&L - Owners Expense (level_20 = 'Owner Expense')
  f90_protea_owner_expense: {
    id: 'f90_protea_owner_expense',
    type: 'simple',
    subMeasures: ['f90_owner_expense_l20_act']
  },

  // F90 P&L - Interest (level_20 = 'Interest')
  f90_interest: {
    id: 'f90_interest',
    type: 'simple',
    subMeasures: ['f90_interest_l20_act']
  },

  // F90 P&L - Refurbishment Fund (level_20 = 'Refurbishment Fund')
  f90_refurbishment_fund: {
    id: 'f90_refurbishment_fund',
    type: 'simple',
    subMeasures: ['f90_refurbishment_fund_l20_act']
  },

  // F90 P&L - Abnormal Items (residual — department totals minus all classified line items)
  // Any account not classified via level_20 automatically falls into this line.
  f90_abnormal_items: {
    id: 'f90_abnormal_items',
    type: 'calculated',
    subMeasures: [
      'total_profit_act', 'f90_d0480_all_act', 'f90_d0490_all_act',
      'f90_d0690_all_act', 'f90_d0691_all_act',
      'f90_fixed_expenses_l20_act',
      'f90_base_mgmt_fee_act', 'f90_base_royalty_fee_act', 'f90_incentive_fee_act',
      'f90_depreciation_l20_act', 'f90_owner_expense_l20_act',
      'f90_interest_l20_act', 'f90_refurbishment_fund_l20_act',
      'f90_tax_l20_act', 'f90_deferred_tax_l20_act', 'f90_dividends_l20_act'
    ],
    evaluator: (ctx: MeasureContext) => {
      // Total across all 4 owner departments (authoritative)
      const deptTotal = (ctx.subMeasures.total_profit_act || 0)
        + (ctx.subMeasures.f90_d0480_all_act || 0)
        + (ctx.subMeasures.f90_d0490_all_act || 0)
        + (ctx.subMeasures.f90_d0690_all_act || 0)
        + (ctx.subMeasures.f90_d0691_all_act || 0);

      // Sum of all classified line items (each negate:true → negative values, except fixed expenses)
      const fixed = ctx.subMeasures.f90_fixed_expenses_l20_act || 0;  // positive (no negate)
      const fees = (ctx.subMeasures.f90_base_mgmt_fee_act || 0)
        + (ctx.subMeasures.f90_base_royalty_fee_act || 0)
        + (ctx.subMeasures.f90_incentive_fee_act || 0);               // negative (negate:true)
      const depreciation = ctx.subMeasures.f90_depreciation_l20_act || 0;
      const ownerExp = ctx.subMeasures.f90_owner_expense_l20_act || 0;
      const interest = ctx.subMeasures.f90_interest_l20_act || 0;
      const refurbFund = ctx.subMeasures.f90_refurbishment_fund_l20_act || 0;
      const tax = ctx.subMeasures.f90_tax_l20_act || 0;
      const deferredTax = ctx.subMeasures.f90_deferred_tax_l20_act || 0;
      const dividends = ctx.subMeasures.f90_dividends_l20_act || 0;

      // Residual: department total minus all classified amounts = abnormal items
      return deptTotal + fixed + fees + depreciation + ownerExp + interest + refurbFund + tax + deferredTax + dividends;
    }
  },

  // F90 P&L - Profit Before Tax (department totals minus Tax and Deferred Tax)
  f90_profit_before_tax: {
    id: 'f90_profit_before_tax',
    type: 'calculated',
    subMeasures: [
      'total_profit_act', 'f90_d0480_all_act', 'f90_d0490_all_act',
      'f90_d0690_all_act', 'f90_d0691_all_act',
      'f90_tax_l20_act', 'f90_deferred_tax_l20_act'
    ],
    evaluator: (ctx: MeasureContext) => {
      const deptTotal = (ctx.subMeasures.total_profit_act || 0)
        + (ctx.subMeasures.f90_d0480_all_act || 0)
        + (ctx.subMeasures.f90_d0490_all_act || 0)
        + (ctx.subMeasures.f90_d0690_all_act || 0)
        + (ctx.subMeasures.f90_d0691_all_act || 0);
      // Tax and Deferred Tax are negate:true (negative), so subtracting them adds them back
      const tax = (ctx.subMeasures.f90_tax_l20_act || 0)
        + (ctx.subMeasures.f90_deferred_tax_l20_act || 0);
      return deptTotal - tax;
    }
  },

  // F90 P&L - Tax (level_20 = 'Tax')
  f90_tax: {
    id: 'f90_tax',
    type: 'simple',
    subMeasures: ['f90_tax_l20_act']
  },

  // F90 P&L - Deferred Tax (level_20 = 'Deferred Tax')
  f90_deferred_tax: {
    id: 'f90_deferred_tax',
    type: 'simple',
    subMeasures: ['f90_deferred_tax_l20_act']
  },

  // F90 P&L - Net Profit (all department totals — includes everything)
  f90_net_profit: {
    id: 'f90_net_profit',
    type: 'calculated',
    subMeasures: ['total_profit_act', 'f90_d0480_all_act', 'f90_d0490_all_act',
      'f90_d0690_all_act', 'f90_d0691_all_act'],
    evaluator: (ctx: MeasureContext) => {
      return (ctx.subMeasures.total_profit_act || 0)
        + (ctx.subMeasures.f90_d0480_all_act || 0)
        + (ctx.subMeasures.f90_d0490_all_act || 0)
        + (ctx.subMeasures.f90_d0690_all_act || 0)
        + (ctx.subMeasures.f90_d0691_all_act || 0);
    }
  },

  // F90 P&L - Dividends (level_20 = 'Dividends')
  f90_dividends: {
    id: 'f90_dividends',
    type: 'simple',
    subMeasures: ['f90_dividends_l20_act']
  },

  // F90 P&L - Profit After Dividends (net profit + dividends)
  f90_profit_after_dividends: {
    id: 'f90_profit_after_dividends',
    type: 'calculated',
    subMeasures: ['total_profit_act', 'f90_d0480_all_act', 'f90_d0490_all_act',
      'f90_d0690_all_act', 'f90_d0691_all_act', 'f90_dividends_l20_act'],
    evaluator: (ctx: MeasureContext) => {
      const netProfit = (ctx.subMeasures.total_profit_act || 0)
        + (ctx.subMeasures.f90_d0480_all_act || 0)
        + (ctx.subMeasures.f90_d0490_all_act || 0)
        + (ctx.subMeasures.f90_d0690_all_act || 0)
        + (ctx.subMeasures.f90_d0691_all_act || 0);
      // Dividends is negate:true (negative), so addition subtracts
      return netProfit + (ctx.subMeasures.f90_dividends_l20_act || 0);
    }
  },

  // Protea Report: Original GOP % (pre-movement, before insurance/audit accounts shift to Admin & General)
  // After applyProteaAccountMovement() mutates total_profit_act, this reverses the adjustment to recover the original GOP.
  protea_original_gop_pct: {
    id: 'protea_original_gop_pct',
    type: 'calculated',
    subMeasures: ['total_profit_act',
      'protea_moved_accounts_d0480_act', 'protea_moved_accounts_d0490_act',
      'protea_moved_accounts_d0690_act', 'protea_moved_accounts_d0691_act',
      'total_sales_act'],
    evaluator: (ctx: MeasureContext) => {
      const adjustedMcp = ctx.subMeasures.total_profit_act || 0;
      const moved = (ctx.subMeasures.protea_moved_accounts_d0480_act || 0)
        + (ctx.subMeasures.protea_moved_accounts_d0490_act || 0)
        + (ctx.subMeasures.protea_moved_accounts_d0690_act || 0)
        + (ctx.subMeasures.protea_moved_accounts_d0691_act || 0);
      const originalGop = adjustedMcp - moved;
      return evaluateDivide(originalGop, ctx.subMeasures.total_sales_act || 0, 0) * 100;
    }
  }
};
