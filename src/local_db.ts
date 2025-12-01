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

// Mapping Config interface
interface MappingConfig {
  config_id: number;
  version: string;
  is_locked: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  last_synced?: string;
}

// Mapping interface
interface Mapping {
  id: number;
  mapping_config_id: number;
  source_account: string | null;
  source_department: string | null;
  source_account_department: string | null;
  target_account: string | null;
  target_department: string | null;
  target_account_department: string | null;
  priority: number;
  is_active: boolean;
}

// Import Group interface
interface ImportGroup {
  id?: number;
  ou: string;
  group_name: string;
  cached_at?: string;
}

// Import interface
interface Import {
  id: number;
  import_group_id?: number;
  name: string;
  display_name: string;
  description: string;
  order_index: number;
  mapping_config_id: number | null;
  required: boolean;
  file_types: string[];
  required_columns: string[];
  optional_columns: string[];
  validation_rules: string[];
}

// Import Session interface
interface ImportSession {
  id?: number;
  ou: string;
  import_group_name: string;
  year: number;
  month: number;
  period_combo: string;
  started_at?: string;
  completed_at?: string;
  status: 'in_progress' | 'completed' | 'failed';
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

// Mapping Tables Version Tracking
interface MappingTablesVersion {
  id: number; // Always 1 for singleton row
  version: string;
  combo_version: string;
  last_updated: string;
}

// Account Map from API
interface AccountMap {
  base_account: string; // Primary key
  level_0: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
  level_6: string;
  level_7: string;
  level_8: string;
  level_9: string;
  level_10: string;
  level_11: string;
  level_12: string;
  level_13: string;
  level_14: string;
  level_15: string;
  level_16: string;
  level_17: string;
  level_18: string;
  level_19: string;
  level_20: string;
  level_21: string;
  level_22: string;
  level_23: string;
  level_24: string;
  level_25: string;
  level_26: string;
  level_27: string;
  level_28: string;
  level_29: string;
  level_30: string;
  description: string;
}

// Department Map from API
interface DepartmentMap {
  base_department: string; // Primary key
  level_0: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
  level_6: string;
  level_7: string;
  level_8: string;
  level_9: string;
  level_10: string;
  level_11: string;
  level_12: string;
  level_13: string;
  level_14: string;
  level_15: string;
  level_16: string;
  level_17: string;
  level_18: string;
  level_19: string;
  level_20: string;
  level_21: string;
  level_22: string;
  level_23: string;
  level_24: string;
  level_25: string;
  level_26: string;
  level_27: string;
  level_28: string;
  level_29: string;
  level_30: string;
  description: string;
}

// Account-Department Combo from API
interface AccountDepartmentCombo {
  id?: number;
  account: string;
  department: string;
  description: string;
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

async function migrateHotelsCacheTable() {
  try {
    // Check if the new columns already exist
    const tableInfo = await client.execute({
      sql: "PRAGMA table_info(hotels_cache)",
      args: []
    });

    const columnNames = tableInfo.rows.map(row => row.name as string);
    const newColumns = ['currency', 'country', 'city', 'local_id_1', 'local_id_2', 'local_id_3'];
    const columnsToAdd = newColumns.filter(col => !columnNames.includes(col));

    if (columnsToAdd.length > 0) {
      console.log("Migrating hotels_cache table to add new columns:", columnsToAdd.join(', '));

      // Add new columns one by one
      const alterQueries = columnsToAdd.map(col => ({
        sql: `ALTER TABLE hotels_cache ADD COLUMN ${col} TEXT`,
        args: [] as any[]
      }));

      await client.batch(alterQueries);
      console.log("Successfully added new columns to hotels_cache table");
    } else {
      console.log("Hotels_cache table already has all required columns");
    }
  } catch (error) {
    console.error("Error during hotels_cache migration:", error);
    // If table doesn't exist, it will be created with the new schema
  }
}

async function migrateFinancialDataStagingTable() {
  try {
    // Check if the new columns already exist
    const tableInfo = await client.execute({
      sql: "PRAGMA table_info(financial_data_staging)",
      args: []
    });

    const columnNames = tableInfo.rows.map(row => row.name as string);
    const newColumns = ['source_account', 'source_department', 'mapping_status', 'source_description'];
    const columnsToAdd = newColumns.filter(col => !columnNames.includes(col));

    if (columnsToAdd.length > 0) {
      console.log("Migrating financial_data_staging table to add new columns:", columnsToAdd.join(', '));

      // Add new columns one by one
      const alterQueries = columnsToAdd.map(col => ({
        sql: `ALTER TABLE financial_data_staging ADD COLUMN ${col} TEXT`,
        args: [] as any[]
      }));

      await client.batch(alterQueries);
      console.log("Successfully added new columns to financial_data_staging table");
    } else {
      console.log("Financial_data_staging table already has all required columns");
    }
  } catch (error) {
    console.error("Error during financial_data_staging migration:", error);
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
            currency TEXT,
            country TEXT,
            city TEXT,
            local_id_1 TEXT,
            local_id_2 TEXT,
            local_id_3 TEXT,
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
      `
        CREATE TABLE IF NOT EXISTS financial_data_staging (
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
            source_account TEXT,
            source_department TEXT,
            source_description TEXT,
            mapping_status TEXT,
            import_batch_id TEXT,
            last_modified TEXT DEFAULT CURRENT_TIMESTAMP,
            item_version INTEGER DEFAULT 1
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS mapping_configs (
            config_id INTEGER PRIMARY KEY,
            version TEXT NOT NULL,
            is_locked BOOLEAN NOT NULL DEFAULT 0,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_synced TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(config_id)
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS mappings (
            id INTEGER PRIMARY KEY,
            mapping_config_id INTEGER NOT NULL,
            source_account TEXT,
            source_department TEXT,
            source_account_department TEXT,
            target_account TEXT,
            target_department TEXT,
            target_account_department TEXT,
            priority INTEGER DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY(mapping_config_id) REFERENCES mapping_configs(config_id) ON DELETE CASCADE
        )
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_mapping_config ON mappings(mapping_config_id)
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_mapping_source ON mappings(source_account, source_department)
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_mapping_target ON mappings(target_account, target_department)
        `,
      `
        CREATE TABLE IF NOT EXISTS mapping_tables_version (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            version TEXT NOT NULL,
            combo_version TEXT NOT NULL,
            last_updated TEXT DEFAULT CURRENT_TIMESTAMP
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS account_maps (
            base_account TEXT PRIMARY KEY,
            level_0 TEXT,
            level_1 TEXT,
            level_2 TEXT,
            level_3 TEXT,
            level_4 TEXT,
            level_5 TEXT,
            level_6 TEXT,
            level_7 TEXT,
            level_8 TEXT,
            level_9 TEXT,
            level_10 TEXT,
            level_11 TEXT,
            level_12 TEXT,
            level_13 TEXT,
            level_14 TEXT,
            level_15 TEXT,
            level_16 TEXT,
            level_17 TEXT,
            level_18 TEXT,
            level_19 TEXT,
            level_20 TEXT,
            level_21 TEXT,
            level_22 TEXT,
            level_23 TEXT,
            level_24 TEXT,
            level_25 TEXT,
            level_26 TEXT,
            level_27 TEXT,
            level_28 TEXT,
            level_29 TEXT,
            level_30 TEXT,
            description TEXT
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS department_maps (
            base_department TEXT PRIMARY KEY,
            level_0 TEXT,
            level_1 TEXT,
            level_2 TEXT,
            level_3 TEXT,
            level_4 TEXT,
            level_5 TEXT,
            level_6 TEXT,
            level_7 TEXT,
            level_8 TEXT,
            level_9 TEXT,
            level_10 TEXT,
            level_11 TEXT,
            level_12 TEXT,
            level_13 TEXT,
            level_14 TEXT,
            level_15 TEXT,
            level_16 TEXT,
            level_17 TEXT,
            level_18 TEXT,
            level_19 TEXT,
            level_20 TEXT,
            level_21 TEXT,
            level_22 TEXT,
            level_23 TEXT,
            level_24 TEXT,
            level_25 TEXT,
            level_26 TEXT,
            level_27 TEXT,
            level_28 TEXT,
            level_29 TEXT,
            level_30 TEXT,
            description TEXT
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS account_department_combos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account TEXT NOT NULL,
            department TEXT NOT NULL,
            description TEXT,
            UNIQUE(account, department)
        )
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_combo_account ON account_department_combos(account)
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_combo_department ON account_department_combos(department)
        `,
      `
        CREATE TABLE IF NOT EXISTS import_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ou TEXT NOT NULL,
            group_name TEXT NOT NULL,
            cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ou, group_name)
        )
        `,
      `
        CREATE TABLE IF NOT EXISTS imports (
            id INTEGER PRIMARY KEY,
            import_group_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT,
            order_index INTEGER DEFAULT 0,
            mapping_config_id INTEGER,
            required BOOLEAN DEFAULT 0,
            file_types TEXT,
            required_columns TEXT,
            optional_columns TEXT,
            validation_rules TEXT,
            FOREIGN KEY(import_group_id) REFERENCES import_groups(id) ON DELETE CASCADE,
            FOREIGN KEY(mapping_config_id) REFERENCES mapping_configs(config_id)
        )
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_imports_group ON imports(import_group_id)
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_imports_mapping_config ON imports(mapping_config_id)
        `,
      `
        CREATE TABLE IF NOT EXISTS import_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ou TEXT NOT NULL,
            import_group_name TEXT NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            period_combo TEXT NOT NULL,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT,
            status TEXT DEFAULT 'in_progress'
        )
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_import_sessions_ou ON import_sessions(ou)
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_import_sessions_period ON import_sessions(year, month)
        `,
      `
        CREATE TABLE IF NOT EXISTS cache_metadata (
            key TEXT PRIMARY KEY,
            last_fetched_at TEXT,
            fetch_status TEXT DEFAULT 'idle',
            error_message TEXT
        )
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_cache_metadata_status ON cache_metadata(fetch_status)
        `,
      `
        CREATE TABLE IF NOT EXISTS validations (
            id INTEGER PRIMARY KEY,
            ou TEXT NOT NULL,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            is_required BOOLEAN DEFAULT 0,
            description TEXT,
            sequence INTEGER DEFAULT 0,
            cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ou, name)
        )
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_validations_ou ON validations(ou)
        `,
      `
        CREATE INDEX IF NOT EXISTS idx_validations_sequence ON validations(sequence)
        `,
    ]);

