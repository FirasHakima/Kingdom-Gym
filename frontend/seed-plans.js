const Database = require("better-sqlite3");
const path = require("path");
const DB_FILE = path.join(__dirname, "../data/kingdom-gym.db");
const db = new Database(DB_FILE);
const now = () => new Date().toISOString().slice(0,19).replace("T"," ");

// Clear old plans and insert Kingdom Gym real plans
db.prepare("DELETE FROM plans").run();
const ins = db.prepare("INSERT INTO plans (name, duration, price, description, created_at) VALUES (?, ?, ?, ?, ?)");
const n = now();
ins.run("Gym - 1 Month",     30,  70,  "Gym access - 1 month",     n);
ins.run("Gym - 3 Months",    90,  150, "Gym access - 3 months",    n);
ins.run("Gym - 6 Months",    180, 250, "Gym access - 6 months",    n);
ins.run("Karate - 1 Month",  30,  70,  "Karate class - 1 month",   n);
ins.run("Karate - 3 Months", 90,  150, "Karate class - 3 months",  n);
ins.run("Karate - 6 Months", 180, 250, "Karate class - 6 months",  n);
ins.run("Box - 1 Month",     30,  70,  "Boxing class - 1 month",   n);
ins.run("Box - 3 Months",    90,  150, "Boxing class - 3 months",  n);
ins.run("Box - 6 Months",    180, 250, "Boxing class - 6 months",  n);

console.log("Plans updated!");
db.close();