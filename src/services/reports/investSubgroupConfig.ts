// ============================================================================
// INVEST FACTOR OWNER — SHARED SUBGROUP CONFIGURATION
// Single source of truth for account classification used by both the Invest
// Factor Owner summary tab (proteaReportPackService) and the F90 P&L measures
// (plMeasureDefinitions).  Accounts are assigned by priority:
//   explicit accounts → deptFilter → level_13 hierarchy → accPrefixes → catch-all.
// ============================================================================

export interface InvestSubgroupDef {
  name: string;
  accounts: string[];         // Explicit account codes (highest priority)
  accPrefixes?: string[];     // Prefix patterns (2nd priority after level_13)
  excludeAccounts?: string[]; // Accounts to exclude from prefix matches
  useLevel13?: string;        // Match level_13 value (for Management Fees)
  deptFilter?: string[];      // ALL accounts from these depts go here
  isCatchAll?: boolean;       // Captures all unmatched accounts
}

export const INVEST_CUSTOM_SUBGROUPS: InvestSubgroupDef[] = [
  { name: 'Depreciation',    accounts: ['A766931', 'A710001', 'A711001'], deptFilter: ['D0690'] },
  { name: 'Fixed Expenses',  accounts: ['A701025', 'A701728', 'A740002', 'A715103'],
                              accPrefixes: ['A701', 'A770'], excludeAccounts: ['A701501', 'A701502'] },
  { name: 'Net Interest Income / (Expense)',    accounts: ['A726001', 'A726103'], accPrefixes: ['A726'] },
  { name: 'Tax',             accounts: ['A720908', 'A720901', 'A720601'], accPrefixes: ['A72090'] },
  { name: 'Owners Expense',  accounts: ['A701601', 'A720701', 'A701502'] },
  { name: 'Management Fees', accounts: [], useLevel13: 'Managed Fees' },
  { name: 'Abnormal Items',  accounts: ['A701602', 'A701130', 'A701501'], isCatchAll: true },
];

// ---------------------------------------------------------------------------
// Accessor helpers — used by plMeasureDefinitions.ts to derive F90 filters
// from this single config instead of hardcoding account lists.
// ---------------------------------------------------------------------------

function findSubgroup(name: string): InvestSubgroupDef {
  const sg = INVEST_CUSTOM_SUBGROUPS.find(s => s.name === name);
  if (!sg) throw new Error(`Unknown invest subgroup: ${name}`);
  return sg;
}

/** Explicit account codes for a subgroup. */
export function getSubgroupAccounts(name: string): string[] {
  return findSubgroup(name).accounts;
}

/** Prefix patterns for a subgroup (empty array if none). */
export function getSubgroupPrefixes(name: string): string[] {
  return findSubgroup(name).accPrefixes || [];
}

/** Accounts excluded from a subgroup's prefix matches (empty array if none). */
export function getSubgroupExcludeAccounts(name: string): string[] {
  return findSubgroup(name).excludeAccounts || [];
}

/** Department filter for a subgroup (undefined if none). */
export function getSubgroupDeptFilter(name: string): string[] | undefined {
  return findSubgroup(name).deptFilter;
}

/** Level 13 hierarchy value for a subgroup (undefined if none). */
export function getSubgroupLevel13(name: string): string | undefined {
  return findSubgroup(name).useLevel13;
}

// ---------------------------------------------------------------------------
// Fixed Expenses overlap derivation
// Fixed Expenses uses broad A701*/A770* prefixes, but several accounts within
// that range belong to other subgroups and must be subtracted as overlaps.
// ---------------------------------------------------------------------------

function matchesAnyPrefix(account: string, prefixes: string[]): boolean {
  return prefixes.some(p => account.startsWith(p));
}

/**
 * Returns accounts from other subgroups that fall within Fixed Expenses'
 * prefix range and must be subtracted as overlaps.
 */
export function getFixedExpensesOverlapAccounts(): {
  ownerOverlap: string[];
  abnormalOverlap: string[];
} {
  const fePrefixes = getSubgroupPrefixes('Fixed Expenses');
  const ownerAccounts = getSubgroupAccounts('Owners Expense');
  const abnormalAccounts = getSubgroupAccounts('Abnormal Items');

  return {
    ownerOverlap: ownerAccounts.filter(a => matchesAnyPrefix(a, fePrefixes)),
    abnormalOverlap: abnormalAccounts.filter(a => matchesAnyPrefix(a, fePrefixes)),
  };
}

/**
 * Returns Fixed Expenses explicit accounts that do NOT match its own
 * prefixes (e.g. A740002, A715103).  These need a separate acc_base measure.
 */
export function getFixedExpensesExtraAccounts(): string[] {
  const sg = findSubgroup('Fixed Expenses');
  const prefixes = sg.accPrefixes || [];
  return sg.accounts.filter(a => !matchesAnyPrefix(a, prefixes));
}

// ---------------------------------------------------------------------------
// Tax "extra" accounts — explicit Tax accounts that don't match the Tax
// prefix (e.g. A720601 doesn't match A72090*).
// ---------------------------------------------------------------------------

export function getTaxExtraAccounts(): string[] {
  const sg = findSubgroup('Tax');
  const prefixes = sg.accPrefixes || [];
  return sg.accounts.filter(a => !matchesAnyPrefix(a, prefixes));
}

// ---------------------------------------------------------------------------
// Unclassified-account validation
// Runs the same priority logic the Invest tab uses.  Any account that only
// matches via catch-all is returned — useful for flagging accounts that the
// F90 line items don't explicitly classify.  The F90 now handles these via
// a residual Abnormal Items calculation (department totals minus classified
// line items), effectively replicating catch-all behaviour.
// ---------------------------------------------------------------------------

export function findUnclassifiedAccounts(
  actualAccounts: Array<{ account: string; level_13?: string; dept?: string }>
): string[] {
  const catchAllName = INVEST_CUSTOM_SUBGROUPS.find(sg => sg.isCatchAll)?.name;
  const unclassified: string[] = [];

  for (const { account, level_13, dept } of actualAccounts) {
    // Priority 1: explicit accounts
    if (INVEST_CUSTOM_SUBGROUPS.some(sg => sg.accounts.includes(account))) continue;

    // Priority 2: deptFilter
    if (dept && INVEST_CUSTOM_SUBGROUPS.some(sg => sg.deptFilter?.includes(dept))) continue;

    // Priority 3: level_13 match
    if (level_13 && INVEST_CUSTOM_SUBGROUPS.some(sg => sg.useLevel13 && sg.useLevel13 === level_13)) continue;

    // Priority 4: prefix match (with excludes)
    let prefixMatched = false;
    for (const sg of INVEST_CUSTOM_SUBGROUPS) {
      if (!sg.accPrefixes) continue;
      if (sg.excludeAccounts?.includes(account)) continue;
      if (sg.accPrefixes.some(prefix => account.startsWith(prefix))) {
        prefixMatched = true;
        break;
      }
    }
    if (prefixMatched) continue;

    // Priority 5: catch-all — this account is unclassified for F90 purposes
    if (catchAllName) {
      unclassified.push(account);
    }
  }

  return unclassified;
}