    console.log("All necessary tables have been created or already exist.");

    // Run migration to add new columns to existing databases
    await migrateFinancialDataTable();
    await migrateHotelsCacheTable();
    await migrateFinancialDataStagingTable();
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
//----------------- GET FINANCIAL REPORT DATA -----------------------------------------------------------------------
// Function to retrieve financial report data with actuals vs budget comparison
// Returns data with account and department mapping levels included
export async function getFinancialReportData(
  startPeriod: string,
  ou?: string
): Promise<string> {
  const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

  if (!periodRegex.test(startPeriod)) {
    throw new Error("Invalid period format. Expected 'YYYY-MM'.");
  }

  const numberOfPeriods = 12;
  const periods = generatePeriods(startPeriod, numberOfPeriods);

  try {
    const query = `
      WITH actuals_data AS (
        SELECT
          fd.dep_acc_combo_id AS combo,
          fd.department,
          fd.account,
          ${periods.map((_, i) => `SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS act_p${i + 1}`).join(',\n          ')}
        FROM financial_data fd
        WHERE fd.scenario = 'ACT'
          AND fd.version = 'MAIN'
          ${ou ? 'AND fd.ou = ?' : ''}
        GROUP BY fd.dep_acc_combo_id, fd.department, fd.account
      ),
      budget_data AS (
        SELECT
          fd.dep_acc_combo_id AS combo,
          ${periods.map((_, i) => `SUM(CASE WHEN fd.period_combo = ? THEN fd.amount ELSE 0 END) AS bud_p${i + 1}`).join(',\n          ')}
        FROM financial_data fd
        WHERE fd.scenario = 'BUD'
          AND fd.version = 'MAIN'
          ${ou ? 'AND fd.ou = ?' : ''}
        GROUP BY fd.dep_acc_combo_id
      )
      SELECT
        a.combo,
        a.department,
        a.account,
        am.level_4 AS account_level_4,
        am.level_6 AS account_level_6,
        am.level_9 AS account_level_9,
        dm.level_4 AS department_level_4,
        dm.level_9 AS department_level_9,
        ${periods.map((_, i) => `COALESCE(a.act_p${i + 1}, 0) AS act_p${i + 1}`).join(',\n        ')},
        ${periods.map((_, i) => `COALESCE(b.bud_p${i + 1}, 0) AS bud_p${i + 1}`).join(',\n        ')}
      FROM actuals_data a
      LEFT JOIN budget_data b ON a.combo = b.combo
      LEFT JOIN account_maps am ON a.account = am.base_account
      LEFT JOIN department_maps dm ON a.department = dm.base_department
      WHERE ${periods.map((_, i) => `(a.act_p${i + 1} != 0 OR b.bud_p${i + 1} != 0)`).join(' OR ')}
      ORDER BY a.department, a.account
    `;

    // Build params array
    const actualsParams = ou ? [...periods, ou] : periods;
    const budgetParams = ou ? [...periods, ou] : periods;
    const params = [...actualsParams, ...budgetParams];

    const resultSet = await client.execute({ sql: query, args: params });
    const rows = resultSet.rows as unknown as any[];

    let idCounter = 1;
    const result = rows.map((row) => {
      const record: any = {
        id: idCounter++,
        combo: row.combo,
        department: row.department,
        account: row.account,
        account_level_4: row.account_level_4,
        account_level_6: row.account_level_6,
        account_level_9: row.account_level_9,
        department_level_4: row.department_level_4,
        department_level_9: row.department_level_9,
      };

      // Add monthly actuals and budget
      for (let i = 1; i <= 12; i++) {
        record[`act_p${i}`] = row[`act_p${i}`] || 0;
        record[`bud_p${i}`] = row[`bud_p${i}`] || 0;
      }

      return record;
    });

    return JSON.stringify(result);
  } catch (error) {
    console.error("Error fetching financial report data:", error);
    throw error;
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
  permanentSalt?: string;
  [key: string]: any;
}

// Get or create the permanent device salt
export async function getPermanentSalt(): Promise<string> {
  try {
    const result = await client.execute({
      sql: "SELECT value FROM user_settings WHERE key = ?",
      args: ['permanentSalt']
    });

    if (result.rows.length > 0) {
      const salt = result.rows[0].value as string;
      // ALWAYS return existing salt, even if it appears invalid
      // Changing the salt would break device authentication
      if (salt) {
        return salt;
      }
    }

    // Only generate new salt if none exists
    const crypto = await import('crypto');
    const newSalt = crypto.randomBytes(16).toString('hex');

    // Store it in the database - INSERT only, never update
    // This should only run once per device, ever
    await client.execute({
      sql: `
        INSERT INTO user_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
      args: ['permanentSalt', newSalt]
    });

    console.log('Generated and stored new permanent device salt in database');
    return newSalt;
  } catch (error) {
    console.error('Error getting/creating permanent salt:', error);
    throw error;
  }
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
//--- IMPORT COMPLETION STATE FUNCTIONS ---------------------------------------------------------------------------
// Get import completion state for a specific OU
export async function getImportCompletedState(ou: string): Promise<boolean> {
  try {
    const key = `import_completed_${ou}`;
    const result = await client.execute({
      sql: "SELECT value FROM user_settings WHERE key = ?",
      args: [key]
    });

    if (result.rows.length > 0) {
      const value = result.rows[0].value as string;
      return value === 'true';
    }
    return false; // Default to false if not set
  } catch (error) {
    console.error("Error getting import completed state:", error);
    return false;
  }
}

// Set import completion state for a specific OU
export async function setImportCompletedState(ou: string, completed: boolean): Promise<void> {
  try {
    const key = `import_completed_${ou}`;
    await client.execute({
      sql: `
        INSERT INTO user_settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [key, completed.toString()]
    });
    console.log(`Import completed state set to ${completed} for OU: ${ou}`);
  } catch (error) {
    console.error("Error setting import completed state:", error);
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
  currency?: string;
  country?: string;
  city?: string;
  local_id_1?: string;
  local_id_2?: string;
  local_id_3?: string;
  cached_at?: string;
}

// Get all cached hotels
export async function getCachedHotels(): Promise<string> {
  try {
    const result = await client.execute({
      sql: "SELECT ou, hotel_name, room_count, currency, country, city, local_id_1, local_id_2, local_id_3, cached_at FROM hotels_cache ORDER BY hotel_name",
      args: []
    });

    const hotels = result.rows.map(row => ({
      ou: row.ou as string,
      hotel_name: row.hotel_name as string,
      room_count: row.room_count as number,
      currency: row.currency as string | null,
      country: row.country as string | null,
      city: row.city as string | null,
      local_id_1: row.local_id_1 as string | null,
      local_id_2: row.local_id_2 as string | null,
      local_id_3: row.local_id_3 as string | null,
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
          INSERT INTO hotels_cache (ou, hotel_name, room_count, currency, country, city, local_id_1, local_id_2, local_id_3, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
        args: [
          hotel.ou,
          hotel.hotel_name,
          hotel.room_count,
          hotel.currency || null,
          hotel.country || null,
          hotel.city || null,
          hotel.local_id_1 || null,
          hotel.local_id_2 || null,
          hotel.local_id_3 || null
        ]
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

//------------------------------------------------------------------------------------------------------------------
//----------------- MAPPING CONFIG FUNCTIONS ---------------------------------------------------------------------

// Store mapping config in database
export async function storeMappingConfig(config: {
  config_id: number;
  version: string;
  is_locked: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}): Promise<void> {
  try {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO mapping_configs (
          config_id, version, is_locked, description,
          created_at, updated_at, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      args: [
        config.config_id,
        config.version,
        config.is_locked ? 1 : 0,
        config.description,
        config.created_at,
        config.updated_at,
      ],
    });
    console.log("Mapping config stored successfully");
  } catch (error) {
    console.error("Error storing mapping config:", error);
    throw error;
  }
}

// Retrieve mapping config from database
export async function getMappingConfig(configId: number): Promise<MappingConfig | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT config_id, version, is_locked, description,
               created_at, updated_at, last_synced
        FROM mapping_configs
        WHERE config_id = ?
      `,
      args: [configId],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        config_id: row.config_id as number,
        version: row.version as string,
        is_locked: Boolean(row.is_locked),
        description: row.description as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        last_synced: row.last_synced as string,
      };
    }
    return null;
  } catch (error) {
    console.error("Error retrieving mapping config:", error);
    throw error;
  }
}

// Get all mapping configs
export async function getAllMappingConfigs(): Promise<MappingConfig[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT config_id, version, is_locked, description,
               created_at, updated_at, last_synced
        FROM mapping_configs
        ORDER BY config_id
      `,
      args: [],
    });

    return result.rows.map((row) => ({
      config_id: row.config_id as number,
      version: row.version as string,
      is_locked: Boolean(row.is_locked),
      description: row.description as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      last_synced: row.last_synced as string,
    }));
  } catch (error) {
    console.error("Error retrieving all mapping configs:", error);
    throw error;
  }
}

// Update last synced timestamp for a config
export async function updateMappingConfigSyncTime(configId: number): Promise<void> {
  try {
    await client.execute({
      sql: `
        UPDATE mapping_configs
        SET last_synced = CURRENT_TIMESTAMP
        WHERE config_id = ?
      `,
      args: [configId],
    });
  } catch (error) {
    console.error("Error updating mapping config sync time:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//----------------- MAPPING FUNCTIONS ----------------------------------------------------------------------------

// Replace all mappings for a specific config (deletes existing and inserts new)
export async function replaceMappings(configId: number, mappings: Array<{
  id: number;
  mapping_config_id: number;
  source_account: string | null;
  source_department: string | null;
  source_account_department: string | null;
  target_account: string | null;
  target_department: string | null;
  target_account_department: string | null;
  priority: number;
  is_active: boolean;
}>): Promise<void> {
  try {
    // Start a transaction to ensure atomicity
    await client.execute("BEGIN TRANSACTION");

    try {
      // Delete existing mappings for this config
      await client.execute({
        sql: "DELETE FROM mappings WHERE mapping_config_id = ?",
        args: [configId],
      });

      // Insert new mappings
      for (const mapping of mappings) {
        await client.execute({
          sql: `
            INSERT INTO mappings (
              id, mapping_config_id, source_account, source_department,
              source_account_department, target_account, target_department,
              target_account_department, priority, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            mapping.id,
            mapping.mapping_config_id,
            mapping.source_account,
            mapping.source_department,
            mapping.source_account_department,
            mapping.target_account,
            mapping.target_department,
            mapping.target_account_department,
            mapping.priority,
            mapping.is_active ? 1 : 0,
          ],
        });
      }

      // Commit transaction
      await client.execute("COMMIT");
      console.log(`Successfully replaced ${mappings.length} mappings for config ${configId}`);
    } catch (error) {
      // Rollback on error
      await client.execute("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error replacing mappings:", error);
    throw error;
  }
}

// Get all mappings for a specific config
export async function getMappings(configId: number): Promise<Mapping[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, mapping_config_id, source_account, source_department,
               source_account_department, target_account, target_department,
               target_account_department, priority, is_active
        FROM mappings
        WHERE mapping_config_id = ?
        ORDER BY priority DESC, id
      `,
      args: [configId],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      mapping_config_id: row.mapping_config_id as number,
      source_account: row.source_account as string | null,
      source_department: row.source_department as string | null,
      source_account_department: row.source_account_department as string | null,
      target_account: row.target_account as string | null,
      target_department: row.target_department as string | null,
      target_account_department: row.target_account_department as string | null,
      priority: row.priority as number,
      is_active: Boolean(row.is_active),
    }));
  } catch (error) {
    console.error("Error retrieving mappings:", error);
    throw error;
  }
}

// Get mapping count for a specific config
export async function getMappingCount(configId: number): Promise<number> {
  try {
    const result = await client.execute({
      sql: `
        SELECT COUNT(*) as count
        FROM mappings
        WHERE mapping_config_id = ?
      `,
      args: [configId],
    });

    return result.rows[0].count as number;
  } catch (error) {
    console.error("Error getting mapping count:", error);
    throw error;
  }
}

// Find mapping by source account and department
export async function findMapping(
  configId: number,
  sourceAccount: string | null,
  sourceDepartment: string | null
): Promise<Mapping | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, mapping_config_id, source_account, source_department,
               source_account_department, target_account, target_department,
               target_account_department, priority, is_active
        FROM mappings
        WHERE mapping_config_id = ?
          AND (source_account = ? OR (source_account IS NULL AND ? IS NULL))
          AND (source_department = ? OR (source_department IS NULL AND ? IS NULL))
          AND is_active = 1
        ORDER BY priority DESC, id
        LIMIT 1
      `,
      args: [configId, sourceAccount, sourceAccount, sourceDepartment, sourceDepartment],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        mapping_config_id: row.mapping_config_id as number,
        source_account: row.source_account as string | null,
        source_department: row.source_department as string | null,
        source_account_department: row.source_account_department as string | null,
        target_account: row.target_account as string | null,
        target_department: row.target_department as string | null,
        target_account_department: row.target_account_department as string | null,
        priority: row.priority as number,
        is_active: Boolean(row.is_active),
      };
    }
    return null;
  } catch (error) {
    console.error("Error finding mapping:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//----------------- IMPORT GROUP FUNCTIONS -----------------------------------------------------------------------

// Store import groups and their imports
export async function storeImportGroups(ou: string, importGroups: Array<{
  group_name: string;
  imports: Array<{
    id: number;
    name: string;
    displayName: string;
    description: string;
    order: number;
    mapping_config_id: number;
    required: boolean;
    fileTypes: string[];
    requiredColumns: string[];
    optionalColumns: string[];
    validationRules: string[];
  }>;
}>): Promise<void> {
  try {
    await client.execute("BEGIN TRANSACTION");

    try {
      // Delete existing import groups for this OU
      await client.execute({
        sql: "DELETE FROM import_groups WHERE ou = ?",
        args: [ou],
      });

      // Insert new import groups and their imports
      for (const group of importGroups) {
        // Insert the group
        const groupResult = await client.execute({
          sql: `
            INSERT INTO import_groups (ou, group_name, cached_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `,
          args: [ou, group.group_name],
        });

        const groupId = groupResult.lastInsertRowid;

        // Insert imports for this group
        for (const imp of group.imports) {
          await client.execute({
            sql: `
              INSERT INTO imports (
                id, import_group_id, name, display_name, description,
                order_index, mapping_config_id, required,
                file_types, required_columns, optional_columns, validation_rules
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
              imp.id,
              groupId,
              imp.name,
              imp.displayName,
              imp.description,
              imp.order,
              imp.mapping_config_id,
              imp.required ? 1 : 0,
              JSON.stringify(imp.fileTypes),
              JSON.stringify(imp.requiredColumns),
              JSON.stringify(imp.optionalColumns),
              JSON.stringify(imp.validationRules),
            ],
          });
        }
      }

      await client.execute("COMMIT");
      console.log(`Successfully stored ${importGroups.length} import groups for OU ${ou}`);
    } catch (error) {
      await client.execute("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error storing import groups:", error);
    throw error;
  }
}

// Get import groups for an OU
export async function getImportGroups(ou: string): Promise<Array<{
  group_name: string;
  imports: Import[];
}>> {
  try {
    const groupsResult = await client.execute({
      sql: "SELECT id, group_name FROM import_groups WHERE ou = ?",
      args: [ou],
    });

    const groups = [];

    for (const groupRow of groupsResult.rows) {
      const importsResult = await client.execute({
        sql: `
          SELECT id, name, display_name, description, order_index,
                 mapping_config_id, required, file_types, required_columns,
                 optional_columns, validation_rules
          FROM imports
          WHERE import_group_id = ?
          ORDER BY order_index, id
        `,
        args: [groupRow.id],
      });

      const imports = importsResult.rows.map((row) => ({
        id: row.id as number,
        name: row.name as string,
        display_name: row.display_name as string,
        description: row.description as string,
        order_index: row.order_index as number,
        mapping_config_id: row.mapping_config_id as number | null,
        required: Boolean(row.required),
        file_types: JSON.parse(row.file_types as string),
        required_columns: JSON.parse(row.required_columns as string),
        optional_columns: JSON.parse(row.optional_columns as string),
        validation_rules: JSON.parse(row.validation_rules as string),
      }));

      groups.push({
        group_name: groupRow.group_name as string,
        imports,
      });
    }

    return groups;
  } catch (error) {
    console.error("Error retrieving import groups:", error);
    throw error;
  }
}

// Get all unique mapping config IDs from imports for an OU
export async function getMappingConfigIdsForOU(ou: string): Promise<number[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT DISTINCT i.mapping_config_id
        FROM imports i
        JOIN import_groups ig ON i.import_group_id = ig.id
        WHERE ig.ou = ? AND i.mapping_config_id IS NOT NULL
      `,
      args: [ou],
    });

    return result.rows
      .map((row) => row.mapping_config_id as number)
      .filter((id) => id !== null);
  } catch (error) {
    console.error("Error getting mapping config IDs for OU:", error);
    throw error;
  }
}

// Check if import groups are cached for an OU
export async function hasImportGroupsCached(ou: string): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: "SELECT COUNT(*) as count FROM import_groups WHERE ou = ?",
      args: [ou],
    });

    return (result.rows[0].count as number) > 0;
  } catch (error) {
    console.error("Error checking import groups cache:", error);
    return false;
  }
}

//------------------------------------------------------------------------------------------------------------------
//----------------- IMPORT SESSION FUNCTIONS ---------------------------------------------------------------------

// Create a new import session
export async function createImportSession(session: Omit<ImportSession, 'id'>): Promise<number> {
  try {
    const result = await client.execute({
      sql: `
        INSERT INTO import_sessions (
          ou, import_group_name, year, month, period_combo, started_at, status
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'in_progress')
      `,
      args: [
        session.ou,
        session.import_group_name,
        session.year,
        session.month,
        session.period_combo,
      ],
    });

    const sessionId = result.lastInsertRowid as number;
    console.log(`Import session created with ID: ${sessionId} for period ${session.period_combo}`);
    return sessionId;
  } catch (error) {
    console.error("Error creating import session:", error);
    throw error;
  }
}

// Update import session status
export async function updateImportSessionStatus(
  sessionId: number,
  status: 'in_progress' | 'completed' | 'failed'
): Promise<void> {
  try {
    await client.execute({
      sql: `
        UPDATE import_sessions
        SET status = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [status, sessionId],
    });
    console.log(`Import session ${sessionId} updated to status: ${status}`);
  } catch (error) {
    console.error("Error updating import session status:", error);
    throw error;
  }
}

// Get the most recent import session for an OU
export async function getLatestImportSession(ou: string): Promise<ImportSession | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, ou, import_group_name, year, month, period_combo,
               started_at, completed_at, status
        FROM import_sessions
        WHERE ou = ?
        ORDER BY started_at DESC
        LIMIT 1
      `,
      args: [ou],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        ou: row.ou as string,
        import_group_name: row.import_group_name as string,
        year: row.year as number,
        month: row.month as number,
        period_combo: row.period_combo as string,
        started_at: row.started_at as string,
        completed_at: row.completed_at as string | undefined,
        status: row.status as 'in_progress' | 'completed' | 'failed',
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting latest import session:", error);
    throw error;
  }
}

// Get import session by ID
export async function getImportSession(sessionId: number): Promise<ImportSession | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, ou, import_group_name, year, month, period_combo,
               started_at, completed_at, status
        FROM import_sessions
        WHERE id = ?
      `,
      args: [sessionId],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        id: row.id as number,
        ou: row.ou as string,
        import_group_name: row.import_group_name as string,
        year: row.year as number,
        month: row.month as number,
        period_combo: row.period_combo as string,
        started_at: row.started_at as string,
        completed_at: row.completed_at as string | undefined,
        status: row.status as 'in_progress' | 'completed' | 'failed',
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting import session:", error);
    throw error;
  }
}

