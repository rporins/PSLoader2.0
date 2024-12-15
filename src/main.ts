import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import Database, { Database as DatabaseType } from "better-sqlite3-multiple-ciphers";
import fs from "fs";
import faker from "@faker-js/faker";
import dotenv from "dotenv";

dotenv.config();
//test new updates
const secretKey = process.env.TEMP_DB_KEY; // will be pulled from the server and used for creation, encryption, and decryption of the database

interface Department {
  id: number;
  name: string;
  created_at: string;
}

interface Account {
  id: number;
  name: string;
  created_at: string;
}

interface DepartmentAccount {
  id: number;
  department_id: number;
  account_id: number;
  created_at: string;
}

interface Budget {
  id: number;
  department_account_id: number;
  month: string;
  year: number;
  amount: number;
  created_at: string;
}

let db: DatabaseType;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

function generatePeriods(startPeriod: string, numberOfPeriods: number): string[] {
  const periods: string[] = [];
  let [year, month] = startPeriod.split("-").map(Number);

  for (let i = 0; i < numberOfPeriods; i++) {
    periods.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return periods;
}

// Function to handle IPC request
async function handleIpcRequest(event: Electron.IpcMainEvent, request: string, ...args: unknown[]) {
  console.log("IPC request:", request, args); // disable in production

  switch (request) {
    case "Get12periods":
      {
        // Validation for args[0] and args[1]
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

        const getFinancialData = db.prepare(
          `SELECT 
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
          GROUP BY fd.dep_acc_combo_id, d.d_easy_name, a.a_easy_name`
        );

        const numberOfPeriods = 12;
        const periods = generatePeriods(period, numberOfPeriods); // Array of 'YYYY-MM' strings
        const params = [...periods, scenario];
        const rows = getFinancialData.all(...params);

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

        let idCounter = 1;

        const result = rows.map((row: FinancialDataRow) => ({
          id: idCounter++, // Increment id for each row
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
      }
      break;

    case "Update12periods":
      {
        // Validation for args[0] and args[1]
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
        let data;
        try {
          data = JSON.parse(args[2] as string);
        } catch (e) {
          throw new Error("Invalid JSON data in args[2].");
        }

        const periods = generatePeriods(period, 12); // Generate 12 periods starting from period

        // Prepare the SQL statements
        const updateFinancialData = db.prepare(`
    UPDATE financial_data SET
      amount = ?,
      last_modified = CURRENT_TIMESTAMP,
      item_version = item_version + 1
    WHERE dep_acc_combo_id = ? AND period_combo = ? AND scenario = ?
  `);

        const insertFinancialData = db.prepare(`
    INSERT INTO financial_data (
      dep_acc_combo_id, month, year, period_combo, scenario, amount, count, currency, last_modified, item_version
    ) VALUES (
      ?, ?, ?, ?, ?, ?, NULL, 'USD', CURRENT_TIMESTAMP, 1
    )
  `);

        // Begin a transaction for data integrity
        const transaction = db.transaction(() => {
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

            const updateResult = updateFinancialData.run(amount, dep_acc_combo_id, currentPeriod, scenario);

            if (updateResult.changes === 0) {
              // No existing record, insert new one
              insertFinancialData.run(dep_acc_combo_id, month, year, currentPeriod, scenario, amount);
            }
          }
        });

        try {
          transaction();
          return "Data updated successfully.";
        } catch (e) {
          throw new Error(`Failed to update data: ${e.message}`);
        }
      }
      break;
  }

  // Send a response back to the renderer process
}

app.whenReady().then(() => {
  // Get the path to the app's user data directory (e.g., AppData on Windows)
  ipcMain.handle("ipcMain", handleIpcRequest);

  const documentsPath = app.getPath("documents");
  const rebyterFolderPath = path.join(documentsPath, "Rebyter");
  // Set the SQLite database file path
  // Ensure the "rebyter" folder exists, create it if it doesn't
  if (!fs.existsSync(rebyterFolderPath)) {
    fs.mkdirSync(rebyterFolderPath, { recursive: true });
  }

  const dbPath = path.join(rebyterFolderPath, "planning-tool.db");

  const dbExists = fs.existsSync(dbPath);

  db = new Database(dbPath);
  db.pragma(`cipher='sqlcipher'`);
  db.pragma(`legacy=4`);

  if (dbExists) {
    db.pragma(`key='${secretKey}'`);
    db.pragma("journal_mode = WAL");
    console.log("Database opened successfully at:", dbPath);
  } else {
    db.pragma(`rekey='${secretKey}'`);
    db.pragma("journal_mode = WAL");
    console.log("Database created successfully at:", dbPath);
    // Create tables using prepared statements
    try {
      // Create departments table
      db.prepare(
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
            `
      ).run();
      console.log("Departments table created or already exists.");

      // Create accounts table
      db.prepare(
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
            `
      ).run();
      console.log("Accounts table created or already exists.");

      // Create department_accounts table
      db.prepare(
        `
                  CREATE TABLE IF NOT EXISTS department_accounts (
                      dep_acc_combo_id TEXT PRIMARY KEY,  
                      department_id TEXT NOT NULL,    
                      account_id TEXT NOT NULL,
                      is_locked BOOLEAN NOT NULL DEFAULT 0,    
                      FOREIGN KEY(department_id) REFERENCES departments(department_id),
                      FOREIGN KEY(account_id) REFERENCES accounts(account_id)
                  )
            `
      ).run();
      console.log("Department-Account combinations table created or already exists.");

      // Create budgets table
      db.prepare(
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
                      PRIMARY KEY (dep_acc_combo_id, period_combo, version)
                  )
            `
      ).run();
      console.log("financial_data table created or already exists.");
    } catch (error) {
      console.error("Error creating tables:", (error as Error).message);
    } finally {
      // Optional: Close the database connection if it's not needed anymore
      // db.close();
    }
  }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
