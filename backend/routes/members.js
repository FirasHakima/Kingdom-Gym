const router = require("express").Router();
const db = require("../db");
const auth = require("../middleware/auth");
const now = () => new Date().toISOString().slice(0,19).replace("T"," ");

router.get("/", auth, (req, res) => {
  try {
    const { search, status } = req.query;
    const rows = db.prepare("SELECT * FROM members ORDER BY created_at DESC").all();
    const result = rows.map(m => {
      const payment = db.prepare("SELECT p.*, pl.name as plan_name FROM payments p JOIN plans pl ON pl.id = p.plan_id WHERE p.member_id = ? ORDER BY p.created_at DESC LIMIT 1").get(m.id);
      let subscription_status = "no_plan";
      if (payment) {
        const today = new Date().toISOString().slice(0,10);
        subscription_status = payment.end_date >= today ? "active" : "expired";
      }
      return { ...m, plan_name: payment ? payment.plan_name : null, subscription_end: payment ? payment.end_date : null, subscription_start: payment ? payment.start_date : null, subscription_status };
    });
    let filtered = result;
    if (search) { const s = search.toLowerCase(); filtered = filtered.filter(m => (m.full_name && m.full_name.toLowerCase().includes(s)) || (m.phone && m.phone.includes(s))); }
    if (status === "active")  filtered = filtered.filter(m => m.subscription_status === "active");
    if (status === "expired") filtered = filtered.filter(m => m.subscription_status !== "active");
    res.json(filtered);
  } catch(e) { console.error("MEMBERS ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

router.get("/:id", auth, (req, res) => {
  try {
    const member = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
    if (!member) return res.status(404).json({ error: "Not found" });
    const payments = db.prepare("SELECT p.*, pl.name as plan_name, pl.price as plan_price FROM payments p JOIN plans pl ON pl.id = p.plan_id WHERE p.member_id = ? ORDER BY p.created_at DESC").all(req.params.id);
    res.json({ ...member, payments });
  } catch(e) { console.error("MEMBER ID ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

router.post("/", auth, (req, res) => {
  try {
    const { full_name, phone, email, gender, birth_date, notes } = req.body;
    if (!full_name) return res.status(400).json({ error: "Full name required" });
    const r = db.prepare("INSERT INTO members (full_name, phone, email, gender, birth_date, notes, balance, created_at) VALUES (?,?,?,?,?,?,0,?)").run(full_name, phone||null, email||null, gender||"male", birth_date||null, notes||null, now());
    res.status(201).json(db.prepare("SELECT * FROM members WHERE id = ?").get(r.lastInsertRowid));
  } catch(e) { console.error("ADD MEMBER ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

router.post("/:id/pay-debt", auth, (req, res) => {
  try {
    const { amount, notes } = req.body;
    const member = db.prepare("SELECT * FROM members WHERE id=?").get(req.params.id);
    if (!member) return res.status(404).json({ error: "Not found" });
    const newBalance = (member.balance || 0) + +amount;
    db.prepare("UPDATE members SET balance=? WHERE id=?").run(newBalance, req.params.id);
    res.json({ success: true, balance: newBalance });
  } catch(e) { console.error("PAY DEBT ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

router.put("/:id", auth, (req, res) => {
  try {
    const { full_name, phone, email, gender, birth_date, notes, is_active } = req.body;
    const m = db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id);
    if (!m) return res.status(404).json({ error: "Not found" });
    db.prepare("UPDATE members SET full_name=?,phone=?,email=?,gender=?,birth_date=?,notes=?,is_active=? WHERE id=?").run(full_name??m.full_name, phone??m.phone, email??m.email, gender??m.gender, birth_date??m.birth_date, notes??m.notes, is_active??m.is_active, req.params.id);
    res.json(db.prepare("SELECT * FROM members WHERE id = ?").get(req.params.id));
  } catch(e) { console.error("UPDATE MEMBER ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

router.delete("/:id", auth, (req, res) => {
  try {
    db.prepare("DELETE FROM payments WHERE member_id = ?").run(req.params.id);
    db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
    res.json({ message: "Deleted" });
  } catch(e) { console.error("DELETE MEMBER ERROR:", e.message); res.status(500).json({ error: e.message }); }
});

module.exports = router;