// Get all import sessions for an OU
export async function getImportSessions(ou: string): Promise<ImportSession[]> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, ou, import_group_name, year, month, period_combo,
               started_at, completed_at, status
        FROM import_sessions
        WHERE ou = ?
        ORDER BY started_at DESC
      `,
      args: [ou],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      ou: row.ou as string,
      import_group_name: row.import_group_name as string,
      year: row.year as number,
      month: row.month as number,
      period_combo: row.period_combo as string,
      started_at: row.started_at as string,
      completed_at: row.completed_at as string | undefined,
      status: row.status as 'in_progress' | 'completed' | 'failed',
    }));
  } catch (error) {
    console.error("Error getting import sessions:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//----------------- STAGING TABLE FUNCTIONS ----------------------------------------------------------------------

// Interface for staging data
interface StagingData {
  dep_acc_combo_id: string | null;
  month: number;
  year: number;
  period_combo: string;
  scenario: string;
  amount: number;
  count: number;
  currency: string;
  ou: string;
  department: string | null;
  account: string | null;
  version: string;
  source_account: string | null;
  source_department: string | null;
  source_description: string | null;
  mapping_status: string;
  import_batch_id: string;
}

// Clear staging table
export async function clearStagingTable(): Promise<void> {
  try {
    await client.execute({
      sql: "DELETE FROM financial_data_staging",
      args: []
    });
    console.log("Staging table cleared successfully");
  } catch (error) {
    console.error("Error clearing staging table:", error);
    throw error;
  }
}

// Delete staging rows where source_account matches any of the provided values
export async function deleteStagingBySourceAccounts(sourceAccounts: (string | null)[]): Promise<number> {
  try {
    // Filter out null values and get unique non-empty values
    const validAccounts = sourceAccounts.filter((acc): acc is string => acc !== null && acc !== '');

    if (validAccounts.length === 0) {
      console.log("No valid source accounts to delete, skipping");
      return 0;
    }

    // Build placeholders for SQL IN clause
    const placeholders = validAccounts.map(() => '?').join(', ');

    const result = await client.execute({
      sql: `DELETE FROM financial_data_staging WHERE source_account IN (${placeholders})`,
      args: validAccounts
    });

    const deletedCount = result.rowsAffected || 0;
    console.log(`Deleted ${deletedCount} rows from staging table matching ${validAccounts.length} source accounts`);

    return deletedCount;
  } catch (error) {
    console.error("Error deleting staging rows by source accounts:", error);
    throw error;
  }
}

// Insert batch staging data
export async function insertBatchStagingData(batchData: StagingData[]): Promise<void> {
  if (!Array.isArray(batchData) || batchData.length === 0) {
    console.error("Batch data must be a non-empty array.");
    return;
  }

  try {
    const queries = batchData.map((item) => ({
      sql: `
        INSERT INTO financial_data_staging (
          dep_acc_combo_id, month, year, period_combo, scenario,
          amount, count, currency, ou, department, account, version,
          source_account, source_department, source_description, mapping_status,
          import_batch_id, last_modified, item_version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
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
        item.ou,
        item.department,
        item.account,
        item.version,
        item.source_account,
        item.source_department,
        item.source_description,
        item.mapping_status,
        item.import_batch_id
      ]
    }));

    await client.batch(queries);
    console.log(`${batchData.length} staging records inserted successfully.`);
  } catch (error) {
    console.error("Error inserting batch staging data:", error);
    throw error;
  }
}

