const Database=require("better-sqlite3");
const path=require("path");
const fs=require("fs");
const DB_DIR=process.env.DB_PATH||path.join(__dirname,"../data");
const DB_FILE=path.join(DB_DIR,"kingdom-gym.db");
const BACKUP_DIR=path.join(DB_DIR,"backups");
if(!fs.existsSync(DB_DIR))fs.mkdirSync(DB_DIR,{recursive:true});
if(!fs.existsSync(BACKUP_DIR))fs.mkdirSync(BACKUP_DIR,{recursive:true});
const db=new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, color TEXT, icon TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS plans (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, duration INTEGER NOT NULL, price REAL NOT NULL, description TEXT, activity_id INTEGER, is_active INTEGER DEFAULT 1, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT NOT NULL, phone TEXT, email TEXT, gender TEXT DEFAULT "male", birth_date TEXT, notes TEXT, balance REAL DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL, plan_id INTEGER NOT NULL, amount_paid REAL NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL, notes TEXT, created_by INTEGER, created_at TEXT, FOREIGN KEY (member_id) REFERENCES members(id), FOREIGN KEY (plan_id) REFERENCES plans(id))`);

// Migrations for existing databases
try{db.exec("ALTER TABLE members ADD COLUMN balance REAL DEFAULT 0");}catch(e){}
try{db.exec("ALTER TABLE plans ADD COLUMN activity_id INTEGER");}catch(e){}

const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");

// Default admin
const adminExists=db.prepare("SELECT id FROM admins WHERE username=?").get("admin");
if(!adminExists){
  const bcrypt=require("bcryptjs");
  const hash=bcrypt.hashSync("admin123",10);
  db.prepare("INSERT INTO admins (username,password,name,created_at) VALUES (?,?,?,?)").run("admin",hash,"Administrator",now());
  console.log("Admin created: admin / admin123");
}

// Default activities
const actsCount=db.prepare("SELECT COUNT(*) as c FROM activities").get().c;
if(actsCount===0){
  const ins=db.prepare("INSERT OR IGNORE INTO activities (name,color,icon,created_at) VALUES (?,?,?,?)");
  const n=now();
  ins.run("Gym","#60a5fa","gym",n);
  ins.run("Karate","#E31E24","karate",n);
  ins.run("Box","#f59e0b","box",n);
  console.log("Default activities created");
}

// Default plans
const plansCount=db.prepare("SELECT COUNT(*) as c FROM plans").get().c;
if(plansCount===0){
  const gymId=db.prepare("SELECT id FROM activities WHERE name=?").get("Gym")?.id;
  const karateId=db.prepare("SELECT id FROM activities WHERE name=?").get("Karate")?.id;
  const boxId=db.prepare("SELECT id FROM activities WHERE name=?").get("Box")?.id;
  const ins=db.prepare("INSERT INTO plans (name,duration,price,activity_id,created_at) VALUES (?,?,?,?,?)");
  const n=now();
  ins.run("Gym - 1 Mois",30,70,gymId,n);
  ins.run("Gym - 3 Mois",90,150,gymId,n);
  ins.run("Gym - 6 Mois",180,250,gymId,n);
  ins.run("Karate - 1 Mois",30,70,karateId,n);
  ins.run("Karate - 3 Mois",90,150,karateId,n);
  ins.run("Karate - 6 Mois",180,250,karateId,n);
  ins.run("Box - 1 Mois",30,70,boxId,n);
  ins.run("Box - 3 Mois",90,150,boxId,n);
  ins.run("Box - 6 Mois",180,250,boxId,n);
  console.log("Default plans created");
}

// Link existing plans to activities if not linked
const unlinkedPlans=db.prepare("SELECT * FROM plans WHERE activity_id IS NULL").all();
if(unlinkedPlans.length>0){
  const acts=db.prepare("SELECT * FROM activities").all();
  acts.forEach(a=>{db.prepare("UPDATE plans SET activity_id=? WHERE name LIKE ? AND activity_id IS NULL").run(a.id,"%"+a.name+"%");});
  console.log("Plans linked to activities");
}

db.exec(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price REAL NOT NULL, description TEXT, stock INTEGER DEFAULT 0, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, product_name TEXT, unit_price REAL NOT NULL, quantity INTEGER NOT NULL DEFAULT 1, total REAL NOT NULL, notes TEXT, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS charges (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL, amount REAL NOT NULL, month TEXT NOT NULL, notes TEXT, created_at TEXT)`);

db.exec(`CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL, domain TEXT, salary REAL NOT NULL, phone TEXT, notes TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`);
db.exec(`CREATE TABLE IF NOT EXISTS salary_payments (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id INTEGER NOT NULL, employee_name TEXT NOT NULL, amount REAL NOT NULL, month TEXT NOT NULL, notes TEXT, created_at TEXT)`);

function autoBackup(){
  try{
    const today=new Date().toISOString().slice(0,10);
    const backupFile=path.join(BACKUP_DIR,"kingdom-gym-"+today+".db");
    if(!fs.existsSync(backupFile)){db.backup(backupFile);console.log("Backup:",backupFile);}
  }catch(e){console.error("Backup error:",e.message);}
}
autoBackup();
module.exports=db;
