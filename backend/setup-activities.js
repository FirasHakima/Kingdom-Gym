const Database=require("better-sqlite3");
const path=require("path");
const db=new Database(path.join(__dirname,"../data/kingdom-gym.db"));
db.pragma("foreign_keys=OFF");
const now=()=>new Date().toISOString().slice(0,19).replace("T"," ");
db.exec(`CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, color TEXT, icon TEXT, is_active INTEGER DEFAULT 1, created_at TEXT)`);
try{db.exec("ALTER TABLE plans ADD COLUMN activity_id INTEGER");}catch(e){console.log("activity_id already exists");}
const ins=db.prepare("INSERT OR IGNORE INTO activities (name,color,icon,created_at) VALUES (?,?,?,?)");
const n=now();
ins.run("Gym","#60a5fa","gym",n);
ins.run("Karate","#E31E24","karate",n);
ins.run("Box","#f59e0b","box",n);
const acts=db.prepare("SELECT * FROM activities").all();
acts.forEach(a=>{db.prepare("UPDATE plans SET activity_id=? WHERE name LIKE ?").run(a.id,"%"+a.name+"%");});
console.log("Activities:",JSON.stringify(db.prepare("SELECT * FROM activities").all()));
console.log("Plans:",JSON.stringify(db.prepare("SELECT id,name,activity_id FROM plans").all()));
db.close();
console.log("Done!");