// Get staging mapping statistics
export async function getStagingMappingStats(): Promise<{ mapped: number; unmapped: number; partial: number; total: number }> {
  try {
    const result = await client.execute({
      sql: `
        SELECT
          mapping_status,
          COUNT(*) as count
        FROM financial_data_staging
        GROUP BY mapping_status
      `,
      args: []
    });

    const stats = {
      mapped: 0,
      unmapped: 0,
      partial: 0,
      total: 0
    };

    for (const row of result.rows) {
      const status = row.mapping_status as string;
      const count = row.count as number;

      stats.total += count;

      if (status === 'mapped') {
        stats.mapped = count;
      } else if (status === 'unmapped') {
        stats.unmapped = count;
      } else if (status === 'partial') {
        stats.partial = count;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting staging mapping stats:", error);
    throw error;
  }
}

// Get unmapped accounts from staging
export async function getUnmappedAccounts(): Promise<Array<{ source_account: string; source_description: string; row_count: number; total_amount: number }>> {
  try {
    const result = await client.execute({
      sql: `
        SELECT
          source_account,
          source_description,
          COUNT(*) as row_count,
          SUM(amount) as total_amount
        FROM financial_data_staging
        WHERE mapping_status IN ('unmapped', 'partial')
        GROUP BY source_account, source_description
        ORDER BY row_count DESC
      `,
      args: []
    });

    return result.rows.map((row) => ({
      source_account: row.source_account as string,
      source_description: row.source_description as string,
      row_count: row.row_count as number,
      total_amount: row.total_amount as number
    }));
  } catch (error) {
    console.error("Error getting unmapped accounts:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- MAPPING TABLES FUNCTIONS (Account Maps, Department Maps, Combos) ------------------------------------------
//------------------------------------------------------------------------------------------------------------------

/**
 * Get the current mapping tables version
 */
export async function getMappingTablesVersion(): Promise<MappingTablesVersion | null> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM mapping_tables_version WHERE id = 1",
      args: []
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      version: row.version as string,
      combo_version: row.combo_version as string,
      last_updated: row.last_updated as string
    };
  } catch (error) {
    console.error("Error getting mapping tables version:", error);
    throw error;
  }
}

/**
 * Update or insert the mapping tables version
 */
export async function setMappingTablesVersion(version: string, comboVersion: string): Promise<void> {
  try {
    await client.execute({
      sql: `
        INSERT INTO mapping_tables_version (id, version, combo_version, last_updated)
        VALUES (1, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          version = excluded.version,
          combo_version = excluded.combo_version,
          last_updated = CURRENT_TIMESTAMP
      `,
      args: [version, comboVersion]
    });
    console.log(`Updated mapping tables version to ${version}, combo version to ${comboVersion}`);
  } catch (error) {
    console.error("Error setting mapping tables version:", error);
    throw error;
  }
}

/**
 * Store account maps in bulk (replaces all existing data)
 */
export async function storeAccountMaps(accountMaps: AccountMap[]): Promise<void> {
  try {
    // Clear existing data
    await client.execute({
      sql: "DELETE FROM account_maps",
      args: []
    });

    if (accountMaps.length === 0) {
      console.log("No account maps to store");
      return;
    }

    // Insert new data in batches
    const batchSize = 100;
    for (let i = 0; i < accountMaps.length; i += batchSize) {
      const batch = accountMaps.slice(i, i + batchSize);
      const insertStatements = batch.map(am => ({
        sql: `
          INSERT INTO account_maps (
            base_account, level_0, level_1, level_2, level_3, level_4, level_5, level_6, level_7, level_8, level_9,
            level_10, level_11, level_12, level_13, level_14, level_15, level_16, level_17, level_18, level_19,
            level_20, level_21, level_22, level_23, level_24, level_25, level_26, level_27, level_28, level_29,
            level_30, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          am.base_account, am.level_0 ?? null, am.level_1 ?? null, am.level_2 ?? null, am.level_3 ?? null, am.level_4 ?? null, am.level_5 ?? null, am.level_6 ?? null,
          am.level_7 ?? null, am.level_8 ?? null, am.level_9 ?? null, am.level_10 ?? null, am.level_11 ?? null, am.level_12 ?? null, am.level_13 ?? null, am.level_14 ?? null,
          am.level_15 ?? null, am.level_16 ?? null, am.level_17 ?? null, am.level_18 ?? null, am.level_19 ?? null, am.level_20 ?? null, am.level_21 ?? null, am.level_22 ?? null,
          am.level_23 ?? null, am.level_24 ?? null, am.level_25 ?? null, am.level_26 ?? null, am.level_27 ?? null, am.level_28 ?? null, am.level_29 ?? null, am.level_30 ?? null,
          am.description ?? null
        ]
      }));

      await client.batch(insertStatements);
    }

    console.log(`Stored ${accountMaps.length} account maps`);
  } catch (error) {
    console.error("Error storing account maps:", error);
    throw error;
  }
}

/**
 * Store department maps in bulk (replaces all existing data)
 */
export async function storeDepartmentMaps(departmentMaps: DepartmentMap[]): Promise<void> {
  try {
    // Clear existing data
    await client.execute({
      sql: "DELETE FROM department_maps",
      args: []
    });

    if (departmentMaps.length === 0) {
      console.log("No department maps to store");
      return;
    }

    // Insert new data in batches
    const batchSize = 100;
    for (let i = 0; i < departmentMaps.length; i += batchSize) {
      const batch = departmentMaps.slice(i, i + batchSize);
      const insertStatements = batch.map(dm => ({
        sql: `
          INSERT INTO department_maps (
            base_department, level_0, level_1, level_2, level_3, level_4, level_5, level_6, level_7, level_8, level_9,
            level_10, level_11, level_12, level_13, level_14, level_15, level_16, level_17, level_18, level_19,
            level_20, level_21, level_22, level_23, level_24, level_25, level_26, level_27, level_28, level_29,
            level_30, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          dm.base_department, dm.level_0 ?? null, dm.level_1 ?? null, dm.level_2 ?? null, dm.level_3 ?? null, dm.level_4 ?? null, dm.level_5 ?? null, dm.level_6 ?? null,
          dm.level_7 ?? null, dm.level_8 ?? null, dm.level_9 ?? null, dm.level_10 ?? null, dm.level_11 ?? null, dm.level_12 ?? null, dm.level_13 ?? null, dm.level_14 ?? null,
          dm.level_15 ?? null, dm.level_16 ?? null, dm.level_17 ?? null, dm.level_18 ?? null, dm.level_19 ?? null, dm.level_20 ?? null, dm.level_21 ?? null, dm.level_22 ?? null,
          dm.level_23 ?? null, dm.level_24 ?? null, dm.level_25 ?? null, dm.level_26 ?? null, dm.level_27 ?? null, dm.level_28 ?? null, dm.level_29 ?? null, dm.level_30 ?? null,
          dm.description ?? null
        ]
      }));

      await client.batch(insertStatements);
    }

    console.log(`Stored ${departmentMaps.length} department maps`);
  } catch (error) {
    console.error("Error storing department maps:", error);
    throw error;
  }
}

/**
 * Store account-department combos in bulk (replaces all existing data)
 */
export async function storeAccountDepartmentCombos(combos: AccountDepartmentCombo[]): Promise<void> {
  try {
    // Clear existing data
    await client.execute({
      sql: "DELETE FROM account_department_combos",
      args: []
    });

    if (combos.length === 0) {
      console.log("No combos to store");
      return;
    }

    // Insert new data in batches
    const batchSize = 100;
    for (let i = 0; i < combos.length; i += batchSize) {
      const batch = combos.slice(i, i + batchSize);
      const insertStatements = batch.map(combo => ({
        sql: `
          INSERT INTO account_department_combos (account, department, description)
          VALUES (?, ?, ?)
        `,
        args: [combo.account, combo.department, combo.description]
      }));

      await client.batch(insertStatements);
    }

    console.log(`Stored ${combos.length} account-department combos`);
  } catch (error) {
    console.error("Error storing account-department combos:", error);
    throw error;
  }
}

/**
 * Get all account maps
 */
export async function getAccountMaps(): Promise<AccountMap[]> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM account_maps ORDER BY base_account",
      args: []
    });

    return result.rows.map(row => ({
      base_account: row.base_account as string,
      level_0: row.level_0 as string,
      level_1: row.level_1 as string,
      level_2: row.level_2 as string,
      level_3: row.level_3 as string,
      level_4: row.level_4 as string,
      level_5: row.level_5 as string,
      level_6: row.level_6 as string,
      level_7: row.level_7 as string,
      level_8: row.level_8 as string,
      level_9: row.level_9 as string,
      level_10: row.level_10 as string,
      level_11: row.level_11 as string,
      level_12: row.level_12 as string,
      level_13: row.level_13 as string,
      level_14: row.level_14 as string,
      level_15: row.level_15 as string,
      level_16: row.level_16 as string,
      level_17: row.level_17 as string,
      level_18: row.level_18 as string,
      level_19: row.level_19 as string,
      level_20: row.level_20 as string,
      level_21: row.level_21 as string,
      level_22: row.level_22 as string,
      level_23: row.level_23 as string,
      level_24: row.level_24 as string,
      level_25: row.level_25 as string,
      level_26: row.level_26 as string,
      level_27: row.level_27 as string,
      level_28: row.level_28 as string,
      level_29: row.level_29 as string,
      level_30: row.level_30 as string,
      description: row.description as string
    }));
  } catch (error) {
    console.error("Error getting account maps:", error);
    throw error;
  }
}

