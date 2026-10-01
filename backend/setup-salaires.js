const Database=require("better-sqlite3");
const path=require("path");
const db=new Database(path.join(__dirname,"../data/kingdom-gym.db"));
db.pragma("foreign_keys=OFF");
db.exec(`CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  domain TEXT,
  salary REAL NOT NULL,
  phone TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT
)`);
db.exec(`CREATE TABLE IF NOT EXISTS salary_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  amount REAL NOT NULL,
  month TEXT NOT NULL,
  notes TEXT,
  created_at TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
)`);
console.log("Tables created!");
console.log("Employees:",db.prepare("SELECT COUNT(*) as c FROM employees").get().c);
console.log("Salary payments:",db.prepare("SELECT COUNT(*) as c FROM salary_payments").get().c);
db.close();