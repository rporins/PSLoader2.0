import pl, { DataFrame, DataType, Series } from "nodejs-polars";

// base department interface matching the database
interface Department {
  department_id: string;
  d_easy_name: string;
  d_is_locked: number;
  d_level_1: string;
  d_level_2: string;
  d_level_3: string;
  d_level_4: string;
  d_level_5: string;
  d_level_6: string;
  d_level_7: string;
  d_level_8: string;
  d_level_9: string;
  d_level_10: string;
  d_level_11: string;
  d_level_12: string;
  d_level_13: string;
  d_level_14: string;
  d_level_15: string;
  d_level_16: string;
  d_level_17: string;
  d_level_18: string;
  d_level_19: string;
  d_level_20: string;
  d_level_21: string;
  d_level_22: string;
  d_level_23: string;
  d_level_24: string;
  d_level_25: string;
  d_level_26: string;
  d_level_27: string;
  d_level_28: string;
  d_level_29: string;
  d_level_30: string;
}

// base account interface matching the database
interface Account {
  account_id: string;
  a_easy_name: string;
  a_is_stat: number;
  a_is_locked: number;
  a_level_1: string;
  a_level_2: string;
  a_level_3: string;
  a_level_4: string;
  a_level_5: string;
  a_level_6: string;
  a_level_7: string;
  a_level_8: string;
  a_level_9: string;
  a_level_10: string;
  a_level_11: string;
  a_level_12: string;
  a_level_13: string;
  a_level_14: string;
  a_level_15: string;
  a_level_16: string;
  a_level_17: string;
  a_level_18: string;
  a_level_19: string;
  a_level_20: string;
  a_level_21: string;
  a_level_22: string;
  a_level_23: string;
  a_level_24: string;
  a_level_25: string;
  a_level_26: string;
  a_level_27: string;
  a_level_28: string;
  a_level_29: string;
  a_level_30: string;
}

// base department account interface matching the database
interface FinancialData {
  dep_acc_combo_id: string;
  month: number;
  year: number;
  period_combo: string;
  scenario: string;
  amount: number;
  count: number;
  currency: string;
  last_modified: string;
  item_version: number;
}

// base department account interface matching the database
interface DepartmentAccount {
  dep_acc_combo_id: string;
  department_id: string;
  account_id: string;
  is_locked: number;
}

// Cached DataFrames
let finDataFrame: DataFrame | null = null;
let depAccDataFrame: DataFrame | null = null;
let accDataFrame: DataFrame | null = null;
let depDataFrame: DataFrame | null = null;

/**
 * Updates or creates Polars DataFrames using provided data, ensuring proper type casting.
 * @param tables - The tables returned from getAllDataForPolarsCache.
 * @returns An object containing the Polars DataFrames.
 */