/**
 * Get all department maps
 */
export async function getDepartmentMaps(): Promise<DepartmentMap[]> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM department_maps ORDER BY base_department",
      args: []
    });

    return result.rows.map(row => ({
      base_department: row.base_department as string,
      level_0: row.level_0 as string,
      level_1: row.level_1 as string,
      level_2: row.level_2 as string,
      level_3: row.level_3 as string,
      level_4: row.level_4 as string,
      level_5: row.level_5 as string,
      level_6: row.level_6 as string,
      level_7: row.level_7 as string,
      level_8: row.level_8 as string,
      level_9: row.level_9 as string,
      level_10: row.level_10 as string,
      level_11: row.level_11 as string,
      level_12: row.level_12 as string,
      level_13: row.level_13 as string,
      level_14: row.level_14 as string,
      level_15: row.level_15 as string,
      level_16: row.level_16 as string,
      level_17: row.level_17 as string,
      level_18: row.level_18 as string,
      level_19: row.level_19 as string,
      level_20: row.level_20 as string,
      level_21: row.level_21 as string,
      level_22: row.level_22 as string,
      level_23: row.level_23 as string,
      level_24: row.level_24 as string,
      level_25: row.level_25 as string,
      level_26: row.level_26 as string,
      level_27: row.level_27 as string,
      level_28: row.level_28 as string,
      level_29: row.level_29 as string,
      level_30: row.level_30 as string,
      description: row.description as string
    }));
  } catch (error) {
    console.error("Error getting department maps:", error);
    throw error;
  }
}

