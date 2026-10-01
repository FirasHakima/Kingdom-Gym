# Kingdom Gym - Full Setup Script
# Run this from PowerShell inside your "Kingdom Gym" folder
# Right-click the folder → "Open in Terminal" → paste this script

$ErrorActionPreference = "Stop"
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  KINGDOM GYM - Creating project files" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# ── Create folder structure ──────────────────────────────────────────────────
$folders = @(
    "backend\routes",
    "backend\middleware",
    "frontend\src\pages",
    "frontend\src\components",
    "frontend\public"
)
foreach ($f in $folders) {
    New-Item -ItemType Directory -Force -Path $f | Out-Null
}
Write-Host "✅ Folders created" -ForegroundColor Green

# ── backend\package.json ─────────────────────────────────────────────────────
@'
{
  "name": "kingdom-gym-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dayjs": "^1.11.10"
  }
}
'@ | Set-Content "backend\package.json" -Encoding UTF8

# ── backend\db.js ─────────────────────────────────────────────────────────────
@'
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = process.env.DB_PATH || path.join(__dirname, "../data");
const DB_FILE = path.join(DB_DIR, "kingdom-gym.db");
const BACKUP_DIR = path.join(DB_DIR, "backups");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime("now"))
  );
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime("now"))
  );
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    gender TEXT DEFAULT "male",
    birth_date TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime("now"))
  );
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount_paid REAL NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    notes TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime("now")),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  );
`);

const adminExists = db.prepare("SELECT id FROM admins WHERE username = ?").get("admin");
if (!adminExists) {
  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admins (username, password, name) VALUES (?, ?, ?)").run("admin", hash, "Administrator");
  console.log("✅ Default admin: admin / admin123");
}

const plansCount = db.prepare("SELECT COUNT(*) as c FROM plans").get().c;
if (plansCount === 0) {
  const ins = db.prepare("INSERT INTO plans (name, duration, price, description) VALUES (?, ?, ?, ?)");
  ins.run("Monthly", 30, 500, "Full access - 1 month");
  ins.run("Quarterly", 90, 1200, "Full access - 3 months");
  ins.run("Annual", 365, 4000, "Full access - 1 year");
  console.log("✅ Default plans created");
}

function autoBackup() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const backupFile = path.join(BACKUP_DIR, "kingdom-gym-" + today + ".db");
    if (!fs.existsSync(backupFile)) {
      db.backup(backupFile);
      console.log("✅ Backup: " + backupFile);
    }
  } catch (e) { console.error("Backup error:", e.message); }
}
autoBackup();

module.exports = db;
'@ | Set-Content "backend\db.js" -Encoding UTF8

# ── backend\middleware\auth.js ────────────────────────────────────────────────
@'
const jwt = require("jsonwebtoken");
const SECRET = "kingdom-gym-secret-2026";
module.exports = function(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try { req.admin = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
};
module.exports.SECRET = "kingdom-gym-secret-2026";
'@ | Set-Content "backend\middleware\auth.js" -Encoding UTF8

# ── backend\routes\auth.js ───────────────────────────────────────────────────
@'
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET } = require("../middleware/auth");

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Required" });
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: admin.id, username: admin.username, name: admin.name }, SECRET, { expiresIn: "12h" });
  res.json({ token, admin: { id: admin.id, name: admin.name, username: admin.username } });
});

router.post("/change-password", require("../middleware/auth"), (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const admin = db.prepare("SELECT * FROM admins WHERE id = ?").get(req.admin.id);
  if (!bcrypt.compareSync(oldPassword, admin.password))
    return res.status(400).json({ error: "Old password incorrect" });
  db.prepare("UPDATE admins SET password = ? WHERE id = ?").run(bcrypt.hashSync(newPassword, 10), req.admin.id);
  res.json({ message: "Password changed" });
});

module.exports = router;
'@ | Set-Content "backend\routes\auth.js" -Encoding UTF8

# ── backend\routes\members.js ────────────────────────────────────────────────
@'
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  const { search, status } = req.query;
  let query = `
    SELECT m.*,
      p.end_date as subscription_end,
      p.start_date as subscription_start,
      pl.name as plan_name,
      CASE
        WHEN p.end_date >= date("now") THEN "active"
        WHEN p.end_date IS NULL THEN "no_plan"
        ELSE "expired"
      END as subscription_status
    FROM members m
    LEFT JOIN payments p ON p.id = (SELECT id FROM payments WHERE member_id = m.id ORDER BY created_at DESC LIMIT 1)
    LEFT JOIN plans pl ON pl.id = p.plan_id
    WHERE 1=1
  `;
  const params = [];
  if (search) { query += " AND (m.full_name LIKE ? OR m.phone LIKE ?)"; params.push("%" + search + "%", "%" + search + "%"); }
  if (status === "active") query += " AND p.end_date >= date(\"now\")";
  if (status === "expired") query += " AND (p.end_date < date(\"now\") OR p.end_date IS NULL)";
  query += " ORDER BY m.created_at DESC";
  res.json(db.prepare(query).all(...params));
});

router.get("/:id", auth, (req, res) => {
  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
  if (!member) return res.status(404).json({ error: "Not found" });
  const payments = db.prepare(`SELECT p.*, pl.name as plan_name FROM payments p JOIN plans pl ON pl.id = p.plan_id WHERE p.member_id = ? ORDER BY p.created_at DESC`).all(req.params.id);
  res.json({ ...member, payments });
});

router.post("/", auth, (req, res) => {
  const { full_name, phone, email, gender, birth_date, notes } = req.body;
  if (!full_name) return res.status(400).json({ error: "Full name required" });
  const r = db.prepare("INSERT INTO members (full_name, phone, email, gender, birth_date, notes) VALUES (?,?,?,?,?,?)").run(full_name, phone||null, email||null, gender||"male", birth_date||null, notes||null);
  res.status(201).json(db.prepare("SELECT * FROM members WHERE id = ?").get(r.lastInsertRowid));
});

router.put("/:id", auth, (req, res) => {
  const { full_name, phone, email, gender, birth_date, notes, is_active } = req.body;
  const m = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
  if (!m) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE members SET full_name=?,phone=?,email=?,gender=?,birth_date=?,notes=?,is_active=? WHERE id=?").run(full_name??m.full_name, phone??m.phone, email??m.email, gender??m.gender, birth_date??m.birth_date, notes??m.notes, is_active??m.is_active, req.params.id);
  res.json(db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id));
});

router.delete("/:id", auth, (req, res) => {
  db.prepare("DELETE FROM payments WHERE member_id = ?").run(req.params.id);
  db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
'@ | Set-Content "backend\routes\members.js" -Encoding UTF8

# ── backend\routes\plans.js ──────────────────────────────────────────────────
@'
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => res.json(db.prepare("SELECT * FROM plans WHERE is_active=1 ORDER BY duration").all()));
router.post("/", auth, (req, res) => {
  const { name, duration, price, description } = req.body;
  if (!name||!duration||!price) return res.status(400).json({ error: "name, duration, price required" });
  const r = db.prepare("INSERT INTO plans (name,duration,price,description) VALUES (?,?,?,?)").run(name,duration,price,description||null);
  res.status(201).json(db.prepare("SELECT * FROM plans WHERE id=?").get(r.lastInsertRowid));
});
router.put("/:id", auth, (req, res) => {
  const { name, duration, price, description, is_active } = req.body;
  const p = db.prepare("SELECT * FROM plans WHERE id=?").get(req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  db.prepare("UPDATE plans SET name=?,duration=?,price=?,description=?,is_active=? WHERE id=?").run(name??p.name,duration??p.duration,price??p.price,description??p.description,is_active??p.is_active,req.params.id);
  res.json(db.prepare("SELECT * FROM plans WHERE id=?").get(req.params.id));
});
router.delete("/:id", auth, (req, res) => {
  db.prepare("UPDATE plans SET is_active=0 WHERE id=?").run(req.params.id);
  res.json({ message: "Deactivated" });
});
module.exports = router;
'@ | Set-Content "backend\routes\plans.js" -Encoding UTF8

# ── backend\routes\payments.js ───────────────────────────────────────────────
@'
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, (req, res) => {
  const { member_id } = req.query;
  let q = "SELECT p.*, m.full_name, pl.name as plan_name FROM payments p JOIN members m ON m.id=p.member_id JOIN plans pl ON pl.id=p.plan_id WHERE 1=1";
  const params = [];
  if (member_id) { q += " AND p.member_id=?"; params.push(member_id); }
  res.json(db.prepare(q + " ORDER BY p.created_at DESC").all(...params));
});

router.post("/", auth, (req, res) => {
  const { member_id, plan_id, amount_paid, start_date, notes } = req.body;
  if (!member_id||!plan_id||!amount_paid||!start_date) return res.status(400).json({ error: "Missing fields" });
  const plan = db.prepare("SELECT * FROM plans WHERE id=?").get(plan_id);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  const end = new Date(start_date);
  end.setDate(end.getDate() + plan.duration);
  const end_date = end.toISOString().slice(0,10);
  const r = db.prepare("INSERT INTO payments (member_id,plan_id,amount_paid,start_date,end_date,notes,created_by) VALUES (?,?,?,?,?,?,?)").run(member_id,plan_id,amount_paid,start_date,end_date,notes||null,req.admin.id);
  res.status(201).json(db.prepare("SELECT p.*, m.full_name, pl.name as plan_name FROM payments p JOIN members m ON m.id=p.member_id JOIN plans pl ON pl.id=p.plan_id WHERE p.id=?").get(r.lastInsertRowid));
});

module.exports = router;
'@ | Set-Content "backend\routes\payments.js" -Encoding UTF8

# ── backend\routes\dashboard.js ──────────────────────────────────────────────
@'
const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");

router.get("/stats", auth, (req, res) => {
  const totalMembers = db.prepare("SELECT COUNT(*) as c FROM members").get().c;
  const activeMembers = db.prepare("SELECT COUNT(DISTINCT m.id) as c FROM members m JOIN payments p ON p.member_id=m.id WHERE p.end_date >= date(\"now\")").get().c;
  const revenueThisMonth = db.prepare("SELECT COALESCE(SUM(amount_paid),0) as t FROM payments WHERE strftime(\"%Y-%m\",created_at)=strftime(\"%Y-%m\",\"now\")").get().t;
  const revenueToday = db.prepare("SELECT COALESCE(SUM(amount_paid),0) as t FROM payments WHERE date(created_at)=date(\"now\")").get().t;
  const newMembersMonth = db.prepare("SELECT COUNT(*) as c FROM members WHERE strftime(\"%Y-%m\",created_at)=strftime(\"%Y-%m\",\"now\")").get().c;
  const expiringSoon = db.prepare("SELECT m.full_name, m.phone, p.end_date, pl.name as plan_name FROM members m JOIN payments p ON p.id=(SELECT id FROM payments WHERE member_id=m.id ORDER BY created_at DESC LIMIT 1) JOIN plans pl ON pl.id=p.plan_id WHERE p.end_date BETWEEN date(\"now\") AND date(\"now\",\"+7 days\") ORDER BY p.end_date").all();
  const monthlyRevenue = db.prepare("SELECT strftime(\"%Y-%m\",created_at) as month, SUM(amount_paid) as total FROM payments WHERE created_at >= date(\"now\",\"-6 months\") GROUP BY month ORDER BY month").all();
  res.json({ totalMembers, activeMembers, expiredMembers: totalMembers - activeMembers, revenueThisMonth, revenueToday, newMembersMonth, expiringSoon, monthlyRevenue });
});

module.exports = router;
'@ | Set-Content "backend\routes\dashboard.js" -Encoding UTF8

# ── backend\server.js ─────────────────────────────────────────────────────────
@'
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../data/uploads")));

const buildPath = path.join(__dirname, "../frontend/build");
const fs = require("fs");
if (fs.existsSync(buildPath)) app.use(express.static(buildPath));

require("./db");

app.use("/api/auth", require("./routes/auth"));
app.use("/api/members", require("./routes/members"));
app.use("/api/plans", require("./routes/plans"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

if (fs.existsSync(buildPath)) {
  app.get("*", (req, res) => res.sendFile(path.join(buildPath, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, "127.0.0.1", () => {
  console.log("\n Gym Manager running: http://127.0.0.1:" + PORT);
  console.log("   Login: admin / admin123\n");
});
'@ | Set-Content "backend\server.js" -Encoding UTF8

Write-Host "✅ All backend files created" -ForegroundColor Green

# ── frontend\package.json ─────────────────────────────────────────────────────
@'
{
  "name": "kingdom-gym-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "axios": "^1.6.8",
    "recharts": "^2.12.3",
    "react-hot-toast": "^2.4.1",
    "dayjs": "^1.11.10",
    "lucide-react": "^0.378.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  "proxy": "http://127.0.0.1:3001",
  "browserslist": { "production": [">0.2%","not dead"], "development": ["last 1 chrome version"] }
}
'@ | Set-Content "frontend\package.json" -Encoding UTF8

# ── frontend\public\index.html ───────────────────────────────────────────────
@'
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Kingdom Gym Manager</title></head>
  <body><div id="root"></div></body>
</html>
'@ | Set-Content "frontend\public\index.html" -Encoding UTF8

Write-Host "✅ Frontend base files created" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  NOW RUN THESE COMMANDS:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "  cd backend" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor Cyan
Write-Host ""
Write-Host "  cd ..\frontend" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor Cyan
Write-Host "  npm run build" -ForegroundColor Cyan
Write-Host ""
Write-Host "  cd ..\backend" -ForegroundColor Cyan
Write-Host "  node server.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then open: http://127.0.0.1:3001" -ForegroundColor Green
Write-Host ""
