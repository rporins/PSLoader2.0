import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { createClient, Client } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const secretKey = process.env.TEMP_DB_KEY; // will be pulled from the server and used for creation, encryption, and decryption of the database
const documentsPath = app.getPath("documents");
const rebyterFolderPath = path.join(documentsPath, "Rebyter");
// Set the SQLite database file path
// Ensure the "rebyter" folder exists, create it if it doesn't
if (!fs.existsSync(rebyterFolderPath)) {
  fs.mkdirSync(rebyterFolderPath, { recursive: true });
}
const dbPath = path.join(rebyterFolderPath, "planning-tool.db");
// Create a new SQLite client
const client = createClient({
  url: "file:" + dbPath,
  //encryptionKey: secretKey,
});

const dbExists = fs.existsSync(dbPath);

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
            last_modified TEXT DEFAULT CURRENT_TIMESTAMP,
            item_version INTEGER DEFAULT 1,
            FOREIGN KEY(dep_acc_combo_id) REFERENCES department_accounts(dep_acc_combo_id),
            PRIMARY KEY (dep_acc_combo_id, period_combo, item_version)
        )
        `,
    ]);

    console.log("All necessary tables have been created or already exist.");
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

//----------------- GET 12 PERIODS ------------------------------------------------------------------------------
// Interface for Financial Data Row
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

// Function to retrieve 12 periods of financial data
export async function get12Periods(client: Client, period: string, scenario: string): Promise<string> {
  // Validation
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const allowedScenarios = ["ACT", "BUD", "PY1", "PY2", "PY3", "FCST"];

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

//----------------- UPDATE 12 PERIODS ----------------------------------------------------------------------------
// Function to update 12 periods
export async function update12Periods(client: Client, period: string, scenario: string, rawData: string): Promise<string> {
  // Validation
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  const allowedScenarios = ["ACT", "BUD", "PY1", "PY2", "PY3", "FCST"];

  if (!periodRegex.test(period)) {
    throw new Error("Invalid period format. Expected 'YYYY-MM'.");
  }

  if (!allowedScenarios.includes(scenario)) {
    throw new Error("Invalid scenario. Expected one of 'ACT', 'BUD', 'PY1', 'PY2', 'PY3', or 'FCST'.");
  }

  // Parse JSON data
  let data: Record<string, any>;
  try {
    data = JSON.parse(rawData);
  } catch (e) {
    throw new Error("Invalid JSON data provided.");
  }

  const periods = generatePeriods(period, 12); // Generate 12 periods starting from `period`

  const updateQuery = `
      UPDATE financial_data SET
        amount = ?,
        last_modified = CURRENT_TIMESTAMP,
        item_version = item_version + 1
      WHERE dep_acc_combo_id = ? AND period_combo = ? AND scenario = ?
    `;

  const insertQuery = `
      INSERT INTO financial_data (
        dep_acc_combo_id, month, year, period_combo, scenario, amount, count, currency, last_modified, item_version
      ) VALUES (
        ?, ?, ?, ?, ?, ?, NULL, 'USD', CURRENT_TIMESTAMP, 1
      )
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

    // First attempt to update
    batchQueries.push({
      sql: updateQuery,
      args: [amount, dep_acc_combo_id, currentPeriod, scenario],
    });

    // Then attempt to insert if update fails
    batchQueries.push({
      sql: insertQuery,
      args: [dep_acc_combo_id, month, year, currentPeriod, scenario, amount],
    });
  }

  try {
    await client.batch(batchQueries);
    return "Data updated successfully.";
  } catch (e) {
    throw new Error(`Failed to update data: ${e.message}`);
  }
}