/**
 * Get all account-department combos
 */
export async function getAccountDepartmentCombos(): Promise<AccountDepartmentCombo[]> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM account_department_combos ORDER BY account, department",
      args: []
    });

    return result.rows.map(row => ({
      id: row.id as number,
      account: row.account as string,
      department: row.department as string,
      description: row.description as string
    }));
  } catch (error) {
    console.error("Error getting account-department combos:", error);
    throw error;
  }
}

/**
 * Validate if an account-department combination is valid
 */
export async function isValidCombo(account: string, department: string): Promise<boolean> {
  try {
    const result = await client.execute({
      sql: "SELECT COUNT(*) as count FROM account_department_combos WHERE account = ? AND department = ?",
      args: [account, department]
    });

    const count = result.rows[0].count as number;
    return count > 0;
  } catch (error) {
    console.error("Error validating combo:", error);
    throw error;
  }
}

/**
 * Get account map by base_account
 */
export async function getAccountMapByBase(baseAccount: string): Promise<AccountMap | null> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM account_maps WHERE base_account = ?",
      args: [baseAccount]
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      base_account: row.base_account as string,
      level_0: row.level_0 as string,
      level_1: row.level_1 as string,
      level_2: row.level_2 as string,
      level_3: row.level_3 as string,
      level_4: row.level_4 as string,
      level_5: row.level_5 as string,
      level_6: row.level_6 as string,
      level_7: row.level_7 as string,
      level_8: row.level_8 as string,
      level_9: row.level_9 as string,
      level_10: row.level_10 as string,
      level_11: row.level_11 as string,
      level_12: row.level_12 as string,
      level_13: row.level_13 as string,
      level_14: row.level_14 as string,
      level_15: row.level_15 as string,
      level_16: row.level_16 as string,
      level_17: row.level_17 as string,
      level_18: row.level_18 as string,
      level_19: row.level_19 as string,
      level_20: row.level_20 as string,
      level_21: row.level_21 as string,
      level_22: row.level_22 as string,
      level_23: row.level_23 as string,
      level_24: row.level_24 as string,
      level_25: row.level_25 as string,
      level_26: row.level_26 as string,
      level_27: row.level_27 as string,
      level_28: row.level_28 as string,
      level_29: row.level_29 as string,
      level_30: row.level_30 as string,
      description: row.description as string
    };
  } catch (error) {
    console.error("Error getting account map:", error);
    throw error;
  }
}

