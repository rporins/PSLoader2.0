import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { createClient, Client } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const secretKey = process.env.TEMP_DB_KEY; // will be pulled from the server and used for creation, encryption, and decryption of the database
const documentsPath = app.getPath("documents");
const psLoaderFolderPath = path.join(documentsPath, "PSLoader");
// Set the SQLite database file path
// Ensure the "PSLoader" folder exists, create it if it doesn't
if (!fs.existsSync(psLoaderFolderPath)) {
  fs.mkdirSync(psLoaderFolderPath, { recursive: true });
}
const dbPath = path.join(psLoaderFolderPath, "psloader.db");
// Enable secret key after testing
// Create a new SQLite client
const client = createClient({
  url: "file:" + dbPath,
  //encryptionKey: secretKey,
});

const dbExists = fs.existsSync(dbPath);

//------------------------------------------------------------------------------------------------------------------
//------DEFINE ALL INTERFACES -------------------------------------------------------------------------------------
// Interface for Financial Data Row used for front end mainly
interface FinancialDataRow {
  combo: string;
  department: string;
  account: string;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  p8: number;
  p9: number;
  p10: number;
  p11: number;
  p12: number;
}

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
  ou?: string;
  department?: string;
  account?: string;
  version?: string;
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

//------------------------------------------------------------------------------------------------------------------
//--- MIGRATE DATABASE FOR NEW COLUMNS ---------------------------------------------------------------------------
async function migrateFinancialDataTable() {
  try {
    // Check if the new columns already exist
    const tableInfo = await client.execute({
      sql: "PRAGMA table_info(financial_data)",
      args: []
    });

    const columnNames = tableInfo.rows.map(row => row.name as string);
    const newColumns = ['ou', 'department', 'account', 'version'];
    const columnsToAdd = newColumns.filter(col => !columnNames.includes(col));

    if (columnsToAdd.length > 0) {
      console.log("Migrating financial_data table to add new columns:", columnsToAdd.join(', '));

      // Add new columns one by one
      const alterQueries = columnsToAdd.map(col => ({
        sql: `ALTER TABLE financial_data ADD COLUMN ${col} TEXT`,
        args: [] as any[]
      }));

      await client.batch(alterQueries);
      console.log("Successfully added new columns to financial_data table");
    } else {
      console.log("Financial_data table already has all required columns");
    }
  } catch (error) {
    console.error("Error during financial_data migration:", error);
    // If table doesn't exist, it will be created with the new schema
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- INITIALIZE DATABASE ---------------------------------------------------------------------------------------
//create database if it doesn't exist
export async function initializeDatabase() {
  try {
    if (dbExists) {
      console.log("Database opened successfully at:", dbPath);
    } else {
      console.log("Database does not exist, creating a new one...");
    }

    // Set WAL mode (not required explicitly with libsql but mentioned here for behavior reference)
    // Equivalent operations to WAL and encryption key settings can be considered

    // Create necessary tables
    await client.batch([
      `
        CREATE TABLE IF NOT EXISTS user_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS hotels_cache (
            ou TEXT PRIMARY KEY,
            hotel_name TEXT NOT NULL,
            room_count INTEGER NOT NULL,
            cached_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS departments (
            department_id TEXT PRIMARY KEY,
            d_easy_name TEXT NOT NULL,
            d_is_locked BOOLEAN NOT NULL DEFAULT 0,
            d_level_1 TEXT,
            d_level_2 TEXT,
            d_level_3 TEXT,
            d_level_4 TEXT,
            d_level_5 TEXT,
            d_level_6 TEXT,
            d_level_7 TEXT,
            d_level_8 TEXT,
            d_level_9 TEXT,
            d_level_10 TEXT,
            d_level_11 TEXT,
            d_level_12 TEXT,
            d_level_13 TEXT,
            d_level_14 TEXT,
            d_level_15 TEXT,
            d_level_16 TEXT,
            d_level_17 TEXT,
            d_level_18 TEXT,
            d_level_19 TEXT,
            d_level_20 TEXT,
            d_level_21 TEXT,
            d_level_22 TEXT,
            d_level_23 TEXT,
            d_level_24 TEXT,
            d_level_25 TEXT,
            d_level_26 TEXT,
            d_level_27 TEXT,
            d_level_28 TEXT,
            d_level_29 TEXT,
            d_level_30 TEXT
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS accounts (
            account_id TEXT PRIMARY KEY,
            a_easy_name TEXT NOT NULL,
            a_is_stat BOOLEAN NOT NULL DEFAULT 0, 
            a_is_locked BOOLEAN NOT NULL DEFAULT 0, 
            a_level_1 TEXT,
            a_level_2 TEXT,
            a_level_3 TEXT,
            a_level_4 TEXT,
            a_level_5 TEXT,
            a_level_6 TEXT,
            a_level_7 TEXT,
            a_level_8 TEXT,
            a_level_9 TEXT,
            a_level_10 TEXT,
            a_level_11 TEXT,
            a_level_12 TEXT,
            a_level_13 TEXT,
            a_level_14 TEXT,
            a_level_15 TEXT,
            a_level_16 TEXT,
            a_level_17 TEXT,
            a_level_18 TEXT,
            a_level_19 TEXT,
            a_level_20 TEXT,
            a_level_21 TEXT,
            a_level_22 TEXT,
            a_level_23 TEXT,
            a_level_24 TEXT,
            a_level_25 TEXT,
            a_level_26 TEXT,
            a_level_27 TEXT,
            a_level_28 TEXT,
            a_level_29 TEXT,
            a_level_30 TEXT
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS department_accounts (
            dep_acc_combo_id TEXT PRIMARY KEY,  
            department_id TEXT NOT NULL,    
            account_id TEXT NOT NULL,
            is_locked BOOLEAN NOT NULL DEFAULT 0,    
            FOREIGN KEY(department_id) REFERENCES departments(department_id),
            FOREIGN KEY(account_id) REFERENCES accounts(account_id)
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS financial_data (
            dep_acc_combo_id TEXT NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            period_combo TEXT NOT NULL,
            scenario TEXT NOT NULL,
            amount REAL NOT NULL,
            count REAL,
            currency TEXT NOT NULL,
            ou TEXT,
            department TEXT,
            account TEXT,
            version TEXT,
            last_modified TEXT DEFAULT CURRENT_TIMESTAMP,
            item_version INTEGER DEFAULT 1,
            FOREIGN KEY(dep_acc_combo_id) REFERENCES department_accounts(dep_acc_combo_id),
            PRIMARY KEY (dep_acc_combo_id, period_combo, scenario)
        )
        `,
    ]);

    console.log("All necessary tables have been created or already exist.");

    // Run migration to add new columns to existing databases
    await migrateFinancialDataTable();
  } catch (error) {
    console.error("Error during database initialization:", error);
  }
}

// Helper function to generate periods
function generatePeriods(startPeriod: string, count: number): string[] {
  const periods = [];
  const [startYear, startMonth] = startPeriod.split("-").map(Number);

  for (let i = 0; i < count; i++) {
    const date = new Date(startYear, startMonth - 1 + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    periods.push(`${year}-${month}`);
  }

  return periods;
}

//------------------------------------------------------------------------------------------------------------------
//----------------- GET 12 PERIODS ------------------------------------------------------------------------------
// interface defined in common area at the top
// Function to retrieve 12 periods of financial data
export async function get12Periods(...args: unknown[]): Promise<string> {
  // Validation
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const allowedScenarios = ["ACT", "BUD", "PY1", "PY2", "PY3", "FCST"];

  const period = args[0] as string;
  const scenario = args[1] as string;

  if (!periodRegex.test(period)) {
    throw new Error("Invalid period format. Expected 'YYYY-MM'.");
  }

  if (!allowedScenarios.includes(scenario)) {
    throw new Error("Invalid scenario. Expected one of 'ACT', 'BUD', 'PY1', 'PY2', 'PY3', or 'FCST'.");
  }

  const numberOfPeriods = 12;
  const periods = generatePeriods(period, numberOfPeriods); // Array of 'YYYY-MM' strings
  const params = [...periods, scenario];

  try {
    const query = `
        SELECT 
            fd.dep_acc_combo_id AS combo, 
            d.d_easy_name AS department, 
            a.a_easy_name AS account, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p1, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p2, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p3, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p4, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p5, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p6, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p7, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p8, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p9, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p10, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p11, 
            SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS p12 
        FROM financial_data fd
        JOIN department_accounts da ON fd.dep_acc_combo_id = da.dep_acc_combo_id
        JOIN departments d ON da.department_id = d.department_id
        JOIN accounts a ON da.account_id = a.account_id
        WHERE fd.scenario = ?
        GROUP BY fd.dep_acc_combo_id, d.d_easy_name, a.a_easy_name
      `;

    // Execute the query
    const resultSet = await client.execute({ sql: query, args: params });

    // Access rows and assert their type
    const rows = resultSet.rows as unknown as FinancialDataRow[];

    let idCounter = 1;
    const result = rows.map((row) => ({
      id: idCounter++,
      combo: row.combo,
      department: row.department,
      account: row.account,
      p1: row.p1,
      p2: row.p2,
      p3: row.p3,
      p4: row.p4,
      p5: row.p5,
      p6: row.p6,
      p7: row.p7,
      p8: row.p8,
      p9: row.p9,
      p10: row.p10,
      p11: row.p11,
      p12: row.p12,
    }));

    return JSON.stringify(result);
  } catch (error) {
    console.error("Error fetching financial data:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//----------------- UPDATE 12 PERIODS ----------------------------------------------------------------------------
// Function to update 12 periods
export async function update12Periods(...args: unknown[]): Promise<string> {
  // Validation
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const allowedScenarios = ["ACT", "BUD", "PY1", "PY2", "PY3", "FCST"];

  const period = args[0] as string;
  const scenario = args[1] as string;

  if (!periodRegex.test(period)) {
    throw new Error("Invalid period format. Expected 'YYYY-MM'.");
  }

  if (!allowedScenarios.includes(scenario)) {
    throw new Error("Invalid scenario. Expected one of 'ACT', 'BUD', 'PY1', 'PY2', 'PY3', or 'FCST'.");
  }

  // Parse args[2] as JSON
  let data: Record<string, any>;
  try {
    data = JSON.parse(args[2] as string);
  } catch (e) {
    throw new Error("Invalid JSON data in args[2].");
  }

  const periods = generatePeriods(period, 12); // Generate 12 periods starting from `period`

  const upsertQuery = `
      INSERT INTO financial_data (
        dep_acc_combo_id, month, year, period_combo, scenario, amount, count, currency,
        ou, department, account, version, last_modified, item_version
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'USD', ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
      ON CONFLICT (dep_acc_combo_id, period_combo, scenario) DO UPDATE SET
        amount = excluded.amount,
        ou = excluded.ou,
        department = excluded.department,
        account = excluded.account,
        version = excluded.version,
        last_modified = CURRENT_TIMESTAMP,
        item_version = financial_data.item_version + 1;
    `;

  const batchQueries: { sql: string; args: (string | number | null)[] }[] = [];

  for (let i = 0; i < periods.length; i++) {
    const currentPeriod = periods[i];
    const amount = data[`p${i + 1}`];

    // Skip if amount is zero or null
    if (!amount || amount === 0) {
      continue;
    }

    const dep_acc_combo_id = data.combo;

    const [yearStr, monthStr] = currentPeriod.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    batchQueries.push({
      sql: upsertQuery,
      args: [
        dep_acc_combo_id,
        month,
        year,
        currentPeriod,
        scenario,
        amount,
        data.ou || null,
        data.department || null,
        data.account || null,
        data.version || null
      ],
    });
  }

  try {
    await client.batch(batchQueries);
    return "Data updated successfully.";
  } catch (e) {
    throw new Error(`Failed to update data: ${e.message}`);
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- INSERT BATCH DEPARTMENTS -----------------------------------------------------------------------------------------
// interface defined in common area at the top

export async function insertBatchDepartments(batchData: Department[]) {
  if (!Array.isArray(batchData) || batchData.length === 0) {
    console.error("Batch data must be a non-empty array.");
    return;
  }

  try {
    // Start a transaction for batch insertion
    const queries = batchData.map((item) => {
      return {
        sql: `
            INSERT INTO departments (
              department_id, d_easy_name, d_is_locked, d_level_1, d_level_2, d_level_3,
              d_level_4, d_level_5, d_level_6, d_level_7, d_level_8, d_level_9, d_level_10,
              d_level_11, d_level_12, d_level_13, d_level_14, d_level_15, d_level_16, d_level_17,
              d_level_18, d_level_19, d_level_20, d_level_21, d_level_22, d_level_23, d_level_24,
              d_level_25, d_level_26, d_level_27, d_level_28, d_level_29, d_level_30
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?
            )
          `,
        args: [
          item.department_id,
          item.d_easy_name,
          item.d_is_locked,
          item.d_level_1,
          item.d_level_2,
          item.d_level_3,
          item.d_level_4,
          item.d_level_5,
          item.d_level_6,
          item.d_level_7,
          item.d_level_8,
          item.d_level_9,
          item.d_level_10,
          item.d_level_11,
          item.d_level_12,
          item.d_level_13,
          item.d_level_14,
          item.d_level_15,
          item.d_level_16,
          item.d_level_17,
          item.d_level_18,
          item.d_level_19,
          item.d_level_20,
          item.d_level_21,
          item.d_level_22,
          item.d_level_23,
          item.d_level_24,
          item.d_level_25,
          item.d_level_26,
          item.d_level_27,
          item.d_level_28,
          item.d_level_29,
          item.d_level_30,
        ],
      };
    });

    await client.batch(queries);

    console.log(`${batchData.length} records inserted successfully.`);
  } catch (error) {
    console.error("Error inserting batch data:", error);
  }
}

//interface defined in common area at the top
export async function insertBatchAccounts(batchData: Account[]) {
  if (!Array.isArray(batchData) || batchData.length === 0) {
    console.error("Batch data must be a non-empty array.");
    return;
  }

  try {
    // Start a transaction for batch insertion
    const queries = batchData.map((item) => {
      return {
        sql: `
            INSERT INTO accounts (
              account_id, a_easy_name, a_is_stat, a_is_locked, a_level_1, a_level_2, a_level_3,
              a_level_4, a_level_5, a_level_6, a_level_7, a_level_8, a_level_9, a_level_10,
              a_level_11, a_level_12, a_level_13, a_level_14, a_level_15, a_level_16, a_level_17,
              a_level_18, a_level_19, a_level_20, a_level_21, a_level_22, a_level_23, a_level_24,
              a_level_25, a_level_26, a_level_27, a_level_28, a_level_29, a_level_30
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?
            )
          `,
        args: [
          item.account_id,
          item.a_easy_name,
          item.a_is_stat,
          item.a_is_locked,
          item.a_level_1,
          item.a_level_2,
          item.a_level_3,
          item.a_level_4,
          item.a_level_5,
          item.a_level_6,
          item.a_level_7,
          item.a_level_8,
          item.a_level_9,
          item.a_level_10,
          item.a_level_11,
          item.a_level_12,
          item.a_level_13,
          item.a_level_14,
          item.a_level_15,
          item.a_level_16,
          item.a_level_17,
          item.a_level_18,
          item.a_level_19,
          item.a_level_20,
          item.a_level_21,
          item.a_level_22,
          item.a_level_23,
          item.a_level_24,
          item.a_level_25,
          item.a_level_26,
          item.a_level_27,
          item.a_level_28,
          item.a_level_29,
          item.a_level_30,
        ],
      };
    });

    await client.batch(queries);

    console.log(`${batchData.length} records inserted successfully.`);
  } catch (error) {
    console.error("Error inserting batch data:", error);
  }
}

//interface defined in common area at the top

export async function insertBatchDepartmentAccounts(batchData: DepartmentAccount[]) {
  if (!Array.isArray(batchData) || batchData.length === 0) {
    console.error("Batch data must be a non-empty array.");
    return;
  }

  try {
    // Start a transaction for batch insertion
    const queries = batchData.map((item) => {
      return {
        sql: `
            INSERT INTO department_accounts (
              dep_acc_combo_id, department_id, account_id, is_locked
            ) VALUES (
              ?, ?, ?, ?
            )
          `,
        args: [item.dep_acc_combo_id, item.department_id, item.account_id, item.is_locked],
      };
    });

    await client.batch(queries);

    console.log(`${batchData.length} records inserted successfully.`);
  } catch (error) {
    console.error("Error inserting batch data:", error);
  }
}

//interface defined in common area at the top
export async function insertBatchFinancialData(batchData: FinancialData[]) {
  if (!Array.isArray(batchData) || batchData.length === 0) {
    console.error("Batch data must be a non-empty array.");
    return;
  }

  try {
    // Start a transaction for batch insertion
    const queries = batchData.map((item) => {
      return {
        sql: `
            INSERT INTO financial_data (
              dep_acc_combo_id, month, year, period_combo, scenario, amount, count, currency,
              ou, department, account, version, last_modified, item_version
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
          `,
        args: [
          item.dep_acc_combo_id,
          item.month,
          item.year,
          item.period_combo,
          item.scenario,
          item.amount,
          item.count,
          item.currency,
          item.ou || null,
          item.department || null,
          item.account || null,
          item.version || null,
          item.last_modified || new Date().toISOString(),
          item.item_version || 1,
        ],
      };
    });

    await client.batch(queries);

    console.log(`${batchData.length} records inserted successfully.`);
  } catch (error) {
    console.error("Error inserting batch data:", error);
  }
}

export async function GeneratedDummyData() {
  await insertBatchDepartments(departments);
  await insertBatchAccounts(accounts);
  await insertBatchDepartmentAccounts(department_accounts);
  await insertBatchFinancialData(financialData);
  console.log("Dummy data inserted successfully.");
}

//------------------------------------------------------------------------------------------------------------------
//--- GET ALL ACCOUNTS ---------------------------------------------------------------------------------------------
export async function getAllAccounts(): Promise<string> {
  try {
    const query = `
      SELECT 
        account_id,
        a_easy_name,
        a_is_stat,
        a_is_locked,
        a_level_1, a_level_2, a_level_3, a_level_4, a_level_5,
        a_level_6, a_level_7, a_level_8, a_level_9, a_level_10,
        a_level_11, a_level_12, a_level_13, a_level_14, a_level_15,
        a_level_16, a_level_17, a_level_18, a_level_19, a_level_20,
        a_level_21, a_level_22, a_level_23, a_level_24, a_level_25,
        a_level_26, a_level_27, a_level_28, a_level_29, a_level_30
      FROM accounts
      ORDER BY account_id
    `;

    const resultSet = await client.execute({ sql: query, args: [] });
    const rows = resultSet.rows;

    return JSON.stringify(rows);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- GET ALL DEPARTMENTS ------------------------------------------------------------------------------------------
export async function getAllDepartments(): Promise<string> {
  try {
    const query = `
      SELECT 
        department_id,
        d_easy_name,
        d_is_locked,
        d_level_1, d_level_2, d_level_3, d_level_4, d_level_5,
        d_level_6, d_level_7, d_level_8, d_level_9, d_level_10,
        d_level_11, d_level_12, d_level_13, d_level_14, d_level_15,
        d_level_16, d_level_17, d_level_18, d_level_19, d_level_20,
        d_level_21, d_level_22, d_level_23, d_level_24, d_level_25,
        d_level_26, d_level_27, d_level_28, d_level_29, d_level_30
      FROM departments
      ORDER BY department_id
    `;

    const resultSet = await client.execute({ sql: query, args: [] });
    const rows = resultSet.rows;

    return JSON.stringify(rows);
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- GET ALL COMBO METADATA --------------------------------------------------------------------------------------
export async function getAllComboMetadata(): Promise<string> {
  try {
    const query = `
      SELECT 
        da.dep_acc_combo_id,
        da.department_id,
        da.account_id,
        da.is_locked,
        d.d_easy_name as department_name,
        a.a_easy_name as account_name,
        d.d_level_1 as dept_level_1, d.d_level_2 as dept_level_2, d.d_level_3 as dept_level_3,
        d.d_level_4 as dept_level_4, d.d_level_5 as dept_level_5, d.d_level_6 as dept_level_6,
        d.d_level_7 as dept_level_7, d.d_level_8 as dept_level_8, d.d_level_9 as dept_level_9,
        d.d_level_10 as dept_level_10, d.d_level_11 as dept_level_11, d.d_level_12 as dept_level_12,
        d.d_level_13 as dept_level_13, d.d_level_14 as dept_level_14, d.d_level_15 as dept_level_15,
        d.d_level_16 as dept_level_16, d.d_level_17 as dept_level_17, d.d_level_18 as dept_level_18,
        d.d_level_19 as dept_level_19, d.d_level_20 as dept_level_20, d.d_level_21 as dept_level_21,
        d.d_level_22 as dept_level_22, d.d_level_23 as dept_level_23, d.d_level_24 as dept_level_24,
        d.d_level_25 as dept_level_25, d.d_level_26 as dept_level_26, d.d_level_27 as dept_level_27,
        d.d_level_28 as dept_level_28, d.d_level_29 as dept_level_29, d.d_level_30 as dept_level_30,
        a.a_level_1 as acc_level_1, a.a_level_2 as acc_level_2, a.a_level_3 as acc_level_3,
        a.a_level_4 as acc_level_4, a.a_level_5 as acc_level_5, a.a_level_6 as acc_level_6,
        a.a_level_7 as acc_level_7, a.a_level_8 as acc_level_8, a.a_level_9 as acc_level_9,
        a.a_level_10 as acc_level_10, a.a_level_11 as acc_level_11, a.a_level_12 as acc_level_12,
        a.a_level_13 as acc_level_13, a.a_level_14 as acc_level_14, a.a_level_15 as acc_level_15,
        a.a_level_16 as acc_level_16, a.a_level_17 as acc_level_17, a.a_level_18 as acc_level_18,
        a.a_level_19 as acc_level_19, a.a_level_20 as acc_level_20, a.a_level_21 as acc_level_21,
        a.a_level_22 as acc_level_22, a.a_level_23 as acc_level_23, a.a_level_24 as acc_level_24,
        a.a_level_25 as acc_level_25, a.a_level_26 as acc_level_26, a.a_level_27 as acc_level_27,
        a.a_level_28 as acc_level_28, a.a_level_29 as acc_level_29, a.a_level_30 as acc_level_30
      FROM department_accounts da
      JOIN departments d ON da.department_id = d.department_id
      JOIN accounts a ON da.account_id = a.account_id
      ORDER BY da.dep_acc_combo_id
    `;

    const resultSet = await client.execute({ sql: query, args: [] });
    const rows = resultSet.rows;

    return JSON.stringify(rows);
  } catch (error) {
    console.error("Error fetching combo metadata:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- CREATE NEW ACCOUNT ------------------------------------------------------------------------------------------
export async function createAccount(accountData: Account): Promise<string> {
  try {
    const query = `
      INSERT INTO accounts (
        account_id, a_easy_name, a_is_stat, a_is_locked,
        a_level_1, a_level_2, a_level_3, a_level_4, a_level_5,
        a_level_6, a_level_7, a_level_8, a_level_9, a_level_10,
        a_level_11, a_level_12, a_level_13, a_level_14, a_level_15,
        a_level_16, a_level_17, a_level_18, a_level_19, a_level_20,
        a_level_21, a_level_22, a_level_23, a_level_24, a_level_25,
        a_level_26, a_level_27, a_level_28, a_level_29, a_level_30
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    await client.execute({
      sql: query,
      args: [
        accountData.account_id,
        accountData.a_easy_name,
        accountData.a_is_stat,
        accountData.a_is_locked,
        accountData.a_level_1 || null,
        accountData.a_level_2 || null,
        accountData.a_level_3 || null,
        accountData.a_level_4 || null,
        accountData.a_level_5 || null,
        accountData.a_level_6 || null,
        accountData.a_level_7 || null,
        accountData.a_level_8 || null,
        accountData.a_level_9 || null,
        accountData.a_level_10 || null,
        accountData.a_level_11 || null,
        accountData.a_level_12 || null,
        accountData.a_level_13 || null,
        accountData.a_level_14 || null,
        accountData.a_level_15 || null,
        accountData.a_level_16 || null,
        accountData.a_level_17 || null,
        accountData.a_level_18 || null,
        accountData.a_level_19 || null,
        accountData.a_level_20 || null,
        accountData.a_level_21 || null,
        accountData.a_level_22 || null,
        accountData.a_level_23 || null,
        accountData.a_level_24 || null,
        accountData.a_level_25 || null,
        accountData.a_level_26 || null,
        accountData.a_level_27 || null,
        accountData.a_level_28 || null,
        accountData.a_level_29 || null,
        accountData.a_level_30 || null,
      ]
    });

    return JSON.stringify({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- CREATE NEW DEPARTMENT ---------------------------------------------------------------------------------------
export async function createDepartment(departmentData: Department): Promise<string> {
  try {
    const query = `
      INSERT INTO departments (
        department_id, d_easy_name, d_is_locked,
        d_level_1, d_level_2, d_level_3, d_level_4, d_level_5,
        d_level_6, d_level_7, d_level_8, d_level_9, d_level_10,
        d_level_11, d_level_12, d_level_13, d_level_14, d_level_15,
        d_level_16, d_level_17, d_level_18, d_level_19, d_level_20,
        d_level_21, d_level_22, d_level_23, d_level_24, d_level_25,
        d_level_26, d_level_27, d_level_28, d_level_29, d_level_30
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    await client.execute({
      sql: query,
      args: [
        departmentData.department_id,
        departmentData.d_easy_name,
        departmentData.d_is_locked,
        departmentData.d_level_1 || null,
        departmentData.d_level_2 || null,
        departmentData.d_level_3 || null,
        departmentData.d_level_4 || null,
        departmentData.d_level_5 || null,
        departmentData.d_level_6 || null,
        departmentData.d_level_7 || null,
        departmentData.d_level_8 || null,
        departmentData.d_level_9 || null,
        departmentData.d_level_10 || null,
        departmentData.d_level_11 || null,
        departmentData.d_level_12 || null,
        departmentData.d_level_13 || null,
        departmentData.d_level_14 || null,
        departmentData.d_level_15 || null,
        departmentData.d_level_16 || null,
        departmentData.d_level_17 || null,
        departmentData.d_level_18 || null,
        departmentData.d_level_19 || null,
        departmentData.d_level_20 || null,
        departmentData.d_level_21 || null,
        departmentData.d_level_22 || null,
        departmentData.d_level_23 || null,
        departmentData.d_level_24 || null,
        departmentData.d_level_25 || null,
        departmentData.d_level_26 || null,
        departmentData.d_level_27 || null,
        departmentData.d_level_28 || null,
        departmentData.d_level_29 || null,
        departmentData.d_level_30 || null,
      ]
    });

    return JSON.stringify({ success: true, message: "Department created successfully" });
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- USER SETTINGS FUNCTIONS -------------------------------------------------------------------------------------
// Interface for user settings
interface UserSettings {
  themeMode?: "light" | "dark";
  selectedHotelOu?: string | null;
  [key: string]: any;
}

// Get a specific setting or all settings
export async function getUserSettings(key?: string): Promise<string> {
  try {
    if (key) {
      // Get specific setting
      const result = await client.execute({
        sql: "SELECT value FROM user_settings WHERE key = ?",
        args: [key]
      });

      if (result.rows.length > 0) {
        const value = result.rows[0].value as string;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return JSON.stringify(null);
    } else {
      // Get all settings
      const result = await client.execute({
        sql: "SELECT key, value FROM user_settings",
        args: []
      });

      const settings: UserSettings = {};
      for (const row of result.rows) {
        const key = row.key as string;
        const value = row.value as string;
        try {
          settings[key] = JSON.parse(value);
        } catch {
          settings[key] = value;
        }
      }
      return JSON.stringify(settings);
    }
  } catch (error) {
    console.error("Error getting user settings:", error);
    throw error;
  }
}

// Set a specific setting or multiple settings
export async function setUserSettings(settings: UserSettings): Promise<string> {
  try {
    const queries = Object.entries(settings).map(([key, value]) => ({
      sql: `
        INSERT INTO user_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [key, JSON.stringify(value)]
    }));

    await client.batch(queries);
    return JSON.stringify({ success: true, message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw error;
  }
}

// Delete a specific setting
export async function deleteUserSetting(key: string): Promise<string> {
  try {
    await client.execute({
      sql: "DELETE FROM user_settings WHERE key = ?",
      args: [key]
    });
    return JSON.stringify({ success: true, message: "Setting deleted successfully" });
  } catch (error) {
    console.error("Error deleting user setting:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- HOTELS CACHE FUNCTIONS --------------------------------------------------------------------------------------
// Interface for cached hotel data
interface CachedHotel {
  ou: string;
  hotel_name: string;
  room_count: number;
  cached_at?: string;
}

// Get all cached hotels
export async function getCachedHotels(): Promise<string> {
  try {
    const result = await client.execute({
      sql: "SELECT ou, hotel_name, room_count, cached_at FROM hotels_cache ORDER BY hotel_name",
      args: []
    });

    const hotels = result.rows.map(row => ({
      ou: row.ou as string,
      hotel_name: row.hotel_name as string,
      room_count: row.room_count as number,
      cached_at: row.cached_at as string
    }));

    return JSON.stringify(hotels);
  } catch (error) {
    console.error("Error getting cached hotels:", error);
    // Return empty array if table doesn't exist or other error
    return JSON.stringify([]);
  }
}

// Cache hotels data
export async function cacheHotels(hotels: CachedHotel[]): Promise<string> {
  try {
    // Clear existing cache first
    await client.execute({
      sql: "DELETE FROM hotels_cache",
      args: []
    });

    // Insert new data
    if (hotels.length > 0) {
      const queries = hotels.map(hotel => ({
        sql: `
          INSERT INTO hotels_cache (ou, hotel_name, room_count, cached_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `,
        args: [hotel.ou, hotel.hotel_name, hotel.room_count]
      }));

      await client.batch(queries);
    }

    return JSON.stringify({ success: true, message: "Hotels cached successfully" });
  } catch (error) {
    console.error("Error caching hotels:", error);
    throw error;
  }
}

// Clear hotels cache
export async function clearHotelsCache(): Promise<string> {
  try {
    await client.execute({
      sql: "DELETE FROM hotels_cache",
      args: []
    });
    return JSON.stringify({ success: true, message: "Hotels cache cleared" });
  } catch (error) {
    console.error("Error clearing hotels cache:", error);
    throw error;
  }
}

// Check if cache is expired (default: 24 hours)
export async function isHotelsCacheExpired(hoursThreshold: number = 24): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: `
        SELECT cached_at FROM hotels_cache
        ORDER BY cached_at DESC
        LIMIT 1
      `,
      args: []
    });

    if (result.rows.length === 0) {
      return true; // No cache exists
    }

    const cachedAt = new Date(result.rows[0].cached_at as string);
    const now = new Date();
    const hoursDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);

    return hoursDiff > hoursThreshold;
  } catch (error) {
    console.error("Error checking cache expiry:", error);
    return true; // Assume expired on error
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- CREATE NEW COMBO --------------------------------------------------------------------------------------------
export async function createCombo(comboData: DepartmentAccount): Promise<string> {
  try {
    const query = `
      INSERT INTO department_accounts (
        dep_acc_combo_id, department_id, account_id, is_locked
      ) VALUES (?, ?, ?, ?)
    `;

    await client.execute({
      sql: query,
      args: [
        comboData.dep_acc_combo_id,
        comboData.department_id,
        comboData.account_id,
        comboData.is_locked
      ]
    });

    return JSON.stringify({ success: true, message: "Combo created successfully" });
  } catch (error) {
    console.error("Error creating combo:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- DUMMY DATA ---------------------------------------------------------------------------------------------------

const department_accounts = [
  {
    dep_acc_combo_id: "D0010_A300001",
    department_id: "D0010",
    account_id: "A300001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0010_A300002",
    department_id: "D0010",
    account_id: "A300002",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0010_A400001",
    department_id: "D0010",
    account_id: "A400001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0010_A500001",
    department_id: "D0010",
    account_id: "A500001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0010_A600001",
    department_id: "D0010",
    account_id: "A600001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0011_A400001",
    department_id: "D0011",
    account_id: "A400001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0011_A500001",
    department_id: "D0011",
    account_id: "A500001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0011_A600001",
    department_id: "D0011",
    account_id: "A600001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0410_A500001",
    department_id: "D0410",
    account_id: "A500001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0410_A600001",
    department_id: "D0410",
    account_id: "A600001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0440_A600001",
    department_id: "D0440",
    account_id: "A600001",
    is_locked: 0,
  },
  {
    dep_acc_combo_id: "D0440_A500001",
    department_id: "D0440",
    account_id: "A500001",
    is_locked: 0,
  },
];

const accounts = [
  {
    account_id: "A300001",
    a_easy_name: "Rooms Revenue",
    a_is_stat: 0,
    a_is_locked: 0,
    a_level_1: "Accounts",
    a_level_2: "Revenue",
    a_level_3: "",
    a_level_4: "",
    a_level_5: "",
    a_level_6: "",
    a_level_7: "",
    a_level_8: "",
    a_level_9: "",
    a_level_10: "",
    a_level_11: "",
    a_level_12: "",
    a_level_13: "",
    a_level_14: "",
    a_level_15: "",
    a_level_16: "",
    a_level_17: "",
    a_level_18: "",
    a_level_19: "",
    a_level_20: "",
    a_level_21: "",
    a_level_22: "",
    a_level_23: "",
    a_level_24: "",
    a_level_25: "",
    a_level_26: "",
    a_level_27: "",
    a_level_28: "",
    a_level_29: "",
    a_level_30: "",
  },
  {
    account_id: "A300002",
    a_easy_name: "Food Revenue",
    a_is_stat: 0,
    a_is_locked: 0,
    a_level_1: "Accounts",
    a_level_2: "Revenue",
    a_level_3: "",
    a_level_4: "",
    a_level_5: "",
    a_level_6: "",
    a_level_7: "",
    a_level_8: "",
    a_level_9: "",
    a_level_10: "",
    a_level_11: "",
    a_level_12: "",
    a_level_13: "",
    a_level_14: "",
    a_level_15: "",
    a_level_16: "",
    a_level_17: "",
    a_level_18: "",
    a_level_19: "",
    a_level_20: "",
    a_level_21: "",
    a_level_22: "",
    a_level_23: "",
    a_level_24: "",
    a_level_25: "",
    a_level_26: "",
    a_level_27: "",
    a_level_28: "",
    a_level_29: "",
    a_level_30: "",
  },
  {
    account_id: "A400001",
    a_easy_name: "Cost of Food",
    a_is_stat: 0,
    a_is_locked: 0,
    a_level_1: "Accounts",
    a_level_2: "Costs",
    a_level_3: "",
    a_level_4: "",
    a_level_5: "",
    a_level_6: "",
    a_level_7: "",
    a_level_8: "",
    a_level_9: "",
    a_level_10: "",
    a_level_11: "",
    a_level_12: "",
    a_level_13: "",
    a_level_14: "",
    a_level_15: "",
    a_level_16: "",
    a_level_17: "",
    a_level_18: "",
    a_level_19: "",
    a_level_20: "",
    a_level_21: "",
    a_level_22: "",
    a_level_23: "",
    a_level_24: "",
    a_level_25: "",
    a_level_26: "",
    a_level_27: "",
    a_level_28: "",
    a_level_29: "",
    a_level_30: "",
  },
  {
    account_id: "A500001",
    a_easy_name: "Payroll",
    a_is_stat: 0,
    a_is_locked: 0,
    a_level_1: "Accounts",
    a_level_2: "Costs",
    a_level_3: "",
    a_level_4: "",
    a_level_5: "",
    a_level_6: "",
    a_level_7: "",
    a_level_8: "",
    a_level_9: "",
    a_level_10: "",
    a_level_11: "",
    a_level_12: "",
    a_level_13: "",
    a_level_14: "",
    a_level_15: "",
    a_level_16: "",
    a_level_17: "",
    a_level_18: "",
    a_level_19: "",
    a_level_20: "",
    a_level_21: "",
    a_level_22: "",
    a_level_23: "",
    a_level_24: "",
    a_level_25: "",
    a_level_26: "",
    a_level_27: "",
    a_level_28: "",
    a_level_29: "",
    a_level_30: "",
  },
  {
    account_id: "A600001",
    a_easy_name: "Controlables",
    a_is_stat: 0,
    a_is_locked: 0,
    a_level_1: "Accounts",
    a_level_2: "Costs",
    a_level_3: "",
    a_level_4: "",
    a_level_5: "",
    a_level_6: "",
    a_level_7: "",
    a_level_8: "",
    a_level_9: "",
    a_level_10: "",
    a_level_11: "",
    a_level_12: "",
    a_level_13: "",
    a_level_14: "",
    a_level_15: "",
    a_level_16: "",
    a_level_17: "",
    a_level_18: "",
    a_level_19: "",
    a_level_20: "",
    a_level_21: "",
    a_level_22: "",
    a_level_23: "",
    a_level_24: "",
    a_level_25: "",
    a_level_26: "",
    a_level_27: "",
    a_level_28: "",
    a_level_29: "",
    a_level_30: "",
  },
];

const departments = [
  {
    department_id: "D0010",
    d_easy_name: "Reception",
    d_is_locked: 0,
    d_level_1: "Departments",
    d_level_2: "Profit",
    d_level_3: "Rooms",
    d_level_4: "",
    d_level_5: "",
    d_level_6: "",
    d_level_7: "",
    d_level_8: "",
    d_level_9: "",
    d_level_10: "",
    d_level_11: "",
    d_level_12: "",
    d_level_13: "",
    d_level_14: "",
    d_level_15: "",
    d_level_16: "",
    d_level_17: "",
    d_level_18: "",
    d_level_19: "",
    d_level_20: "",
    d_level_21: "",
    d_level_22: "",
    d_level_23: "",
    d_level_24: "",
    d_level_25: "",
    d_level_26: "",
    d_level_27: "",
    d_level_28: "",
    d_level_29: "",
    d_level_30: "",
  },
  {
    department_id: "D0011",
    d_easy_name: "Housekeeping",
    d_is_locked: 0,
    d_level_1: "Departments",
    d_level_2: "Profit",
    d_level_3: "Rooms",
    d_level_4: "",
    d_level_5: "",
    d_level_6: "",
    d_level_7: "",
    d_level_8: "",
    d_level_9: "",
    d_level_10: "",
    d_level_11: "",
    d_level_12: "",
    d_level_13: "",
    d_level_14: "",
    d_level_15: "",
    d_level_16: "",
    d_level_17: "",
    d_level_18: "",
    d_level_19: "",
    d_level_20: "",
    d_level_21: "",
    d_level_22: "",
    d_level_23: "",
    d_level_24: "",
    d_level_25: "",
    d_level_26: "",
    d_level_27: "",
    d_level_28: "",
    d_level_29: "",
    d_level_30: "",
  },
  {
    department_id: "D0410",
    d_easy_name: "Admin & General",
    d_is_locked: 0,
    d_level_1: "Departments",
    d_level_2: "Profit",
    d_level_3: "Undistributed",
    d_level_4: "",
    d_level_5: "",
    d_level_6: "",
    d_level_7: "",
    d_level_8: "",
    d_level_9: "",
    d_level_10: "",
    d_level_11: "",
    d_level_12: "",
    d_level_13: "",
    d_level_14: "",
    d_level_15: "",
    d_level_16: "",
    d_level_17: "",
    d_level_18: "",
    d_level_19: "",
    d_level_20: "",
    d_level_21: "",
    d_level_22: "",
    d_level_23: "",
    d_level_24: "",
    d_level_25: "",
    d_level_26: "",
    d_level_27: "",
    d_level_28: "",
    d_level_29: "",
    d_level_30: "",
  },
  {
    department_id: "D0440",
    d_easy_name: "Finance",
    d_is_locked: 0,
    d_level_1: "Departments",
    d_level_2: "Profit",
    d_level_3: "Undistributed",
    d_level_4: "",
    d_level_5: "",
    d_level_6: "",
    d_level_7: "",
    d_level_8: "",
    d_level_9: "",
    d_level_10: "",
    d_level_11: "",
    d_level_12: "",
    d_level_13: "",
    d_level_14: "",
    d_level_15: "",
    d_level_16: "",
    d_level_17: "",
    d_level_18: "",
    d_level_19: "",
    d_level_20: "",
    d_level_21: "",
    d_level_22: "",
    d_level_23: "",
    d_level_24: "",
    d_level_25: "",
    d_level_26: "",
    d_level_27: "",
    d_level_28: "",
    d_level_29: "",
    d_level_30: "",
  },
];

const financialData = department_accounts.flatMap((depAcc) => {
  return [2023, 2024, 2025, 2026].flatMap((year) => {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
      const monthPadded = String(month).padStart(2, "0"); // Ensures months in period_combo are 01, 02, ..., 12
      return {
        dep_acc_combo_id: depAcc.dep_acc_combo_id,
        month, // Integer month: 1, 2, ..., 12
        year,
        period_combo: `${year}-${monthPadded}`, // Ensures YYYY-MM format
        scenario: "ACT",
        amount: Math.round(Math.random() * 1000),
        count: Math.round(Math.random() * 100),
        currency: "USD",
        last_modified: new Date().toISOString(),
        item_version: 1,
      };
    });
  });
});