export function updatePolarsDataFrames(tables: {
  fin_table_rows: FinancialData[];
  dep_acc_table_rows: DepartmentAccount[];
  acc_table_rows: Account[];
  dep_table_rows: Department[];
}): boolean {
  const { fin_table_rows, dep_acc_table_rows, acc_table_rows, dep_table_rows } = tables;
  // Create or update the DataFrames with explicit types
  finDataFrame = createOrUpdateDataFrame(finDataFrame, fin_table_rows, [
    ["dep_acc_combo_id", DataType.Utf8],
    ["month", DataType.Int32],
    ["year", DataType.Int32],
    ["period_combo", DataType.Utf8],
    ["scenario", DataType.Utf8],
    ["amount", DataType.Float64],
    ["count", DataType.Int32],
    ["currency", DataType.Utf8],
    ["last_modified", DataType.Utf8],
    ["item_version", DataType.Int32],
  ]);

  depAccDataFrame = createOrUpdateDataFrame(depAccDataFrame, dep_acc_table_rows, [
    ["dep_acc_combo_id", DataType.Utf8],
    ["department_id", DataType.Utf8],
    ["account_id", DataType.Utf8],
    ["is_locked", DataType.Int32],
  ]);

  accDataFrame = createOrUpdateDataFrame(accDataFrame, acc_table_rows, [
    ["account_id", DataType.Utf8],
    ["a_easy_name", DataType.Utf8],
    ["a_is_stat", DataType.Int32],
    ["a_is_locked", DataType.Int32],
    ["a_level_1", DataType.Utf8],
    ["a_level_2", DataType.Utf8],
    ["a_level_3", DataType.Utf8],
    ["a_level_4", DataType.Utf8],
    ["a_level_5", DataType.Utf8],
    ["a_level_6", DataType.Utf8],
    ["a_level_7", DataType.Utf8],
    ["a_level_8", DataType.Utf8],
    ["a_level_9", DataType.Utf8],
    ["a_level_10", DataType.Utf8],
    ["a_level_11", DataType.Utf8],
    ["a_level_12", DataType.Utf8],
    ["a_level_13", DataType.Utf8],
    ["a_level_14", DataType.Utf8],
    ["a_level_15", DataType.Utf8],
    ["a_level_16", DataType.Utf8],
    ["a_level_17", DataType.Utf8],
    ["a_level_18", DataType.Utf8],
    ["a_level_19", DataType.Utf8],
    ["a_level_20", DataType.Utf8],
    ["a_level_21", DataType.Utf8],
    ["a_level_22", DataType.Utf8],
    ["a_level_23", DataType.Utf8],
    ["a_level_24", DataType.Utf8],
    ["a_level_25", DataType.Utf8],
    ["a_level_26", DataType.Utf8],
    ["a_level_27", DataType.Utf8],
    ["a_level_28", DataType.Utf8],
    ["a_level_29", DataType.Utf8],
    ["a_level_30", DataType.Utf8],
  ]);

  depDataFrame = createOrUpdateDataFrame(depDataFrame, dep_table_rows, [
    ["department_id", DataType.Utf8],
    ["d_easy_name", DataType.Utf8],
    ["d_is_locked", DataType.Int32],
    ["d_level_1", DataType.Utf8],
    ["d_level_2", DataType.Utf8],
    ["d_level_3", DataType.Utf8],
    ["d_level_4", DataType.Utf8],
    ["d_level_5", DataType.Utf8],
    ["d_level_6", DataType.Utf8],
    ["d_level_7", DataType.Utf8],
    ["d_level_8", DataType.Utf8],
    ["d_level_9", DataType.Utf8],
    ["d_level_10", DataType.Utf8],
    ["d_level_11", DataType.Utf8],
    ["d_level_12", DataType.Utf8],
    ["d_level_13", DataType.Utf8],
    ["d_level_14", DataType.Utf8],
    ["d_level_15", DataType.Utf8],
    ["d_level_16", DataType.Utf8],
    ["d_level_17", DataType.Utf8],
    ["d_level_18", DataType.Utf8],
    ["d_level_19", DataType.Utf8],
    ["d_level_20", DataType.Utf8],
    ["d_level_21", DataType.Utf8],
    ["d_level_22", DataType.Utf8],
    ["d_level_23", DataType.Utf8],
    ["d_level_24", DataType.Utf8],
    ["d_level_25", DataType.Utf8],
    ["d_level_26", DataType.Utf8],
    ["d_level_27", DataType.Utf8],
    ["d_level_28", DataType.Utf8],
    ["d_level_29", DataType.Utf8],
    ["d_level_30", DataType.Utf8],
  ]);

  return (
    Array.isArray(fin_table_rows) &&
    fin_table_rows.length > 0 &&
    Array.isArray(dep_acc_table_rows) &&
    dep_acc_table_rows.length > 0 &&
    Array.isArray(acc_table_rows) &&
    acc_table_rows.length > 0 &&
    Array.isArray(dep_table_rows) &&
    dep_table_rows.length > 0
  );
}

/**
 * Creates or updates a DataFrame based on the input data with a specified schema.
 * @param existingDataFrame The existing DataFrame (if any).
 * @param data The new data to populate the DataFrame.
 * @param schema The schema to enforce on the DataFrame (column name and type pairs).
 * @returns A new or updated DataFrame.
 */

function createOrUpdateDataFrame<T>(existingDataFrame: DataFrame | null, data: T[], schema: [string, DataType][]): DataFrame {
  if (existingDataFrame) {
    console.log("Rebuilding DataFrame...");
  } else {
    console.log("Creating new DataFrame...");
  }

  // Convert data into columns and validate against the schema
  const columns = schema.map(([columnName, dataType]) => {
    const columnData = data.map((row) => (row as any)[columnName]);
    if (columnData.some((value) => value === undefined)) {
      console.warn(`Column "${columnName}" contains undefined values.`);
    }
    return pl.Series(columnName, columnData).cast(dataType); // Ensure correct data type
  });

  // Create a new DataFrame from the columns
  const newDataFrame = pl.DataFrame(columns);

  // Update the existing DataFrame, if provided
  if (existingDataFrame) {
    return existingDataFrame.vstack(newDataFrame);
  }

  return newDataFrame;
}

export function testCount() {
  if (finDataFrame) {
    try {
      // Get the count of rows in the `item_version` column
      const count = finDataFrame.filter(pl.col("item_version").isNotNull()).height;
      console.log("Count of rows in 'item_version':", count);
    } catch (error) {
      console.error("Error accessing the 'item_version' column:", error.message);
    }
  } else {
    console.error("finDataFrame is not defined.");
  }
}