/**
 * Get department map by base_department
 */
export async function getDepartmentMapByBase(baseDepartment: string): Promise<DepartmentMap | null> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM department_maps WHERE base_department = ?",
      args: [baseDepartment]
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      base_department: row.base_department as string,
      level_0: row.level_0 as string,
      level_1: row.level_1 as string,
      level_2: row.level_2 as string,
      level_3: row.level_3 as string,
      level_4: row.level_4 as string,
      level_5: row.level_5 as string,
      level_6: row.level_6 as string,
      level_7: row.level_7 as string,
      level_8: row.level_8 as string,
      level_9: row.level_9 as string,
      level_10: row.level_10 as string,
      level_11: row.level_11 as string,
      level_12: row.level_12 as string,
      level_13: row.level_13 as string,
      level_14: row.level_14 as string,
      level_15: row.level_15 as string,
      level_16: row.level_16 as string,
      level_17: row.level_17 as string,
      level_18: row.level_18 as string,
      level_19: row.level_19 as string,
      level_20: row.level_20 as string,
      level_21: row.level_21 as string,
      level_22: row.level_22 as string,
      level_23: row.level_23 as string,
      level_24: row.level_24 as string,
      level_25: row.level_25 as string,
      level_26: row.level_26 as string,
      level_27: row.level_27 as string,
      level_28: row.level_28 as string,
      level_29: row.level_29 as string,
      level_30: row.level_30 as string,
      description: row.description as string
    };
  } catch (error) {
    console.error("Error getting department map:", error);
    throw error;
  }
}

