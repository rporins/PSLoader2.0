import { SubMeasure, Measure, MeasureContext } from '../../types/plReportTypes';

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
  }
};