//------------------------------------------------------------------------------------------------------------------
//--- FINANCIAL DATA IMPORT FUNCTIONS ------------------------------------------------------------------------------

/**
 * Store financial data from API import
 * This truncates existing data for the OU and replaces with new data
 */
export async function storeFinancialData(ou: string, records: any[]) {
  if (!Array.isArray(records) || records.length === 0) {
    console.log("No records to store");
    return;
  }

  try {
    // Disable foreign key constraints temporarily for this import
    await client.execute("PRAGMA foreign_keys = OFF");

    // Delete all existing data for this OU (truncate and replace approach)
    await client.execute({
      sql: "DELETE FROM financial_data WHERE ou = ?",
      args: [ou]
    });

    const batchQueries: { sql: string; args: any[] }[] = [];

    // Insert all new records
    for (const record of records) {
      // Parse period (YYYY-MM format)
      const [yearStr, monthStr] = record.period.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      // Create a combo ID from department and account
      const dep_acc_combo_id = `${record.department}_${record.account}`;

      // Insert query - since we deleted all data for this OU, no conflicts
      const insertQuery = `
        INSERT INTO financial_data (
          dep_acc_combo_id, month, year, period_combo, scenario,
          amount, currency, ou, department, account, version, last_modified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      batchQueries.push({
        sql: insertQuery,
        args: [
          dep_acc_combo_id,
          month,
          year,
          record.period,
          record.scenario,
          record.amount / 100, // Convert from cents to currency units
          record.currency,
          ou,
          record.department,
          record.account,
          record.version
        ]
      });
    }

    // Execute batch insert
    await client.batch(batchQueries);

    // Re-enable foreign key constraints
    await client.execute("PRAGMA foreign_keys = ON");

    console.log(`Successfully stored ${records.length} financial records for OU ${ou}`);
  } catch (error) {
    // Make sure to re-enable foreign keys even if there's an error
    try {
      await client.execute("PRAGMA foreign_keys = ON");
    } catch (pragmaError) {
      console.error("Error re-enabling foreign keys:", pragmaError);
    }
    console.error("Error storing financial data:", error);
    throw error;
  }
}

/**
 * Get count of stored financial data records for an OU
 */
export async function getFinancialDataCount(ou: string): Promise<number> {
  try {
    const result = await client.execute({
      sql: `SELECT COUNT(*) as count FROM financial_data WHERE ou = ?`,
      args: [ou]
    });

    return result.rows[0]?.count as number || 0;
  } catch (error) {
    console.error("Error getting financial data count:", error);
    return 0;
  }
}

/**
 * Get last import timestamp for an OU
 */
export async function getFinancialDataLastImport(ou: string): Promise<string | null> {
  try {
    const result = await client.execute({
      sql: `SELECT MAX(last_modified) as last_import FROM financial_data WHERE ou = ?`,
      args: [ou]
    });

    return result.rows[0]?.last_import as string || null;
  } catch (error) {
    console.error("Error getting last import timestamp:", error);
    return null;
  }
}

//------------------------------------------------------------------------------------------------------------------
//----------------- CACHE METADATA FUNCTIONS ---------------------------------------------------------------------

/**
 * Update cache metadata for a specific key
 */
export async function updateCacheMetadata(
  key: string,
  status: 'idle' | 'fetching' | 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await client.execute({
      sql: `
        INSERT INTO cache_metadata (key, last_fetched_at, fetch_status, error_message)
        VALUES (?, CURRENT_TIMESTAMP, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          last_fetched_at = CURRENT_TIMESTAMP,
          fetch_status = excluded.fetch_status,
          error_message = excluded.error_message
      `,
      args: [key, status, errorMessage || null],
    });
  } catch (error) {
    console.error(`Error updating cache metadata for ${key}:`, error);
    throw error;
  }
}

/**
 * Get cache metadata for a specific key
 */
export async function getCacheMetadata(key: string): Promise<{
  last_fetched_at: string | null;
  fetch_status: string;
  error_message: string | null;
} | null> {
  try {
    const result = await client.execute({
      sql: `SELECT last_fetched_at, fetch_status, error_message FROM cache_metadata WHERE key = ?`,
      args: [key],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        last_fetched_at: row.last_fetched_at as string | null,
        fetch_status: row.fetch_status as string,
        error_message: row.error_message as string | null,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting cache metadata for ${key}:`, error);
    return null;
  }
}

/**
 * Check if cache needs refresh (older than specified minutes)
 */
export async function shouldRefreshCache(key: string, maxAgeMinutes: number = 60): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata(key);

    if (!metadata || !metadata.last_fetched_at) {
      return true; // No cache, needs refresh
    }

    // Check if cache is too old
    const lastFetched = new Date(metadata.last_fetched_at);
    const now = new Date();
    const ageMinutes = (now.getTime() - lastFetched.getTime()) / (1000 * 60);

    return ageMinutes > maxAgeMinutes;
  } catch (error) {
    console.error(`Error checking cache age for ${key}:`, error);
    return true; // On error, assume refresh needed
  }
}

//------------------------------------------------------------------------------------------------------------------
//------VALIDATION FUNCTIONS --------------------------------------------------------------------------------------

/**
 * Store validations for an OU
 */
export async function storeValidations(ou: string, validations: Array<{
  id: number;
  name: string;
  display_name: string;
  is_required: boolean;
  description: string;
  sequence: number;
}>): Promise<void> {
  try {
    await client.execute("BEGIN TRANSACTION");

    try {
      // Delete existing validations for this OU
      await client.execute({
        sql: "DELETE FROM validations WHERE ou = ?",
        args: [ou],
      });

      // Insert new validations
      for (const validation of validations) {
        await client.execute({
          sql: `
            INSERT INTO validations (
              id, ou, name, display_name, is_required, description, sequence, cached_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `,
          args: [
            validation.id,
            ou,
            validation.name,
            validation.display_name,
            validation.is_required ? 1 : 0,
            validation.description,
            validation.sequence,
          ],
        });
      }

      await client.execute("COMMIT");
      console.log(`Stored ${validations.length} validations for OU ${ou}`);
    } catch (error) {
      await client.execute("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error(`Error storing validations for OU ${ou}:`, error);
    throw error;
  }
}

/**
 * Get validations for an OU
 */
export async function getValidations(ou: string): Promise<Array<{
  id: number;
  name: string;
  display_name: string;
  is_required: boolean;
  description: string;
  sequence: number;
}> | null> {
  try {
    const result = await client.execute({
      sql: `
        SELECT id, name, display_name, is_required, description, sequence
        FROM validations
        WHERE ou = ?
        ORDER BY sequence ASC
      `,
      args: [ou],
    });

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      display_name: row.display_name as string,
      is_required: row.is_required === 1,
      description: row.description as string,
      sequence: row.sequence as number,
    }));
  } catch (error) {
    console.error(`Error getting validations for OU ${ou}:`, error);
    return null;
  }
}
